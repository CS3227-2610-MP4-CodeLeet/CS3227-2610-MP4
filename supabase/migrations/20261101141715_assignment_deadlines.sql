-- Forward-only: do not invent past deadlines or change existing source/timestamps.
alter table public.assignments add column due_at timestamptz
  check (due_at is null or isfinite(due_at));
grant select (due_at) on public.assignments to authenticated;

alter table public.submissions
  add column due_at_submission timestamptz,
  add column is_late boolean not null default false,
  add constraint submission_timing_consistent check (
    is_late = coalesce(created_at > due_at_submission, false)
  );
-- now() is transaction-start time; a save can wait on locks across a deadline.
alter table public.submissions alter column created_at set default clock_timestamp();

create function public.capture_submission_deadline()
returns trigger language plpgsql security invoker set search_path = '' as $function$
begin
  select due_at into new.due_at_submission from public.assignments
    where id = new.assignment_id for share;
  if not found then
    raise exception using errcode = 'P0002', message = 'assignment_unavailable';
  end if;
  new.is_late := coalesce(new.created_at > new.due_at_submission, false);
  return new;
end;
$function$;
revoke all on function public.capture_submission_deadline() from public, anon, authenticated;
create trigger capture_submission_deadline before insert on public.submissions
for each row execute function public.capture_submission_deadline();

-- Reuse existing auth, ownership, optimistic version and language/rubric locks.
-- Old six/seven-argument callers leave the due date unchanged.
create function public.save_assignment(
  p_assignment_id uuid, p_expected_version integer, p_title text,
  p_instructions text, p_criteria jsonb, p_publication_status text,
  p_language text, p_due_at timestamptz
)
returns public.assignments language plpgsql security definer set search_path = '' as $function$
declare
  v_assignment public.assignments;
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'instructor_required';
  end if;
  if p_due_at is not null and not isfinite(p_due_at) then
    raise exception using errcode = '22023', message = 'invalid_deadline';
  end if;
  v_assignment := public.save_assignment(p_assignment_id, p_expected_version,
    p_title, p_instructions, p_criteria, p_publication_status, p_language);
  update public.assignments set due_at = p_due_at
    where id = v_assignment.id and instructor_id = auth.uid()
    returning * into v_assignment;
  return v_assignment;
end;
$function$;
revoke all on function public.save_assignment(uuid,integer,text,text,jsonb,text,text,timestamptz) from public,anon;
grant execute on function public.save_assignment(uuid,integer,text,text,jsonb,text,text,timestamptz) to authenticated;

notify pgrst, 'reload schema';
