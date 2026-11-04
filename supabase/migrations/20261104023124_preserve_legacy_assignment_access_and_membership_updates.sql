-- Keep migrated Legacy assignments under their pre-workspace per-record access
-- rules. Only non-Legacy courses use course membership for instructor access.
create or replace function public.owns_assignment(p_assignment_id uuid)
returns boolean language sql stable security definer set search_path='' as $function$
  select exists (
    select 1 from public.assignments a join public.courses c on c.id=a.course_id
    where a.id=p_assignment_id and (
      (not c.is_legacy and course_private.is_member(a.course_id,array['instructor'],true))
      or (c.is_legacy and a.instructor_id=auth.uid() and exists(
        select 1 from public.user_roles r where r.user_id=auth.uid() and r.role in ('instructor','admin')
      ))
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
        (not c.is_legacy and c.lifecycle='active' and m.user_id is not null and exists (
          select 1 from public.course_features f
          where f.course_id=a.course_id and f.feature='assessments' and f.enabled
        ) and (m.role='instructor' or a.publication_status='published'))
        or (not c.is_legacy and c.lifecycle='archived' and m.user_id is not null
          and (m.role='instructor' or a.publication_status='published'))
        or (c.is_legacy and (
          (a.publication_status='published' and exists(select 1 from public.user_roles r where r.user_id=auth.uid() and r.role='student'))
          or (a.instructor_id=auth.uid() and exists(select 1 from public.user_roles r where r.user_id=auth.uid() and r.role in ('instructor','admin')))
        ))
      )
  );
$function$;
revoke all on function course_private.can_read_assignment(uuid) from public,anon;
grant execute on function course_private.can_read_assignment(uuid) to authenticated;

-- The role-management RPC may update or remove existing members; invitations
-- and join codes remain the only enrollment paths for new members.
create or replace function public.set_course_member(p_course uuid,p_user uuid,p_role text default null) returns void
language plpgsql security definer set search_path='' as $function$
declare v_owner uuid; v_actor uuid:=auth.uid(); v_old text;
begin
 select owner_id into v_owner from public.courses where id=p_course and lifecycle='active' for update;
 if not found then raise exception 'course_unavailable' using errcode='42501'; end if;
 if v_actor is null or not course_private.is_member(p_course,array['instructor'],false) then raise exception 'course_staff_required' using errcode='42501'; end if;
 select role into v_old from public.course_memberships where course_id=p_course and user_id=p_user for update;
 if p_role is null then
   if p_user=v_owner and v_actor<>v_owner then raise exception 'course_owner_required' using errcode='42501'; end if;
   if p_user=v_owner then raise exception 'transfer_owner_first' using errcode='42501'; end if;
   if v_old='instructor' and v_actor<>v_owner then raise exception 'course_owner_required' using errcode='42501'; end if;
   delete from public.course_memberships where course_id=p_course and user_id=p_user;
   return;
 end if;
 if p_role not in ('student','instructor') or not course_private.email_is_verified(p_user) then raise exception 'verified_member_required' using errcode='42501'; end if;
 if v_old is null then raise exception 'course_member_required' using errcode='42501'; end if;
 if p_user=v_owner and p_role<>'instructor' then raise exception 'course_owner_required' using errcode='42501'; end if;
 if v_old='instructor' and p_role<>'instructor' and v_actor<>v_owner then raise exception 'course_owner_required' using errcode='42501'; end if;
 update public.course_memberships set role=p_role,added_by=v_actor where course_id=p_course and user_id=p_user;
end $function$;
revoke all on function public.set_course_member(uuid,uuid,text) from public,anon;
grant execute on function public.set_course_member(uuid,uuid,text) to authenticated;
