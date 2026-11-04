-- Serialize course edits with membership changes so a removed instructor
-- cannot pass an authorization check made before the removal commits.
create or replace function public.update_course(p_course uuid,p_title text default null,p_description text default null)
returns jsonb language plpgsql security definer set search_path='' as $function$
declare v_course public.courses;
begin
 select c.* into v_course from public.courses c where c.id=p_course for update;
 if not found or auth.uid() is null
   or v_course.lifecycle<>'active' or v_course.is_legacy
   or not course_private.is_member(p_course,array['instructor'],false) then
   raise exception 'course_staff_required' using errcode='42501';
 end if;
 if p_title is null and p_description is null then raise exception 'invalid_course' using errcode='22023'; end if;
 if p_title is not null then p_title:=btrim(p_title); if char_length(p_title) not between 1 and 120 then raise exception 'invalid_course' using errcode='22023'; end if; end if;
 if p_description is not null and char_length(p_description)>4000 then raise exception 'invalid_course' using errcode='22023'; end if;
 update public.courses set title=coalesce(p_title,title),description=coalesce(p_description,description),updated_at=clock_timestamp()
 where id=p_course returning * into v_course;
 if not found then raise exception 'course_unavailable' using errcode='P0002'; end if;
 return jsonb_build_object('id',v_course.id,'title',v_course.title,'description',v_course.description,'updated_at',v_course.updated_at);
end $function$;
revoke all on function public.update_course(uuid,text,text) from public,anon;
grant execute on function public.update_course(uuid,text,text) to authenticated;

notify pgrst,'reload schema';
