alter table public.user_roles
  drop constraint user_roles_role_check;

alter table public.user_roles
  add constraint user_roles_role_check check (role in ('student', 'instructor', 'admin'));

create or replace function public.owns_assignment(p_assignment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1 from public.assignments a
    join public.user_roles r on r.user_id = a.instructor_id
    where a.id = p_assignment_id
      and a.instructor_id = auth.uid()
      and r.role in ('instructor', 'admin')
  );
$function$;

drop policy assignments_read_by_role on public.assignments;
create policy assignments_read_by_role on public.assignments
  for select to authenticated using (
    (publication_status = 'published' and exists (
      select 1 from public.user_roles r
      where r.user_id = (select auth.uid()) and r.role = 'student'
    ))
    or (instructor_id = (select auth.uid()) and exists (
      select 1 from public.user_roles r
      where r.user_id = (select auth.uid()) and r.role in ('instructor', 'admin')
    ))
  );

drop policy assignments_insert_owner on public.assignments;
create policy assignments_insert_owner on public.assignments
  for insert to authenticated with check (
    instructor_id = (select auth.uid())
    and exists (
      select 1 from public.user_roles r
      where r.user_id = (select auth.uid()) and r.role in ('instructor', 'admin')
    )
  );

drop policy assignments_update_owner on public.assignments;
create policy assignments_update_owner on public.assignments
  for update to authenticated using (
    instructor_id = (select auth.uid())
    and exists (
      select 1 from public.user_roles r
      where r.user_id = (select auth.uid()) and r.role in ('instructor', 'admin')
    )
  ) with check (instructor_id = (select auth.uid()));

create function public.admin_list_users(
  p_after_user_id uuid default null,
  p_limit integer default 51
)
returns table (user_id uuid, email text, display_name text, role text)
language plpgsql
stable
security definer
set search_path = ''
as $function$
begin
  if auth.uid() is null or not exists (
    select 1 from public.user_roles r
    where r.user_id = auth.uid() and r.role = 'admin'
  ) then
    raise exception using errcode = '42501', message = 'admin_required';
  end if;
  if p_limit is null or p_limit not between 1 and 101 then
    raise exception using errcode = '22023', message = 'invalid_limit';
  end if;

  return query
    select u.id, u.email::text, coalesce(p.display_name, 'Student'), r.role
    from auth.users u
    join public.user_roles r on r.user_id = u.id
    left join public.profiles p on p.id = u.id
    where p_after_user_id is null or u.id > p_after_user_id
    order by u.id
    limit p_limit;
end;
$function$;

revoke all on function public.admin_list_users(uuid, integer) from public, anon;
grant execute on function public.admin_list_users(uuid, integer) to authenticated;

create function public.admin_set_user_role(p_user_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_id uuid := auth.uid();
  v_target_role text;
  v_admin_count integer;
begin
  if p_role is null or p_role not in ('student', 'instructor', 'admin') then
    raise exception using errcode = '22023', message = 'invalid_role';
  end if;
  if v_actor_id is null then
    raise exception using errcode = '42501', message = 'admin_required';
  end if;

  -- Serialize role changes so concurrent requests cannot demote the final admins.
  perform pg_catalog.pg_advisory_xact_lock(26941, 33);

  if not exists (
    select 1 from public.user_roles r
    where r.user_id = v_actor_id and r.role = 'admin'
  ) then
    raise exception using errcode = '42501', message = 'admin_required';
  end if;

  select r.role into v_target_role
  from public.user_roles r
  where r.user_id = p_user_id
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'target_not_found';
  end if;

  if v_target_role = 'admin' and p_role <> 'admin' then
    select count(*)::integer into v_admin_count
    from public.user_roles r where r.role = 'admin';
    if v_admin_count <= 1 then
      raise exception using errcode = 'P0001', message = 'final_admin_required';
    end if;
  end if;

  update public.user_roles set role = p_role where user_id = p_user_id;
end;
$function$;

revoke all on function public.admin_set_user_role(uuid, text) from public, anon;
grant execute on function public.admin_set_user_role(uuid, text) to authenticated;

create or replace function public.reserve_ai_request(p_review_type text, p_submission_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user uuid := auth.uid();
  v_role text;
  v_limit integer;
  v_count integer;
  v_id uuid := gen_random_uuid();
begin
  if v_user is null then raise exception using errcode = '42501', message = 'unauthorized'; end if;
  select role into v_role from public.user_roles where user_id = v_user;
  if p_review_type = 'student_feedback' and v_role = 'student' then v_limit := 5;
  elsif p_review_type = 'instructor_evaluation' and v_role in ('instructor', 'admin') then v_limit := 20;
  else raise exception using errcode = '42501', message = 'role_not_allowed'; end if;
  if not exists (
    select 1 from public.submissions s join public.assignments a on a.id = s.assignment_id
    where s.id = p_submission_id and (
      (v_role = 'student' and s.student_id = v_user)
      or (v_role in ('instructor', 'admin') and a.instructor_id = v_user)
    )
  ) then raise exception using errcode = '42501', message = 'submission_not_allowed'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user::text || ':' || p_review_type || ':' || (now() at time zone 'utc')::date::text, 0));
  update public.ai_usage set status = 'failed', error_category = 'reservation_expired'
    where requester_id = v_user and status = 'pending' and created_at < now() - interval '3 minutes';
  select count(*) into v_count from public.ai_usage
    where requester_id = v_user and review_type = p_review_type
      and created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc'
      and (status = 'succeeded' or status = 'pending');
  if v_count >= v_limit then raise exception using errcode = 'P0001', message = 'daily_quota_exceeded'; end if;
  insert into public.ai_usage (id, requester_id, submission_id, review_type, status)
    values (v_id, v_user, p_submission_id, p_review_type, 'pending');
  return v_id;
end;
$function$;

revoke all on function public.reserve_ai_request(text, uuid) from public, anon;
grant execute on function public.reserve_ai_request(text, uuid) to authenticated;

create or replace function public.record_ai_cache_hit(p_review_type text, p_submission_id uuid, p_input_tokens integer, p_output_tokens integer)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user uuid := auth.uid();
  v_role text;
begin
  select role into v_role from public.user_roles where user_id = v_user;
  if (p_review_type = 'student_feedback' and v_role = 'student' and exists (
      select 1 from public.submissions s where s.id = p_submission_id and s.student_id = v_user
    )) or (p_review_type = 'instructor_evaluation' and v_role in ('instructor', 'admin') and exists (
      select 1 from public.submissions s join public.assignments a on a.id = s.assignment_id
      where s.id = p_submission_id and a.instructor_id = v_user
    )) then
    insert into public.ai_usage (requester_id, submission_id, review_type, status, input_tokens, output_tokens, token_source, cache_hit)
      values (v_user, p_submission_id, p_review_type, 'cache_hit', greatest(p_input_tokens, 0), greatest(p_output_tokens, 0), 'estimate', true);
    return;
  end if;
  raise exception using errcode = '42501', message = 'submission_not_allowed';
end;
$function$;

revoke all on function public.record_ai_cache_hit(text, uuid, integer, integer) from public, anon;
grant execute on function public.record_ai_cache_hit(text, uuid, integer, integer) to authenticated;

create or replace function public.save_assignment(
  p_assignment_id uuid, p_expected_version integer, p_title text,
  p_instructions text, p_criteria jsonb, p_publication_status text
)
returns public.assignments
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user uuid := auth.uid();
  v_assignment public.assignments;
begin
  if v_user is null or not exists (
    select 1 from public.user_roles where user_id = v_user and role in ('instructor', 'admin')
  ) then
    raise exception using errcode = '42501', message = 'instructor_required';
  end if;
  if char_length(btrim(p_title)) not between 1 and 160
    or char_length(btrim(p_instructions)) not between 1 and 12000
    or jsonb_typeof(p_criteria) <> 'array'
    or jsonb_array_length(p_criteria) not between 1 and 20
    or p_publication_status not in ('draft', 'published')
    or exists (
      select 1 from jsonb_array_elements(p_criteria) criterion
      where jsonb_typeof(criterion.value) <> 'object'
        or coalesce(criterion.value ->> 'id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        or char_length(coalesce(criterion.value ->> 'title', '')) not between 1 and 120
        or char_length(coalesce(criterion.value ->> 'description', '')) not between 1 and 1000
        or jsonb_typeof(criterion.value -> 'maxScore') <> 'number'
        or (case when jsonb_typeof(criterion.value -> 'maxScore') = 'number' then (criterion.value ->> 'maxScore')::numeric else 0 end) not between 1 and 100
    ) then
    raise exception using errcode = '22023', message = 'invalid_assignment';
  end if;
  if p_assignment_id is null then
    if p_expected_version <> 0 then raise exception using errcode = '40001', message = 'assignment_version_conflict'; end if;
    insert into public.assignments (instructor_id, title, instructions, publication_status)
      values (v_user, btrim(p_title), btrim(p_instructions), p_publication_status)
      returning * into v_assignment;
    insert into public.assignment_rubrics (assignment_id, criteria) values (v_assignment.id, p_criteria);
  else
    select * into v_assignment from public.assignments
      where id = p_assignment_id and instructor_id = v_user for update;
    if not found or v_assignment.version <> p_expected_version then
      raise exception using errcode = '40001', message = 'assignment_version_conflict';
    end if;
    update public.assignments set title = btrim(p_title), instructions = btrim(p_instructions),
      publication_status = p_publication_status, version = version + 1, updated_at = now()
      where id = p_assignment_id returning * into v_assignment;
    insert into public.assignment_rubrics (assignment_id, criteria)
      values (p_assignment_id, p_criteria)
      on conflict (assignment_id) do update set criteria = excluded.criteria,
        version = public.assignment_rubrics.version + 1, updated_at = now();
  end if;
  return v_assignment;
end;
$function$;

revoke all on function public.save_assignment(uuid, integer, text, text, jsonb, text) from public, anon;
grant execute on function public.save_assignment(uuid, integer, text, text, jsonb, text) to authenticated;

notify pgrst, 'reload schema';
