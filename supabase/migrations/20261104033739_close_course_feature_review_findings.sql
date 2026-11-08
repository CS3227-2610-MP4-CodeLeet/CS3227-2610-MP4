-- Course feature settings are authoritative for server-generated XP. The
-- existing grade/max-XP triggers keep their call sites and become no-ops while
-- XP is disabled.
create or replace function xp_private.recompute(p_assignment_id uuid,p_student_id uuid,p_reason text)
returns void language plpgsql security definer set search_path='' as $function$
declare v_course uuid;
begin
  select a.course_id into v_course from public.assignments a where a.id=p_assignment_id;
  if v_course is null or not course_private.can_use_feature(v_course,'xp') then return; end if;
  insert into public.xp_ledger(student_id,assignment_id,previous_xp,new_xp,delta,reason,actor_id)
  select n.student_id,p_assignment_id,coalesce(w.amount,0),n.amount,n.amount-coalesce(w.amount,0),p_reason,auth.uid()
  from xp_private.proposed_awards(p_assignment_id,p_student_id) n
  left join public.xp_awards w on w.assignment_id=p_assignment_id and w.student_id=n.student_id
  where n.amount<>coalesce(w.amount,0);
  insert into public.xp_awards(student_id,assignment_id,amount,grade_id,grade_version)
  select n.student_id,p_assignment_id,n.amount,n.grade_id,n.grade_version
  from xp_private.proposed_awards(p_assignment_id,p_student_id) n
  on conflict(student_id,assignment_id) do update set amount=excluded.amount,grade_id=excluded.grade_id,
    grade_version=excluded.grade_version,updated_at=clock_timestamp();
end;
$function$;
revoke all on function xp_private.recompute(uuid,uuid,text) from public,anon,authenticated;

-- Serialize the transition from authorization to AI reservation with course
-- archive, feature and membership updates.
create or replace function public.reserve_ai_request(p_review_type text,p_submission_id uuid)
returns uuid language plpgsql security definer set search_path='' as $function$
declare v_user uuid:=auth.uid(); v_course uuid; v_role text; v_limit integer; v_count integer; v_id uuid:=gen_random_uuid();
begin
  if v_user is null then raise exception 'submission_not_allowed' using errcode='42501'; end if;
  select a.course_id into v_course from public.submissions s
    join public.assignments a on a.id=s.assignment_id where s.id=p_submission_id;
  if v_course is null then raise exception 'submission_not_allowed' using errcode='42501'; end if;
  perform 1 from public.courses c where c.id=v_course and c.lifecycle='active' for share;
  if not found then raise exception 'submission_not_allowed' using errcode='42501'; end if;
  select m.role into v_role from public.course_memberships m
    join public.submissions s on s.id=p_submission_id
    join public.assignments a on a.id=s.assignment_id and a.course_id=m.course_id
    where m.course_id=v_course and m.user_id=v_user
      and ((p_review_type='student_feedback' and s.student_id=v_user and m.role='student')
        or (p_review_type='instructor_evaluation' and m.role='instructor'));
  if v_role is null or not course_private.can_use_feature(v_course,'ai') then
    raise exception 'submission_not_allowed' using errcode='42501';
  end if;
  if p_review_type='student_feedback' and v_role='student' then v_limit:=5;
  elsif p_review_type='instructor_evaluation' and v_role='instructor' then v_limit:=20;
  else raise exception 'role_not_allowed' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user::text||':'||v_course::text||':'||p_review_type||':'||(now() at time zone 'utc')::date::text,0));
  update public.ai_usage set status='failed',error_category='reservation_expired'
    where requester_id=v_user and course_id=v_course and status='pending' and created_at<now()-interval '3 minutes';
  select count(*) into v_count from public.ai_usage where requester_id=v_user and review_type=p_review_type
    and course_id=v_course and created_at>=date_trunc('day',now() at time zone 'utc') at time zone 'utc'
    and (status='succeeded' or status='pending');
  if v_count>=v_limit then raise exception 'daily_quota_exceeded' using errcode='P0001'; end if;
  insert into public.ai_usage(id,requester_id,submission_id,review_type,status)
    values(v_id,v_user,p_submission_id,p_review_type,'pending');
  return v_id;
end;
$function$;
revoke all on function public.reserve_ai_request(text,uuid) from public,anon;
grant execute on function public.reserve_ai_request(text,uuid) to authenticated;

-- Legacy members retain per-record historical access but never receive the
-- staff-only account-email directory for the entire migrated platform.
create or replace function public.list_course_members(p_course uuid)
returns table(user_id uuid,email text,display_name text,role text,joined_at timestamptz)
language plpgsql security definer set search_path='' as $function$
begin
  if auth.uid() is null or not course_private.is_member(p_course,array['instructor'])
    or exists(select 1 from public.courses c where c.id=p_course and c.is_legacy) then
    raise exception 'course_staff_required' using errcode='42501';
  end if;
  return query select m.user_id,u.email::text,p.display_name::text,m.role,m.joined_at
    from public.course_memberships m join auth.users u on u.id=m.user_id
    left join public.profiles p on p.id=m.user_id
    where m.course_id=p_course order by m.role,m.joined_at,m.user_id;
end;
$function$;
revoke all on function public.list_course_members(uuid) from public,anon;
grant execute on function public.list_course_members(uuid) to authenticated;

notify pgrst,'reload schema';
