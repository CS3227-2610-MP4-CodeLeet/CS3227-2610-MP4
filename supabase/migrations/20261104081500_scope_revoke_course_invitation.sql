create or replace function public.revoke_course_invitation(p_invitation uuid, p_course uuid) returns void
language plpgsql security definer set search_path='' as $function$
declare
  v_course uuid;
begin
  select course_id into v_course from public.course_invitations where id=p_invitation;
  if v_course is null or (p_course is not null and v_course <> p_course) then
    raise exception 'invitation_unavailable' using errcode='42501';
  end if;
  perform 1 from public.courses where id=v_course and lifecycle='active' for update;
  if not found or not course_private.is_member(v_course,array['instructor'],false) then
    raise exception 'invitation_unavailable' using errcode='42501';
  end if;
  update public.course_invitations set revoked_at=clock_timestamp() where id=p_invitation and accepted_at is null and revoked_at is null;
end $function$;

revoke all on function public.revoke_course_invitation(uuid, uuid) from public,anon;
grant execute on function public.revoke_course_invitation(uuid, uuid) to authenticated;

create or replace function public.revoke_course_invitation(p_invitation uuid) returns void
language plpgsql security definer set search_path='' as $function$
declare
  v_course uuid;
begin
  select course_id into v_course from public.course_invitations where id=p_invitation;
  if v_course is null then
    raise exception 'invitation_unavailable' using errcode='42501';
  end if;
  perform public.revoke_course_invitation(p_invitation, v_course);
end $function$;

revoke all on function public.revoke_course_invitation(uuid) from public,anon;
grant execute on function public.revoke_course_invitation(uuid) to authenticated;
