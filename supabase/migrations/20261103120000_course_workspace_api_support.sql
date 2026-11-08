-- Course detail updates and staff-only directory data for the course APIs.
create function public.update_course(p_course uuid,p_title text default null,p_description text default null)
returns jsonb language plpgsql security definer set search_path='' as $function$
declare v_course public.courses;
begin
 if auth.uid() is null or not course_private.is_member(p_course,array['instructor'],false) then raise exception 'course_staff_required' using errcode='42501'; end if;
 if p_title is null and p_description is null then raise exception 'invalid_course' using errcode='22023'; end if;
 if p_title is not null then p_title:=btrim(p_title); if char_length(p_title) not between 1 and 120 then raise exception 'invalid_course' using errcode='22023'; end if; end if;
 if p_description is not null and char_length(p_description)>4000 then raise exception 'invalid_course' using errcode='22023'; end if;
 update public.courses set title=coalesce(p_title,title),description=coalesce(p_description,description),updated_at=clock_timestamp()
 where id=p_course and lifecycle='active' and not is_legacy returning * into v_course;
 if not found then raise exception 'course_unavailable' using errcode='P0002'; end if;
 return jsonb_build_object('id',v_course.id,'title',v_course.title,'description',v_course.description,'updated_at',v_course.updated_at);
end $function$;
revoke all on function public.update_course(uuid,text,text) from public,anon;
grant execute on function public.update_course(uuid,text,text) to authenticated;

create function public.list_course_members(p_course uuid)
returns table(user_id uuid,email text,display_name text,role text,joined_at timestamptz)
language plpgsql security definer set search_path='' as $function$
begin
 if auth.uid() is null or not course_private.is_member(p_course,array['instructor']) then raise exception 'course_staff_required' using errcode='42501'; end if;
 return query select m.user_id,u.email::text,p.display_name::text,m.role,m.joined_at
 from public.course_memberships m join auth.users u on u.id=m.user_id
 left join public.profiles p on p.id=m.user_id where m.course_id=p_course order by m.role,m.joined_at,m.user_id;
end $function$;
revoke all on function public.list_course_members(uuid) from public,anon;
grant execute on function public.list_course_members(uuid) to authenticated;

create function public.list_course_invitations(p_course uuid)
returns table(id uuid,email text,role text,expires_at timestamptz,accepted_at timestamptz,revoked_at timestamptz,created_at timestamptz)
language plpgsql security definer set search_path='' as $function$
begin
 if auth.uid() is null or not course_private.is_member(p_course,array['instructor'],false) then raise exception 'course_staff_required' using errcode='42501'; end if;
 return query select i.id,i.email::text,i.role,i.expires_at,i.accepted_at,i.revoked_at,i.created_at
 from public.course_invitations i where i.course_id=p_course order by i.created_at desc limit 200;
end $function$;
revoke all on function public.list_course_invitations(uuid) from public,anon;
grant execute on function public.list_course_invitations(uuid) to authenticated;

notify pgrst,'reload schema';
