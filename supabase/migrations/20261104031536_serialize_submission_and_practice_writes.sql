-- Course lifecycle, membership and feature changes take the course row FOR UPDATE.
-- Submission and practice-test writes take the same row FOR SHARE first, then
-- recheck authorization while holding it so those changes serialize cleanly.
create or replace function public.submit_code(p_assignment_id uuid,p_source text,p_request_id uuid)
returns public.submissions language plpgsql security definer set search_path='' as $function$
declare
  v_user uuid:=auth.uid();
  v_course uuid;
  v_assignment public.assignments;
  v_role text;
  v_existing public.submissions;
  v_revision integer;
  v_result public.submissions;
begin
  if v_user is null or not course_private.email_is_verified(v_user) then
    raise exception 'unauthorized' using errcode='42501';
  end if;
  if p_source is null or char_length(p_source) not between 1 and 8000 or p_request_id is null then
    raise exception 'invalid_source' using errcode='22023';
  end if;

  select a.course_id into v_course from public.assignments a where a.id=p_assignment_id;
  if v_course is null then raise exception 'assignment_unavailable' using errcode='P0002'; end if;
  perform 1 from public.courses c where c.id=v_course and c.lifecycle='active' for share;
  if not found then raise exception 'assignment_unavailable' using errcode='P0002'; end if;

  select m.role into v_role from public.course_memberships m
    where m.course_id=v_course and m.user_id=v_user;
  if v_role is distinct from 'student' or not course_private.can_use_feature(v_course,'assessments') then
    raise exception 'assignment_unavailable' using errcode='P0002';
  end if;

  select a.* into v_assignment from public.assignments a where a.id=p_assignment_id for share;
  if not found or v_assignment.course_id<>v_course or v_assignment.publication_status<>'published' then
    raise exception 'assignment_unavailable' using errcode='P0002';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user::text||':'||p_assignment_id::text,0));
  select * into v_existing from public.submissions where student_id=v_user and request_id=p_request_id;
  if found then
    if v_existing.assignment_id<>p_assignment_id or v_existing.source<>p_source then
      raise exception 'request_id_conflict' using errcode='23505';
    end if;
    return v_existing;
  end if;
  select coalesce(max(revision),0)+1 into v_revision from public.submissions
    where assignment_id=p_assignment_id and student_id=v_user;
  insert into public.submissions(assignment_id,student_id,source,revision,request_id)
    values(p_assignment_id,v_user,p_source,v_revision,p_request_id) returning * into v_result;
  return v_result;
end;
$function$;
revoke all on function public.submit_code(uuid,text,uuid) from public,anon;
grant execute on function public.submit_code(uuid,text,uuid) to authenticated;

create or replace function public.save_practice_tests(p_assignment_id uuid,p_expected_version integer,p_action text,p_cases jsonb)
returns jsonb language plpgsql security definer set search_path='' as $function$
declare v_course uuid; v_assignment_course uuid; v_current_version integer; v_next_revision integer;
begin
  if auth.uid() is null then raise exception 'practice_owner_required' using errcode='42501'; end if;
  select a.course_id into v_course from public.assignments a where a.id=p_assignment_id;
  if v_course is null then raise exception 'practice_owner_required' using errcode='42501'; end if;
  perform 1 from public.courses c where c.id=v_course and c.lifecycle='active' for share;
  if not found or not course_private.is_member(v_course,array['instructor'],false)
    or not course_private.can_use_feature(v_course,'assessments') then
    raise exception 'practice_owner_required' using errcode='42501';
  end if;
  select a.course_id into v_assignment_course from public.assignments a
    where a.id=p_assignment_id for share;
  if not found or v_assignment_course<>v_course then
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
