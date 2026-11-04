create or replace function public.accept_course_invitation(p_token text) returns uuid
language plpgsql security definer set search_path='' as $function$
declare
 v_user uuid:=auth.uid();
 v_inv public.course_invitations;
 v_email text;
 v_course uuid;
 v_lifecycle text;
 v_inserted integer;
begin
 if v_user is null or not course_private.email_is_verified(v_user) then
   raise exception 'invitation_unavailable' using errcode='42501';
 end if;
 select lower(u.email) into v_email from auth.users u where u.id=v_user;
 select i.course_id into v_course from public.course_invitations i
 where i.token_hash=extensions.digest(coalesce(p_token,''),'sha256');
 if v_course is null then
   raise exception 'invitation_unavailable' using errcode='42501';
 end if;
 select c.lifecycle into v_lifecycle from public.courses c
 where c.id=v_course for update;
 if not found then
   raise exception 'invitation_unavailable' using errcode='42501';
 end if;
 select * into v_inv from public.course_invitations i
 where i.token_hash=extensions.digest(coalesce(p_token,''),'sha256') for update;
 if not found or v_inv.email<>v_email or v_inv.revoked_at is not null then
   raise exception 'invitation_unavailable' using errcode='42501';
 end if;
 if v_inv.accepted_at is not null then
   if v_inv.accepted_by=v_user then return v_inv.course_id; end if;
   raise exception 'invitation_unavailable' using errcode='42501';
 end if;
 if v_inv.expires_at<=clock_timestamp() or v_lifecycle<>'active' then
   raise exception 'invitation_unavailable' using errcode='42501';
 end if;
 if exists(
   select 1 from public.course_memberships m
   where m.course_id=v_inv.course_id and m.user_id=v_user
 ) then
   raise exception 'invitation_unavailable' using errcode='42501';
 end if;
 insert into public.course_memberships(course_id,user_id,role,added_by)
 values(v_inv.course_id,v_user,v_inv.role,v_inv.invited_by)
 on conflict(course_id,user_id) do nothing;
 get diagnostics v_inserted=row_count;
 if v_inserted<>1 then
   raise exception 'invitation_unavailable' using errcode='42501';
 end if;
 update public.course_invitations
 set accepted_by=v_user,accepted_at=clock_timestamp() where id=v_inv.id;
 return v_inv.course_id;
end $function$;
