-- Cache hits write AI usage history. Serialize that write with course archive,
-- AI feature changes and membership removal before rechecking authorization.
create or replace function public.record_ai_cache_hit(p_review_type text,p_submission_id uuid,p_input_tokens integer,p_output_tokens integer)
returns void language plpgsql security definer set search_path='' as $function$
declare v_user uuid:=auth.uid(); v_course uuid; v_role text;
begin
  if v_user is null then raise exception 'submission_not_allowed' using errcode='42501'; end if;
  select a.course_id into v_course from public.submissions s
    join public.assignments a on a.id=s.assignment_id
    where s.id=p_submission_id;
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
  insert into public.ai_usage(requester_id,submission_id,review_type,status,input_tokens,output_tokens,token_source,cache_hit)
    values(v_user,p_submission_id,p_review_type,'cache_hit',greatest(p_input_tokens,0),greatest(p_output_tokens,0),'estimate',true);
end;
$function$;
revoke all on function public.record_ai_cache_hit(text,uuid,integer,integer) from public,anon;
grant execute on function public.record_ai_cache_hit(text,uuid,integer,integer) to authenticated;

notify pgrst,'reload schema';
