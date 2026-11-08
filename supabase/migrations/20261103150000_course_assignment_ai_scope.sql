-- Enforce assignment, submission, grading and AI access inside each course.

create or replace function public.owns_assignment(p_assignment_id uuid)
returns boolean language sql stable security definer set search_path='' as $function$
  select exists (
    select 1 from public.assignments a join public.courses c on c.id=a.course_id
    where a.id=p_assignment_id and (
      course_private.is_member(a.course_id,array['instructor'],true)
      or (c.is_legacy and a.instructor_id=auth.uid() and exists(
        select 1 from public.user_roles r where r.user_id=auth.uid() and r.role in ('instructor','admin')
      ))
      or (c.is_legacy and course_private.is_platform_admin())
    )
  );
$function$;

create or replace function course_private.can_read_assignment(p_assignment_id uuid)
returns boolean language sql stable security definer set search_path='' as $function$
  select exists (
    select 1 from public.assignments a
    join public.courses c on c.id=a.course_id
    left join public.course_memberships m on m.course_id=a.course_id and m.user_id=auth.uid()
    where a.id=p_assignment_id
      and (
        (c.lifecycle='active' and m.user_id is not null and exists (
          select 1 from public.course_features f
          where f.course_id=a.course_id and f.feature='assessments' and f.enabled
        ) and (m.role='instructor' or a.publication_status='published'))
        or (c.lifecycle='archived' and m.user_id is not null and (m.role='instructor' or a.publication_status='published'))
        or (c.is_legacy and (
          (a.publication_status='published' and exists(select 1 from public.user_roles r where r.user_id=auth.uid() and r.role='student'))
          or (a.instructor_id=auth.uid() and exists(select 1 from public.user_roles r where r.user_id=auth.uid() and r.role in ('instructor','admin')))
          or course_private.is_platform_admin()
        ))
      )
  );
$function$;
revoke all on function course_private.can_read_assignment(uuid) from public,anon;
grant execute on function course_private.can_read_assignment(uuid) to authenticated;

drop policy assignments_read_by_role on public.assignments;
create policy assignments_read_by_role on public.assignments for select to authenticated
  using(course_private.can_read_assignment(id));
drop policy assignments_insert_owner on public.assignments;
create policy assignments_insert_owner on public.assignments for insert to authenticated
  with check(instructor_id=auth.uid() and course_private.is_member(course_id,array['instructor'],false)
    and course_private.can_use_feature(course_id,'assessments'));
drop policy assignments_update_owner on public.assignments;
create policy assignments_update_owner on public.assignments for update to authenticated
  using(course_private.is_member(course_id,array['instructor'],false) and course_private.can_use_feature(course_id,'assessments'))
  with check(course_private.is_member(course_id,array['instructor'],false) and course_private.can_use_feature(course_id,'assessments'));

-- Course instructors can collaborate on the course assignment while the
-- original instructor_id remains attribution metadata.
create function public.save_course_assignment(
  p_course_id uuid,p_assignment_id uuid,p_expected_version integer,p_title text,
  p_instructions text,p_criteria jsonb,p_publication_status text,p_language text,
  p_due_at timestamptz,p_update_due_at boolean,p_max_xp integer,p_update_max_xp boolean
) returns public.assignments language plpgsql security definer set search_path='' as $function$
declare v_assignment public.assignments; v_user uuid:=auth.uid();
begin
  if v_user is null or not course_private.email_is_verified(v_user)
    or p_course_id is null or not course_private.is_member(p_course_id,array['instructor'],false)
    or not course_private.can_use_feature(p_course_id,'assessments') then
    raise exception 'course_staff_required' using errcode='42501';
  end if;
  perform 1 from public.courses where id=p_course_id and lifecycle='active' for update;
  if not found or not course_private.is_member(p_course_id,array['instructor'],false)
    or not course_private.can_use_feature(p_course_id,'assessments') then
    raise exception 'course_unavailable' using errcode='42501';
  end if;
  if char_length(btrim(p_title)) not between 1 and 160
    or char_length(btrim(p_instructions)) not between 1 and 12000
    or jsonb_typeof(p_criteria)<>'array' or jsonb_array_length(p_criteria) not between 1 and 20
    or p_publication_status not in ('draft','published')
    or p_language not in ('python','java')
    or (p_due_at is not null and not isfinite(p_due_at))
    or (p_update_max_xp and (p_max_xp is null or p_max_xp not between 0 and 100000))
    or exists(select 1 from jsonb_array_elements(p_criteria) criterion where
      jsonb_typeof(criterion.value)<>'object'
      or coalesce(criterion.value->>'id','') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      or char_length(coalesce(criterion.value->>'title','')) not between 1 and 120
      or char_length(coalesce(criterion.value->>'description','')) not between 1 and 1000
      or jsonb_typeof(criterion.value->'maxScore')<>'number'
      or (case when jsonb_typeof(criterion.value->'maxScore')='number' then (criterion.value->>'maxScore')::numeric else 0 end) not between 1 and 100)
  then raise exception 'invalid_assignment' using errcode='22023'; end if;
  if p_assignment_id is null then
    if p_expected_version<>0 then raise exception 'assignment_version_conflict' using errcode='40001'; end if;
    insert into public.assignments(instructor_id,title,instructions,publication_status,language,course_id,due_at,max_xp)
      values(v_user,btrim(p_title),btrim(p_instructions),p_publication_status,p_language,p_course_id,
        case when p_update_due_at then p_due_at else null end,
        case when p_update_max_xp then p_max_xp else 0 end) returning * into v_assignment;
    insert into public.assignment_rubrics(assignment_id,criteria) values(v_assignment.id,p_criteria);
  else
    select * into v_assignment from public.assignments
      where id=p_assignment_id and course_id=p_course_id for update;
    if not found or v_assignment.version<>p_expected_version then
      raise exception 'assignment_version_conflict' using errcode='40001';
    end if;
    if v_assignment.language is distinct from p_language and exists(
      select 1 from public.submissions where assignment_id=p_assignment_id
    ) then raise exception 'assignment_language_locked' using errcode='40001'; end if;
    update public.assignments set title=btrim(p_title),instructions=btrim(p_instructions),
      publication_status=p_publication_status,language=p_language,
      due_at=case when p_update_due_at then p_due_at else due_at end,
      max_xp=case when p_update_max_xp then p_max_xp else max_xp end,
      version=version+1,updated_at=clock_timestamp()
      where id=p_assignment_id returning * into v_assignment;
    insert into public.assignment_rubrics(assignment_id,criteria) values(p_assignment_id,p_criteria)
      on conflict(assignment_id) do update set criteria=excluded.criteria,
        version=public.assignment_rubrics.version+1,updated_at=clock_timestamp();
  end if;
  return v_assignment;
end;
$function$;
revoke all on function public.save_course_assignment(uuid,uuid,integer,text,text,jsonb,text,text,timestamptz,boolean,integer,boolean) from public,anon;
grant execute on function public.save_course_assignment(uuid,uuid,integer,text,text,jsonb,text,text,timestamptz,boolean,integer,boolean) to authenticated;

-- A course student can submit only within an active course with assessments on.
create or replace function public.submit_code(p_assignment_id uuid,p_source text,p_request_id uuid)
returns public.submissions language plpgsql security definer set search_path='' as $function$
declare v_user uuid:=auth.uid(); v_assignment public.assignments; v_role text; v_existing public.submissions; v_revision integer; v_result public.submissions;
begin
  if v_user is null or not course_private.email_is_verified(v_user) then raise exception 'unauthorized' using errcode='42501'; end if;
  if p_source is null or char_length(p_source) not between 1 and 8000 or p_request_id is null then raise exception 'invalid_source' using errcode='22023'; end if;
  select a.* into v_assignment from public.assignments a where a.id=p_assignment_id for share;
  if not found or v_assignment.publication_status<>'published' then raise exception 'assignment_unavailable' using errcode='P0002'; end if;
  select m.role into v_role from public.course_memberships m where m.course_id=v_assignment.course_id and m.user_id=v_user;
  if v_role is distinct from 'student' or not course_private.can_use_feature(v_assignment.course_id,'assessments') then
    raise exception 'assignment_unavailable' using errcode='P0002';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user::text||':'||p_assignment_id::text,0));
  select * into v_existing from public.submissions where student_id=v_user and request_id=p_request_id;
  if found then
    if v_existing.assignment_id<>p_assignment_id or v_existing.source<>p_source then raise exception 'request_id_conflict' using errcode='23505'; end if;
    return v_existing;
  end if;
  select coalesce(max(revision),0)+1 into v_revision from public.submissions where assignment_id=p_assignment_id and student_id=v_user;
  insert into public.submissions(assignment_id,student_id,source,revision,request_id)
    values(p_assignment_id,v_user,p_source,v_revision,p_request_id) returning * into v_result;
  return v_result;
end;
$function$;
revoke all on function public.submit_code(uuid,text,uuid) from public,anon;
grant execute on function public.submit_code(uuid,text,uuid) to authenticated;

drop policy submissions_read_student_or_owner on public.submissions;
create policy submissions_read_student_or_owner on public.submissions for select to authenticated
  using(course_private.can_read_assignment(assignment_id) and
    (student_id=auth.uid() or public.owns_assignment(assignment_id)));
drop policy grades_read_published_or_owner on public.grades;
create policy grades_read_published_or_owner on public.grades for select to authenticated using(
  course_private.can_read_assignment((select s.assignment_id from public.submissions s where s.id=submission_id)) and (
    (published_at is not null and exists(select 1 from public.submissions s where s.id=submission_id and s.student_id=auth.uid()))
    or public.owns_assignment((select s.assignment_id from public.submissions s where s.id=submission_id))
  ));
drop policy grades_insert_owner on public.grades;
create policy grades_insert_owner on public.grades for insert to authenticated with check(
  instructor_id=auth.uid() and exists(select 1 from public.submissions s where s.id=submission_id and public.owns_assignment(s.assignment_id)
    and course_private.can_use_feature((select a.course_id from public.assignments a where a.id=s.assignment_id),'assessments')));
drop policy grades_update_owner on public.grades;
create policy grades_update_owner on public.grades for update to authenticated using(
  exists(select 1 from public.submissions s where s.id=submission_id and public.owns_assignment(s.assignment_id)
    and course_private.can_use_feature((select a.course_id from public.assignments a where a.id=s.assignment_id),'assessments')))
  with check(instructor_id=auth.uid());

-- Keep the optimistic grade version and XP ledger behavior, but authorize against
-- the active course membership instead of the account-wide role.
create or replace function public.save_grade(p_submission_id uuid,p_scores jsonb,p_feedback text,p_total numeric,p_publish boolean,p_expected_version integer)
returns public.grades language plpgsql security definer set search_path='' as $function$
declare v_assignment uuid; v_student uuid; v_saved public.grades; v_maximum numeric;
begin
  select s.assignment_id,s.student_id into v_assignment,v_student from public.submissions s where s.id=p_submission_id;
  if v_assignment is null or not public.owns_assignment(v_assignment)
    or not course_private.can_use_feature((select a.course_id from public.assignments a where a.id=v_assignment),'assessments') then
    raise exception 'submission_not_owned' using errcode='42501';
  end if;
  perform 1 from public.assignments a where a.id=v_assignment for update;
  if not public.owns_assignment(v_assignment) then raise exception 'submission_not_owned' using errcode='42501'; end if;
  v_saved:=xp_private.save_grade_core(p_submission_id,p_scores,p_feedback,p_total,p_publish,p_expected_version);
  update public.grades set total_score=(select sum((p_scores->>(c.value->>'id'))::numeric)
    from public.assignment_rubrics r,lateral jsonb_array_elements(r.criteria) c where r.assignment_id=v_assignment)
    where id=v_saved.id returning * into v_saved;
  if v_saved.published_at is not null then
    select sum((c.value->>'maxScore')::numeric) into v_maximum from public.assignment_rubrics r,
      lateral jsonb_array_elements(r.criteria) c where r.assignment_id=v_assignment;
    insert into xp_private.grade_basis(grade_id,grade_version,score,maximum_score)
      values(v_saved.id,v_saved.version,v_saved.total_score,v_maximum)
      on conflict(grade_id) do update set grade_version=excluded.grade_version,score=excluded.score,maximum_score=excluded.maximum_score;
  end if;
  perform xp_private.recompute(v_assignment,v_student,'grade_change');
  return v_saved;
end;
$function$;
revoke all on function public.save_grade(uuid,jsonb,text,numeric,boolean,integer) from public,anon;
grant execute on function public.save_grade(uuid,jsonb,text,numeric,boolean,integer) to authenticated;

-- AI quota reservation and cache accounting are course feature gated and use
-- the caller's role in the assignment's course.
create or replace function public.reserve_ai_request(p_review_type text,p_submission_id uuid)
returns uuid language plpgsql security definer set search_path='' as $function$
declare v_user uuid:=auth.uid(); v_course uuid; v_role text; v_limit integer; v_count integer; v_id uuid:=gen_random_uuid();
begin
  select a.course_id,m.role into v_course,v_role from public.submissions s
    join public.assignments a on a.id=s.assignment_id
    join public.course_memberships m on m.course_id=a.course_id and m.user_id=v_user
    where s.id=p_submission_id and ((p_review_type='student_feedback' and s.student_id=v_user and m.role='student')
      or (p_review_type='instructor_evaluation' and m.role='instructor'));
  if v_course is null or not course_private.can_use_feature(v_course,'ai') then raise exception 'submission_not_allowed' using errcode='42501'; end if;
  if p_review_type='student_feedback' and v_role='student' then v_limit:=5;
  elsif p_review_type='instructor_evaluation' and v_role='instructor' then v_limit:=20;
  else raise exception 'role_not_allowed' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user::text||':'||v_course::text||':'||p_review_type||':'||(now() at time zone 'utc')::date::text,0));
  update public.ai_usage set status='failed',error_category='reservation_expired'
    where requester_id=v_user and course_id=v_course and status='pending' and created_at<now()-interval '3 minutes';
  select count(*) into v_count from public.ai_usage where requester_id=v_user and review_type=p_review_type
    and course_id=v_course and created_at>=date_trunc('day',now() at time zone 'utc') at time zone 'utc' and (status='succeeded' or status='pending');
  if v_count>=v_limit then raise exception 'daily_quota_exceeded' using errcode='P0001'; end if;
  insert into public.ai_usage(id,requester_id,submission_id,review_type,status) values(v_id,v_user,p_submission_id,p_review_type,'pending');
  return v_id;
end;
$function$;
revoke all on function public.reserve_ai_request(text,uuid) from public,anon;
grant execute on function public.reserve_ai_request(text,uuid) to authenticated;

create or replace function public.record_ai_cache_hit(p_review_type text,p_submission_id uuid,p_input_tokens integer,p_output_tokens integer)
returns void language plpgsql security definer set search_path='' as $function$
declare v_user uuid:=auth.uid(); v_course uuid;
begin
  select a.course_id into v_course from public.submissions s
    join public.assignments a on a.id=s.assignment_id
    join public.course_memberships m on m.course_id=a.course_id and m.user_id=v_user
    where s.id=p_submission_id and ((p_review_type='student_feedback' and s.student_id=v_user and m.role='student')
      or (p_review_type='instructor_evaluation' and m.role='instructor'));
  if v_course is null or not course_private.can_use_feature(v_course,'ai') then raise exception 'submission_not_allowed' using errcode='42501'; end if;
  insert into public.ai_usage(requester_id,submission_id,review_type,status,input_tokens,output_tokens,token_source,cache_hit)
    values(v_user,p_submission_id,p_review_type,'cache_hit',greatest(p_input_tokens,0),greatest(p_output_tokens,0),'estimate',true);
end;
$function$;
revoke all on function public.record_ai_cache_hit(text,uuid,integer,integer) from public,anon;
grant execute on function public.record_ai_cache_hit(text,uuid,integer,integer) to authenticated;

-- Cache rows remain readable as history only to their requesting course member;
-- writes are restricted to the authorized review role and enabled AI feature.
drop policy reviews_read_requester_or_owner on public.ai_reviews;
create policy reviews_read_requester_or_owner on public.ai_reviews for select to authenticated using(
  exists(select 1 from public.submissions s join public.assignments a on a.id=s.assignment_id join public.courses c on c.id=a.course_id
    where s.id=submission_id and course_private.can_read_assignment(a.id)
      and (c.lifecycle='archived' or course_private.can_use_feature(a.course_id,'ai'))
      and (requester_id=auth.uid() or (review_type='instructor_evaluation' and public.owns_assignment(a.id)))));
drop policy reviews_insert_authorized on public.ai_reviews;
create policy reviews_insert_authorized on public.ai_reviews for insert to authenticated with check(
  requester_id=auth.uid() and exists(select 1 from public.submissions s join public.assignments a on a.id=s.assignment_id
    left join public.course_memberships m on m.course_id=a.course_id and m.user_id=auth.uid()
    where s.id=submission_id and course_private.can_use_feature(a.course_id,'ai')
      and ((review_type='student_feedback' and s.student_id=auth.uid() and m.role='student')
        or (review_type='instructor_evaluation' and m.role='instructor'))));
drop policy usage_read_self on public.ai_usage;
create policy usage_read_self on public.ai_usage for select to authenticated using(
  requester_id=auth.uid() and exists(select 1 from public.courses c join public.course_memberships m on m.course_id=c.id and m.user_id=auth.uid()
    where c.id=course_id));

notify pgrst,'reload schema';
-- Practice-test reads follow course membership; all writes require an active
-- instructor membership and the assessments feature.
drop policy practice_public_reader on public.assignment_practice_sets;
create policy practice_public_reader on public.assignment_practice_sets for select to authenticated using(
  course_private.can_read_assignment(assignment_id) and exists(
    select 1 from public.assignments a where a.id=assignment_id and a.publication_status='published'
  ));
create or replace function public.save_practice_tests(p_assignment_id uuid,p_expected_version integer,p_action text,p_cases jsonb)
returns jsonb language plpgsql security definer set search_path='' as $function$
declare v_course uuid; v_current_version integer; v_next_revision integer;
begin
  if auth.uid() is null then raise exception 'practice_owner_required' using errcode='42501'; end if;
  select a.course_id into v_course from public.assignments a where a.id=p_assignment_id for share;
  if v_course is null or not course_private.is_member(v_course,array['instructor'],false)
    or not course_private.can_use_feature(v_course,'assessments') then
    raise exception 'practice_owner_required' using errcode='42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('practice-tests:'||p_assignment_id::text,0));
  select d.version into v_current_version from public.assignment_practice_drafts d where d.assignment_id=p_assignment_id;
  if p_expected_version is distinct from coalesce(v_current_version,0) then
    raise exception 'practice_version_conflict' using errcode='40001';
  end if;
  if p_action is null or p_action not in ('save','publish','unpublish') then
    raise exception 'invalid_practice_cases' using errcode='22023';
  end if;
  if p_action='unpublish' then
    if p_cases is not null then raise exception 'invalid_practice_cases' using errcode='22023'; end if;
  else
    if not public.valid_practice_cases(p_cases) then raise exception 'invalid_practice_cases' using errcode='22023'; end if;
    if p_action='publish' and jsonb_array_length(p_cases)=0 then raise exception 'invalid_practice_cases' using errcode='22023'; end if;
  end if;
  insert into public.assignment_practice_drafts(assignment_id,cases,version)
    values(p_assignment_id,coalesce(p_cases,'[]'::jsonb),coalesce(v_current_version,0)+1)
    on conflict(assignment_id) do update set
      cases=case when p_action='unpublish' then public.assignment_practice_drafts.cases else excluded.cases end,
      version=excluded.version,updated_at=clock_timestamp();
  if p_action in ('publish','unpublish') then
    insert into public.assignment_practice_sets(assignment_id,cases,published_revision,published_at)
      values(p_assignment_id,case when p_action='publish' then p_cases else '[]'::jsonb end,1,
        case when p_action='publish' then clock_timestamp() else null end)
      on conflict(assignment_id) do update set cases=excluded.cases,
        published_revision=public.assignment_practice_sets.published_revision+1,published_at=excluded.published_at;
  end if;
  select s.published_revision into v_next_revision from public.assignment_practice_sets s where s.assignment_id=p_assignment_id;
  return jsonb_build_object('version',coalesce(v_current_version,0)+1,'published_revision',coalesce(v_next_revision,0));
end;
$function$;
revoke all on function public.save_practice_tests(uuid,integer,text,jsonb) from public,anon;
grant execute on function public.save_practice_tests(uuid,integer,text,jsonb) to authenticated;

-- The former account-role-only save RPCs cannot bypass the explicit course ID.
revoke all on function public.save_assignment(uuid,integer,text,text,jsonb,text) from public,anon,authenticated;
revoke all on function public.save_assignment(uuid,integer,text,text,jsonb,text,text) from public,anon,authenticated;
revoke all on function public.save_assignment(uuid,integer,text,text,jsonb,text,text,timestamptz) from public,anon,authenticated;
revoke all on function public.save_assignment_with_xp(uuid,integer,text,text,jsonb,text,text,integer,timestamptz,boolean) from public,anon,authenticated;

-- AI usage budgets are independent for each course.

-- Compatibility RPCs can update only an existing assignment after deriving its
-- course; creation still requires the explicit course-aware function above.
create or replace function public.save_assignment(p_assignment_id uuid,p_expected_version integer,p_title text,p_instructions text,p_criteria jsonb,p_publication_status text)
returns public.assignments language plpgsql security definer set search_path='' as $function$
declare v_course uuid; v_language text;
begin
  if p_assignment_id is null then raise exception 'course_context_required' using errcode='22023'; end if;
  select a.course_id,a.language into v_course,v_language from public.assignments a where a.id=p_assignment_id;
  if v_course is null then raise exception 'assignment_unavailable' using errcode='P0002'; end if;
  return public.save_course_assignment(v_course,p_assignment_id,p_expected_version,p_title,p_instructions,p_criteria,p_publication_status,v_language,null,false,null,false);
end;
$function$;
create or replace function public.save_assignment(p_assignment_id uuid,p_expected_version integer,p_title text,p_instructions text,p_criteria jsonb,p_publication_status text,p_language text)
returns public.assignments language plpgsql security definer set search_path='' as $function$
declare v_course uuid;
begin
  if p_assignment_id is null then raise exception 'course_context_required' using errcode='22023'; end if;
  select a.course_id into v_course from public.assignments a where a.id=p_assignment_id;
  if v_course is null then raise exception 'assignment_unavailable' using errcode='P0002'; end if;
  return public.save_course_assignment(v_course,p_assignment_id,p_expected_version,p_title,p_instructions,p_criteria,p_publication_status,p_language,null,false,null,false);
end;
$function$;
create or replace function public.save_assignment(p_assignment_id uuid,p_expected_version integer,p_title text,p_instructions text,p_criteria jsonb,p_publication_status text,p_language text,p_due_at timestamptz)
returns public.assignments language plpgsql security definer set search_path='' as $function$
declare v_course uuid;
begin
  if p_assignment_id is null then raise exception 'course_context_required' using errcode='22023'; end if;
  select a.course_id into v_course from public.assignments a where a.id=p_assignment_id;
  if v_course is null then raise exception 'assignment_unavailable' using errcode='P0002'; end if;
  return public.save_course_assignment(v_course,p_assignment_id,p_expected_version,p_title,p_instructions,p_criteria,p_publication_status,p_language,p_due_at,true,null,false);
end;
$function$;
create or replace function public.save_assignment_with_xp(p_assignment_id uuid,p_expected_version integer,p_title text,p_instructions text,p_criteria jsonb,p_publication_status text,p_language text,p_max_xp integer,p_due_at timestamptz default null,p_update_due_at boolean default false)
returns public.assignments language plpgsql security definer set search_path='' as $function$
declare v_course uuid;
begin
  if p_assignment_id is null then raise exception 'course_context_required' using errcode='22023'; end if;
  select a.course_id into v_course from public.assignments a where a.id=p_assignment_id;
  if v_course is null then raise exception 'assignment_unavailable' using errcode='P0002'; end if;
  return public.save_course_assignment(v_course,p_assignment_id,p_expected_version,p_title,p_instructions,p_criteria,p_publication_status,p_language,p_due_at,p_update_due_at,p_max_xp,true);
end;
$function$;
revoke all on function public.save_assignment(uuid,integer,text,text,jsonb,text) from public,anon;
revoke all on function public.save_assignment(uuid,integer,text,text,jsonb,text,text) from public,anon;
revoke all on function public.save_assignment(uuid,integer,text,text,jsonb,text,text,timestamptz) from public,anon;
revoke all on function public.save_assignment_with_xp(uuid,integer,text,text,jsonb,text,text,integer,timestamptz,boolean) from public,anon;
grant execute on function public.save_assignment(uuid,integer,text,text,jsonb,text),public.save_assignment(uuid,integer,text,text,jsonb,text,text),public.save_assignment(uuid,integer,text,text,jsonb,text,text,timestamptz),public.save_assignment_with_xp(uuid,integer,text,text,jsonb,text,text,integer,timestamptz,boolean) to authenticated;
