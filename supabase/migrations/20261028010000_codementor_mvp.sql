create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  instructor_id uuid not null references auth.users (id) on delete restrict,
  title text not null check (char_length(title) between 1 and 160),
  instructions text not null check (char_length(instructions) between 1 and 12000),
  language text not null default 'python' check (language = 'python'),
  publication_status text not null default 'draft' check (publication_status in ('draft', 'published')),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.assignment_rubrics (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null unique references public.assignments (id) on delete cascade,
  criteria jsonb not null check (jsonb_typeof(criteria) = 'array' and jsonb_array_length(criteria) between 1 and 20),
  version integer not null default 1 check (version > 0),
  updated_at timestamptz not null default now()
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments (id) on delete restrict,
  student_id uuid not null references auth.users (id) on delete restrict,
  source text not null check (char_length(source) between 1 and 8000),
  revision integer not null check (revision > 0),
  request_id uuid not null,
  created_at timestamptz not null default now(),
  unique (assignment_id, student_id, revision),
  unique (student_id, request_id)
);

create table public.grades (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique references public.submissions (id) on delete cascade,
  instructor_id uuid not null references auth.users (id) on delete restrict,
  scores jsonb not null default '{}'::jsonb check (jsonb_typeof(scores) = 'object'),
  feedback text not null default '' check (char_length(feedback) <= 4000),
  total_score numeric(7,2) check (total_score is null or total_score >= 0),
  published_at timestamptz,
  version integer not null default 1 check (version > 0),
  updated_at timestamptz not null default now()
);

create table public.ai_reviews (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions (id) on delete cascade,
  requester_id uuid not null references auth.users (id) on delete cascade,
  review_type text not null check (review_type in ('student_feedback', 'instructor_evaluation')),
  assignment_version integer not null,
  rubric_version integer,
  prompt_version text not null,
  model text not null,
  cache_key text not null,
  result jsonb not null check (jsonb_typeof(result) = 'object'),
  created_at timestamptz not null default now(),
  unique (requester_id, cache_key)
);

create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users (id) on delete cascade,
  submission_id uuid references public.submissions (id) on delete set null,
  review_type text not null check (review_type in ('student_feedback', 'instructor_evaluation')),
  status text not null check (status in ('pending', 'succeeded', 'failed', 'cache_hit')),
  error_category text,
  latency_ms integer check (latency_ms is null or latency_ms >= 0),
  input_tokens integer check (input_tokens is null or input_tokens >= 0),
  output_tokens integer check (output_tokens is null or output_tokens >= 0),
  token_source text check (token_source is null or token_source in ('provider', 'estimate')),
  cache_hit boolean not null default false,
  created_at timestamptz not null default now()
);

create index assignments_published_idx on public.assignments (publication_status, created_at desc);
create index assignments_owner_idx on public.assignments (instructor_id, updated_at desc);
create index submissions_student_idx on public.submissions (student_id, assignment_id, revision desc);
create index submissions_assignment_idx on public.submissions (assignment_id, created_at desc);
create index ai_reviews_cache_idx on public.ai_reviews (requester_id, cache_key);
create index ai_usage_owner_day_idx on public.ai_usage (requester_id, created_at desc);

alter table public.assignments enable row level security;
alter table public.assignment_rubrics enable row level security;
alter table public.submissions enable row level security;
alter table public.grades enable row level security;
alter table public.ai_reviews enable row level security;
alter table public.ai_usage enable row level security;

create function public.owns_assignment(p_assignment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1 from public.assignments a
    join public.user_roles r on r.user_id = a.instructor_id
    where a.id = p_assignment_id and a.instructor_id = auth.uid() and r.role = 'instructor'
  );
$function$;
revoke all on function public.owns_assignment(uuid) from public, anon;
grant execute on function public.owns_assignment(uuid) to authenticated;

create policy assignments_read_by_role on public.assignments
  for select to authenticated using (
    (publication_status = 'published' and exists (
      select 1 from public.user_roles r where r.user_id = (select auth.uid()) and r.role = 'student'
    ))
    or (instructor_id = (select auth.uid()) and exists (
      select 1 from public.user_roles r where r.user_id = (select auth.uid()) and r.role = 'instructor'
    ))
  );
create policy assignments_insert_owner on public.assignments
  for insert to authenticated with check (
    instructor_id = (select auth.uid())
    and exists (select 1 from public.user_roles r where r.user_id = (select auth.uid()) and r.role = 'instructor')
  );
create policy assignments_update_owner on public.assignments
  for update to authenticated using (
    instructor_id = (select auth.uid())
    and exists (select 1 from public.user_roles r where r.user_id = (select auth.uid()) and r.role = 'instructor')
  ) with check (instructor_id = (select auth.uid()));

create policy rubrics_read_owner on public.assignment_rubrics
  for select to authenticated using (public.owns_assignment(assignment_id));
create policy rubrics_insert_owner on public.assignment_rubrics
  for insert to authenticated with check (public.owns_assignment(assignment_id));
create policy rubrics_update_owner on public.assignment_rubrics
  for update to authenticated using (public.owns_assignment(assignment_id))
  with check (public.owns_assignment(assignment_id));

create policy submissions_read_student_or_owner on public.submissions
  for select to authenticated using (
    student_id = (select auth.uid())
    or public.owns_assignment(assignment_id)
  );
create policy grades_read_published_or_owner on public.grades
  for select to authenticated using (
    exists (select 1 from public.submissions s where s.id = submission_id and s.student_id = (select auth.uid()))
    and published_at is not null
    or exists (select 1 from public.submissions s where s.id = submission_id and public.owns_assignment(s.assignment_id))
  );
create policy grades_insert_owner on public.grades
  for insert to authenticated with check (
    instructor_id = (select auth.uid())
    and exists (select 1 from public.submissions s where s.id = submission_id and public.owns_assignment(s.assignment_id))
  );
create policy grades_update_owner on public.grades
  for update to authenticated using (instructor_id = (select auth.uid()))
  with check (instructor_id = (select auth.uid()));

create policy reviews_read_requester_or_owner on public.ai_reviews
  for select to authenticated using (
    requester_id = (select auth.uid())
    and review_type = 'student_feedback'
    or (review_type = 'instructor_evaluation' and exists (
      select 1 from public.submissions s where s.id = submission_id and public.owns_assignment(s.assignment_id)
    ))
  );
create policy reviews_insert_authorized on public.ai_reviews
  for insert to authenticated with check (
    requester_id = (select auth.uid())
    and (
      (review_type = 'student_feedback' and exists (
        select 1 from public.submissions s where s.id = submission_id and s.student_id = (select auth.uid())
      ))
      or (review_type = 'instructor_evaluation' and exists (
        select 1 from public.submissions s where s.id = submission_id and public.owns_assignment(s.assignment_id)
      ))
    )
  );

create policy usage_read_self on public.ai_usage
  for select to authenticated using (requester_id = (select auth.uid()));

revoke all on public.assignments, public.assignment_rubrics, public.submissions, public.grades, public.ai_reviews, public.ai_usage from anon, authenticated;
grant select (id, title, instructions, language, publication_status, version, created_at, updated_at) on public.assignments to authenticated;
grant select on public.assignment_rubrics to authenticated;
grant select on public.submissions to authenticated;
grant select on public.grades to authenticated;
grant select, insert on public.ai_reviews to authenticated;
grant select on public.ai_usage to authenticated;

create function public.submit_code(p_assignment_id uuid, p_source text, p_request_id uuid)
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
  if not found or v_assignment.publication_status <> 'published' or v_assignment.language <> 'python' then
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

revoke all on function public.submit_code(uuid, text, uuid) from public, anon;
grant execute on function public.submit_code(uuid, text, uuid) to authenticated;

create function public.reserve_ai_request(p_review_type text, p_submission_id uuid)
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
  elsif p_review_type = 'instructor_evaluation' and v_role = 'instructor' then v_limit := 20;
  else raise exception using errcode = '42501', message = 'role_not_allowed'; end if;
  if not exists (
    select 1 from public.submissions s join public.assignments a on a.id = s.assignment_id
    where s.id = p_submission_id and ((v_role = 'student' and s.student_id = v_user) or (v_role = 'instructor' and a.instructor_id = v_user))
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

create function public.finish_ai_request(
  p_usage_id uuid, p_succeeded boolean, p_error_category text default null,
  p_latency_ms integer default null, p_input_tokens integer default null,
  p_output_tokens integer default null, p_token_source text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
  update public.ai_usage set
    status = case when p_succeeded then 'succeeded' else 'failed' end,
    error_category = case when p_succeeded then null else left(coalesce(p_error_category, 'provider_error'), 80) end,
    latency_ms = greatest(p_latency_ms, 0), input_tokens = greatest(p_input_tokens, 0),
    output_tokens = greatest(p_output_tokens, 0), token_source = p_token_source
  where id = p_usage_id and requester_id = auth.uid() and status = 'pending';
  if not found then raise exception using errcode = '42501', message = 'usage_not_allowed'; end if;
end;
$function$;

revoke all on function public.reserve_ai_request(text, uuid), public.finish_ai_request(uuid, boolean, text, integer, integer, integer, text) from public, anon;
grant execute on function public.reserve_ai_request(text, uuid), public.finish_ai_request(uuid, boolean, text, integer, integer, integer, text) to authenticated;

create function public.record_ai_cache_hit(p_review_type text, p_submission_id uuid, p_input_tokens integer, p_output_tokens integer)
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
    )) or (p_review_type = 'instructor_evaluation' and v_role = 'instructor' and exists (
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

create function public.save_grade(
  p_submission_id uuid, p_scores jsonb, p_feedback text, p_total numeric,
  p_publish boolean, p_expected_version integer
)
returns public.grades
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user uuid := auth.uid();
  v_grade public.grades;
  v_assignment_id uuid;
  v_criteria jsonb;
  v_score_total numeric := 0;
  v_criterion jsonb;
begin
  if v_user is null or not exists (
    select 1 from public.submissions s join public.assignments a on a.id = s.assignment_id
    where s.id = p_submission_id and a.instructor_id = v_user
  ) then raise exception using errcode = '42501', message = 'submission_not_owned'; end if;
  if jsonb_typeof(p_scores) <> 'object' or p_feedback is null or char_length(p_feedback) > 4000 or p_total is null or p_total < 0 then
    raise exception using errcode = '22023', message = 'invalid_grade';
  end if;
  select s.assignment_id into v_assignment_id from public.submissions s where s.id = p_submission_id;
  select r.criteria into v_criteria from public.assignment_rubrics r where r.assignment_id = v_assignment_id;
  if v_criteria is null or (select count(*) from jsonb_object_keys(p_scores)) <> jsonb_array_length(v_criteria) then
    raise exception using errcode = '22023', message = 'invalid_grade_criteria';
  end if;
  for v_criterion in select value from jsonb_array_elements(v_criteria)
  loop
    if p_scores ->> (v_criterion ->> 'id') is null
      or (p_scores ->> (v_criterion ->> 'id')) !~ '^\d+(\.\d+)?$'
      or (p_scores ->> (v_criterion ->> 'id'))::numeric < 0
      or (p_scores ->> (v_criterion ->> 'id'))::numeric > (v_criterion ->> 'maxScore')::numeric then
      raise exception using errcode = '22023', message = 'invalid_grade_criteria';
    end if;
    v_score_total := v_score_total + (p_scores ->> (v_criterion ->> 'id'))::numeric;
  end loop;
  if abs(v_score_total - p_total) >= 0.01 then
    raise exception using errcode = '22023', message = 'invalid_grade_total';
  end if;
  select * into v_grade from public.grades where submission_id = p_submission_id for update;
  if found then
    if v_grade.version <> p_expected_version then raise exception using errcode = '40001', message = 'grade_version_conflict'; end if;
    update public.grades set scores = p_scores, feedback = p_feedback, total_score = p_total,
      published_at = case when p_publish then now() else null end, version = version + 1, updated_at = now()
      where id = v_grade.id returning * into v_grade;
  else
    if p_expected_version <> 0 then raise exception using errcode = '40001', message = 'grade_version_conflict'; end if;
    insert into public.grades (submission_id, instructor_id, scores, feedback, total_score, published_at)
      values (p_submission_id, v_user, p_scores, p_feedback, p_total, case when p_publish then now() else null end)
      returning * into v_grade;
  end if;
  return v_grade;
end;
$function$;

revoke all on function public.save_grade(uuid, jsonb, text, numeric, boolean, integer) from public, anon;
grant execute on function public.save_grade(uuid, jsonb, text, numeric, boolean, integer) to authenticated;

create function public.save_assignment(
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
  if v_user is null or not exists (select 1 from public.user_roles where user_id = v_user and role = 'instructor') then
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
