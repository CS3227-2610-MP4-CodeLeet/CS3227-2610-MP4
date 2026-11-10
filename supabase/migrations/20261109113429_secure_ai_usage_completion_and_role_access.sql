-- A user session can reserve AI quota but must not be able to finalize a
-- provider request. Keep one-time completion hashes outside the exposed API.
create schema codementor_private;
revoke all on schema codementor_private from public, anon, authenticated, service_role;

create table codementor_private.ai_usage_completion (
  usage_id uuid primary key references public.ai_usage(id) on delete cascade,
  requester_id uuid not null references auth.users(id) on delete cascade,
  token_hash bytea not null check (octet_length(token_hash) = 32),
  created_at timestamptz not null default clock_timestamp()
);
alter table codementor_private.ai_usage_completion enable row level security;
revoke all on codementor_private.ai_usage_completion from public, anon, authenticated, service_role;

-- The old public reservation RPC lets a client create a quota reservation
-- without a server-generated capability. The new RPC is server-role only.
revoke all on function public.reserve_ai_request(text, uuid) from public, anon, authenticated, service_role;

create function public.reserve_ai_request(
  p_requester_id uuid,
  p_review_type text,
  p_submission_id uuid,
  p_completion_token text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_course uuid;
  v_role text;
  v_limit integer;
  v_count integer;
  v_id uuid := gen_random_uuid();
begin
  if p_requester_id is null or p_completion_token is null
    or p_completion_token !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '42501', message = 'usage_not_allowed';
  end if;

  select a.course_id into v_course
  from public.submissions s
  join public.assignments a on a.id = s.assignment_id
  where s.id = p_submission_id;
  if v_course is null then
    raise exception using errcode = '42501', message = 'submission_not_allowed';
  end if;

  perform 1 from public.courses c
  where c.id = v_course and c.lifecycle = 'active'
  for share;
  if not found then
    raise exception using errcode = '42501', message = 'submission_not_allowed';
  end if;

  select m.role into v_role
  from public.course_memberships m
  join public.submissions s on s.id = p_submission_id
  join public.assignments a on a.id = s.assignment_id and a.course_id = m.course_id
  where m.course_id = v_course and m.user_id = p_requester_id
    and ((p_review_type = 'student_feedback' and s.student_id = p_requester_id and m.role = 'student')
      or (p_review_type = 'instructor_evaluation' and m.role = 'instructor'));
  if v_role is null or not course_private.can_use_feature(v_course, 'ai') then
    raise exception using errcode = '42501', message = 'submission_not_allowed';
  end if;

  if p_review_type = 'student_feedback' and v_role = 'student' then
    v_limit := 5;
  elsif p_review_type = 'instructor_evaluation' and v_role = 'instructor' then
    v_limit := 20;
  else
    raise exception using errcode = '42501', message = 'role_not_allowed';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(
    p_requester_id::text || ':' || v_course::text || ':' || p_review_type || ':' ||
      (now() at time zone 'utc')::date::text,
    0
  ));

  update public.ai_usage
  set status = 'failed', error_category = 'reservation_expired'
  where requester_id = p_requester_id and course_id = v_course
    and status = 'pending' and created_at < now() - interval '3 minutes';
  delete from codementor_private.ai_usage_completion c
  where c.requester_id = p_requester_id and exists (
    select 1 from public.ai_usage u
    where u.id = c.usage_id and u.status = 'failed'
      and u.error_category = 'reservation_expired'
  );

  select count(*) into v_count
  from public.ai_usage
  where requester_id = p_requester_id and review_type = p_review_type
    and course_id = v_course
    and created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc'
    and (status = 'succeeded' or status = 'pending');
  if v_count >= v_limit then
    raise exception using errcode = 'P0001', message = 'daily_quota_exceeded';
  end if;

  insert into public.ai_usage(id, requester_id, submission_id, review_type, status)
  values (v_id, p_requester_id, p_submission_id, p_review_type, 'pending');
  insert into codementor_private.ai_usage_completion(usage_id, requester_id, token_hash)
  values (v_id, p_requester_id, extensions.digest(p_completion_token, 'sha256'));
  return v_id;
end;
$function$;
revoke all on function public.reserve_ai_request(uuid, text, uuid, text) from public, anon, authenticated;
grant execute on function public.reserve_ai_request(uuid, text, uuid, text) to service_role;

-- A capability is one-time, server-only, bound to its requester and usage row.
revoke all on function public.finish_ai_request(uuid, boolean, text, integer, integer, integer, text)
  from public, anon, authenticated, service_role;

create function public.finish_ai_request(
  p_usage_id uuid,
  p_requester_id uuid,
  p_completion_token text,
  p_succeeded boolean,
  p_error_category text default null,
  p_latency_ms integer default null,
  p_input_tokens integer default null,
  p_output_tokens integer default null,
  p_token_source text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_expected_hash bytea;
begin
  if p_requester_id is null or p_completion_token is null
    or p_completion_token !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '42501', message = 'completion_not_allowed';
  end if;

  select c.token_hash into v_expected_hash
  from codementor_private.ai_usage_completion c
  where c.usage_id = p_usage_id and c.requester_id = p_requester_id
  for update;
  if v_expected_hash is null or v_expected_hash <> extensions.digest(p_completion_token, 'sha256') then
    raise exception using errcode = '42501', message = 'completion_not_allowed';
  end if;

  update public.ai_usage set
    status = case when p_succeeded then 'succeeded' else 'failed' end,
    error_category = case when p_succeeded then null else left(coalesce(p_error_category, 'provider_error'), 80) end,
    latency_ms = greatest(p_latency_ms, 0),
    input_tokens = greatest(p_input_tokens, 0),
    output_tokens = greatest(p_output_tokens, 0),
    token_source = p_token_source
  where id = p_usage_id and requester_id = p_requester_id and status = 'pending';
  if not found then
    raise exception using errcode = '42501', message = 'completion_not_allowed';
  end if;

  delete from codementor_private.ai_usage_completion where usage_id = p_usage_id;
end;
$function$;
revoke all on function public.finish_ai_request(uuid, uuid, text, boolean, text, integer, integer, integer, text)
  from public, anon, authenticated;
grant execute on function public.finish_ai_request(uuid, uuid, text, boolean, text, integer, integer, integer, text)
  to service_role;

-- Generated reviews and cache-hit accounting are server-owned records. A
-- signed-in user may read authorized history but cannot forge a model result.
revoke insert on public.ai_reviews from authenticated;
grant insert on public.ai_reviews to service_role;
revoke all on function public.record_ai_cache_hit(text, uuid, integer, integer)
  from public, anon, authenticated, service_role;

create function public.record_ai_cache_hit(
  p_requester_id uuid,
  p_review_type text,
  p_submission_id uuid,
  p_cache_key text,
  p_input_tokens integer,
  p_output_tokens integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_course uuid;
  v_role text;
begin
  if p_requester_id is null or p_cache_key is null or p_cache_key = '' then
    raise exception using errcode = '42501', message = 'cache_hit_not_allowed';
  end if;
  select a.course_id into v_course
  from public.submissions s
  join public.assignments a on a.id = s.assignment_id
  where s.id = p_submission_id;
  if v_course is null then
    raise exception using errcode = '42501', message = 'cache_hit_not_allowed';
  end if;
  perform 1 from public.courses c
  where c.id = v_course and c.lifecycle = 'active'
  for share;
  if not found then
    raise exception using errcode = '42501', message = 'cache_hit_not_allowed';
  end if;
  select m.role into v_role
  from public.course_memberships m
  join public.submissions s on s.id = p_submission_id
  join public.assignments a on a.id = s.assignment_id and a.course_id = m.course_id
  where m.course_id = v_course and m.user_id = p_requester_id
    and ((p_review_type = 'student_feedback' and s.student_id = p_requester_id and m.role = 'student')
      or (p_review_type = 'instructor_evaluation' and m.role = 'instructor'));
  if v_role is null or not course_private.can_use_feature(v_course, 'ai')
    or not exists (
      select 1 from public.ai_reviews r
      where r.requester_id = p_requester_id and r.submission_id = p_submission_id
        and r.review_type = p_review_type and r.cache_key = p_cache_key
    ) then
    raise exception using errcode = '42501', message = 'cache_hit_not_allowed';
  end if;
  insert into public.ai_usage(
    requester_id, submission_id, review_type, status,
    input_tokens, output_tokens, token_source, cache_hit
  ) values (
    p_requester_id, p_submission_id, p_review_type, 'cache_hit',
    greatest(p_input_tokens, 0), greatest(p_output_tokens, 0), 'estimate', true
  );
end;
$function$;
revoke all on function public.record_ai_cache_hit(uuid, text, uuid, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.record_ai_cache_hit(uuid, text, uuid, text, integer, integer)
  to service_role;

-- Instructor evaluation history requires current instructor membership even
-- when the requester can otherwise read the assignment as a student.
drop policy reviews_read_requester_or_owner on public.ai_reviews;
create policy reviews_read_requester_or_owner on public.ai_reviews
for select to authenticated using (
  exists (
    select 1
    from public.submissions s
    join public.assignments a on a.id = s.assignment_id
    join public.courses c on c.id = a.course_id
    where s.id = submission_id
      and course_private.can_read_assignment(a.id)
      and (c.lifecycle = 'archived' or course_private.can_use_feature(a.course_id, 'ai'))
      and (
        (review_type = 'student_feedback' and requester_id = (select auth.uid()))
        or (
          review_type = 'instructor_evaluation'
          and exists (
            select 1 from public.course_memberships m
            where m.course_id = a.course_id and m.user_id = (select auth.uid())
              and m.role = 'instructor'
          )
        )
      )
  )
);

notify pgrst, 'reload schema';
