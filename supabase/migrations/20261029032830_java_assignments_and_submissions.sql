-- Forward-only expansion; existing revisions are backfilled without resetting data.
alter table public.assignments drop constraint assignments_language_check;
alter table public.assignments add constraint assignments_language_check check (language in ('python', 'java'));
alter table public.submissions add column language text;
update public.submissions s set language = a.language from public.assignments a where a.id = s.assignment_id;
alter table public.submissions alter column language set not null;
alter table public.submissions add constraint submissions_language_check check (language in ('python', 'java'));

create function public.capture_submission_language()
returns trigger language plpgsql security invoker set search_path = '' as $function$
begin
  select language into new.language from public.assignments where id = new.assignment_id for share;
  if not found then raise exception using errcode = 'P0002', message = 'assignment_unavailable'; end if;
  return new;
end;
$function$;
revoke all on function public.capture_submission_language() from public, anon, authenticated;
create trigger capture_submission_language before insert on public.submissions
for each row execute function public.capture_submission_language();

create function public.guard_assignment_language()
returns trigger language plpgsql security invoker set search_path = '' as $function$
begin
  if new.language is distinct from old.language and exists (
    select 1 from public.submissions where assignment_id = old.id
  ) then raise exception using errcode = '22023', message = 'assignment_language_locked'; end if;
  return new;
end;
$function$;
revoke all on function public.guard_assignment_language() from public, anon, authenticated;
create trigger guard_assignment_language before update of language on public.assignments
for each row execute function public.guard_assignment_language();

-- Keep the validated six-argument function for compatibility and rubric SRP.
-- This overload reuses its ownership/version checks and row lock atomically.
create function public.save_assignment(
  p_assignment_id uuid, p_expected_version integer, p_title text,
  p_instructions text, p_criteria jsonb, p_publication_status text, p_language text
)
returns public.assignments language plpgsql security definer set search_path = '' as $function$
declare
  v_assignment public.assignments;
begin
  if auth.uid() is null then raise exception using errcode = '42501', message = 'instructor_required'; end if;
  if p_language is null or p_language not in ('python', 'java') then
    raise exception using errcode = '22023', message = 'invalid_language';
  end if;
  v_assignment := public.save_assignment(p_assignment_id, p_expected_version, p_title, p_instructions, p_criteria, p_publication_status);
  update public.assignments set language = p_language
    where id = v_assignment.id and instructor_id = auth.uid() returning * into v_assignment;
  return v_assignment;
end;
$function$;
revoke all on function public.save_assignment(uuid, integer, text, text, jsonb, text, text) from public, anon;
grant execute on function public.save_assignment(uuid, integer, text, text, jsonb, text, text) to authenticated;

create or replace function public.submit_code(p_assignment_id uuid, p_source text, p_request_id uuid)
returns public.submissions
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user uuid := auth.uid();
  v_role text;
  v_assignment public.assignments;
  v_existing public.submissions;
  v_revision integer;
  v_result public.submissions;
begin
  if v_user is null then raise exception using errcode = '42501', message = 'unauthorized'; end if;
  if p_source is null or char_length(p_source) not between 1 and 8000 then
    raise exception using errcode = '22023', message = 'invalid_source';
  end if;
  select role into v_role from public.user_roles where user_id = v_user;
  if v_role is distinct from 'student' then raise exception using errcode = '42501', message = 'student_required'; end if;
  select * into v_assignment from public.assignments where id = p_assignment_id for share;
  if not found or v_assignment.publication_status <> 'published' or v_assignment.language not in ('python', 'java') then
    raise exception using errcode = 'P0002', message = 'assignment_unavailable';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user::text || ':' || p_assignment_id::text, 0));
  select * into v_existing from public.submissions where student_id = v_user and request_id = p_request_id;
  if found then
    if v_existing.assignment_id <> p_assignment_id or v_existing.source <> p_source then
      raise exception using errcode = '23505', message = 'request_id_conflict';
    end if;
    return v_existing;
  end if;
  select coalesce(max(revision), 0) + 1 into v_revision from public.submissions
    where assignment_id = p_assignment_id and student_id = v_user;
  insert into public.submissions (assignment_id, student_id, source, revision, request_id)
    values (p_assignment_id, v_user, p_source, v_revision, p_request_id) returning * into v_result;
  return v_result;
end;
$function$;

notify pgrst, 'reload schema';
