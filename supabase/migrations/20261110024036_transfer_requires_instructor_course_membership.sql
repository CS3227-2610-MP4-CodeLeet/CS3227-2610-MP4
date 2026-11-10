-- Ownership transfer is limited to a verified instructor already enrolled
-- in this course. Students must be promoted through course management first.
create or replace function public.transfer_course_ownership(p_course uuid,p_new_owner uuid) returns void
language plpgsql security definer set search_path='' as $function$
declare v_old uuid:=auth.uid();
begin
 if v_old is null then raise exception 'course_owner_required' using errcode='42501'; end if;
 perform 1 from public.courses where id=p_course and lifecycle='active' and not is_legacy and owner_id=v_old for update;
 if not found then raise exception 'course_owner_required' using errcode='42501'; end if;
 if p_new_owner=v_old or not course_private.email_is_verified(p_new_owner) then raise exception 'verified_instructor_required' using errcode='42501'; end if;
 if not exists(
   select 1 from public.course_memberships m
   where m.course_id=p_course and m.user_id=p_new_owner and m.role='instructor'
 ) then
   raise exception 'course_instructor_required' using errcode='42501';
 end if;
 update public.courses set owner_id=p_new_owner,updated_at=clock_timestamp() where id=p_course;
 update public.course_memberships set role='instructor' where course_id=p_course and user_id=v_old;
 insert into course_private.ownership_events(course_id,previous_owner,new_owner,actor_id,event_type)
   values(p_course,v_old,p_new_owner,v_old,'transferred');
end $function$;
revoke all on function public.transfer_course_ownership(uuid,uuid) from public,anon;
grant execute on function public.transfer_course_ownership(uuid,uuid) to authenticated;
