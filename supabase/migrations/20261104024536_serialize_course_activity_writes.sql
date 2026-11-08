-- Ownership transfer promotes an enrolled course member; it does not enroll
-- arbitrary verified users through a UUID-based owner operation.
create or replace function public.transfer_course_ownership(p_course uuid,p_new_owner uuid) returns void
language plpgsql security definer set search_path='' as $function$
declare v_old uuid:=auth.uid();
begin
 if v_old is null then raise exception 'course_owner_required' using errcode='42501'; end if;
 perform 1 from public.courses where id=p_course and lifecycle='active' and not is_legacy and owner_id=v_old for update;
 if not found then raise exception 'course_owner_required' using errcode='42501'; end if;
 if p_new_owner=v_old or not course_private.email_is_verified(p_new_owner) then raise exception 'verified_instructor_required' using errcode='42501'; end if;
 if not exists(select 1 from public.course_memberships m where m.course_id=p_course and m.user_id=p_new_owner) then
   raise exception 'course_member_required' using errcode='42501';
 end if;
 update public.course_memberships set role='instructor',added_by=v_old where course_id=p_course and user_id=p_new_owner;
 update public.courses set owner_id=p_new_owner,updated_at=clock_timestamp() where id=p_course;
 update public.course_memberships set role='instructor' where course_id=p_course and user_id=v_old;
 insert into course_private.ownership_events(course_id,previous_owner,new_owner,actor_id,event_type) values(p_course,v_old,p_new_owner,v_old,'transferred');
end $function$;
revoke all on function public.transfer_course_ownership(uuid,uuid) from public,anon;
grant execute on function public.transfer_course_ownership(uuid,uuid) to authenticated;

-- A shared course-row lock serializes forum creation/replies with archive and
-- feature changes; recheck membership and feature state after acquiring it.
create or replace function forum_private.create_post(p_course_id uuid,p_thread_id uuid,p_title text,p_body text,p_request_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $function$
declare
  v_user uuid:=auth.uid(); v_role text; v_name text; v_thread public.forum_threads;
  v_reply public.forum_replies; v_count bigint; v_id uuid;
begin
  select m.role into v_role from public.course_memberships m
    join public.courses c on c.id=m.course_id
    where m.course_id=p_course_id and m.user_id=v_user and c.lifecycle='active';
  if v_user is null or not course_private.email_is_verified(v_user)
    or not exists(select 1 from public.user_roles r where r.user_id=v_user)
    or v_role not in ('student','instructor')
    or not course_private.can_use_feature(p_course_id,'discussions') then
    raise exception 'forum_member_required' using errcode='42501';
  end if;
  perform 1 from public.courses where id=p_course_id and lifecycle='active' for share;
  if not found then raise exception 'forum_member_required' using errcode='42501'; end if;
  select m.role into v_role from public.course_memberships m
    where m.course_id=p_course_id and m.user_id=v_user;
  if not course_private.email_is_verified(v_user) or v_role not in ('student','instructor')
    or not course_private.can_use_feature(p_course_id,'discussions') then
    raise exception 'forum_member_required' using errcode='42501';
  end if;
  p_body:=btrim(p_body); p_title:=btrim(p_title);
  if p_request_id is null or p_body is null or char_length(p_body) not between 1 and 8000
    or p_body !~ '[^[:space:]]'
    or (p_thread_id is null and (p_title is null or char_length(p_title) not between 1 and 160 or p_title !~ '[^[:space:]]'))
    or (p_thread_id is not null and p_title is not null) then
    raise exception 'invalid_forum_post' using errcode='22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user::text||':'||p_course_id::text,30));
  if (p_thread_id is null and exists(select 1 from public.forum_replies where author_id=v_user and request_id=p_request_id))
    or (p_thread_id is not null and exists(select 1 from public.forum_threads where author_id=v_user and request_id=p_request_id)) then
    raise exception 'forum_retry_conflict' using errcode='23505';
  end if;
  if p_thread_id is null then
    select * into v_thread from public.forum_threads where author_id=v_user and request_id=p_request_id;
    if found then
      if v_thread.course_id<>p_course_id or v_thread.title<>p_title or v_thread.body<>p_body then
        raise exception 'forum_retry_conflict' using errcode='23505';
      end if;
      return jsonb_build_object('threadId',v_thread.id,'postId',v_thread.id);
    end if;
  else
    select * into v_reply from public.forum_replies where author_id=v_user and request_id=p_request_id;
    if found then
      if v_reply.thread_id<>p_thread_id or v_reply.body<>p_body or not exists(
        select 1 from public.forum_threads t where t.id=p_thread_id and t.course_id=p_course_id) then
        raise exception 'forum_retry_conflict' using errcode='23505';
      end if;
      return jsonb_build_object('threadId',v_reply.thread_id,'postId',v_reply.id);
    end if;
    perform 1 from public.forum_threads where id=p_thread_id and course_id=p_course_id for key share;
    if not found then raise exception 'thread_unavailable' using errcode='P0002'; end if;
  end if;
  select (select count(*) from public.forum_threads where author_id=v_user and course_id=p_course_id and created_at>clock_timestamp()-interval '1 minute')
    +(select count(*) from public.forum_replies r join public.forum_threads t on t.id=r.thread_id
       where r.author_id=v_user and t.course_id=p_course_id and r.created_at>clock_timestamp()-interval '1 minute') into v_count;
  if v_count>=10 then raise exception 'forum_rate_limited' using errcode='P0001'; end if;
  select display_name into v_name from public.profiles where id=v_user;
  v_name:=coalesce(nullif(btrim(v_name),''),'Member');
  if p_thread_id is null then
    insert into public.forum_threads(course_id,author_id,author_name,author_role,title,body,request_id)
      values(p_course_id,v_user,v_name,v_role,p_title,p_body,p_request_id) returning id into v_id;
    p_thread_id:=v_id;
  else
    insert into public.forum_replies(thread_id,author_id,author_name,author_role,body,request_id)
      values(p_thread_id,v_user,v_name,v_role,p_body,p_request_id) returning id into v_id;
  end if;
  return jsonb_build_object('threadId',p_thread_id,'postId',v_id);
end
$function$;
revoke all on function forum_private.create_post(uuid,uuid,text,text,uuid) from public,anon,authenticated;
grant execute on function forum_private.create_post(uuid,uuid,text,text,uuid) to authenticated;

-- Lock the course before the assignment and recheck that grading is still
-- allowed after waiting for a concurrent archive or feature toggle.
create or replace function public.save_grade(p_submission_id uuid,p_scores jsonb,p_feedback text,p_total numeric,p_publish boolean,p_expected_version integer)
returns public.grades language plpgsql security definer set search_path='' as $function$
declare v_assignment uuid; v_student uuid; v_course uuid; v_saved public.grades; v_maximum numeric;
begin
  select s.assignment_id,s.student_id,a.course_id into v_assignment,v_student,v_course
    from public.submissions s join public.assignments a on a.id=s.assignment_id where s.id=p_submission_id;
  if v_assignment is null or not public.owns_assignment(v_assignment)
    or not course_private.can_use_feature(v_course,'assessments') then
    raise exception 'submission_not_owned' using errcode='42501';
  end if;
  perform 1 from public.courses where id=v_course and lifecycle='active' for share;
  if not found or not public.owns_assignment(v_assignment)
    or not course_private.can_use_feature(v_course,'assessments') then
    raise exception 'submission_not_owned' using errcode='42501';
  end if;
  perform 1 from public.assignments a where a.id=v_assignment for update;
  if not public.owns_assignment(v_assignment)
    or not course_private.can_use_feature(v_course,'assessments') then
    raise exception 'submission_not_owned' using errcode='42501';
  end if;
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
