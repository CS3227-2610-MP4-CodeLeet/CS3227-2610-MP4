-- Reconcile grades and assignment XP changes made while XP was disabled.
create or replace function public.set_course_feature(p_course uuid,p_feature text,p_enabled boolean) returns void
language plpgsql security definer set search_path='' as $function$
declare v_was_enabled boolean; v_assignment record;
begin
 perform 1 from public.courses c where c.id=p_course and c.lifecycle='active' for update;
 if not found or auth.uid() is null or not course_private.is_member(p_course,array['instructor'],false) then raise exception 'course_staff_required' using errcode='42501'; end if;
 if p_feature not in ('assessments','ai','discussions','xp','leaderboard') or p_enabled is null then raise exception 'invalid_course_feature' using errcode='22023'; end if;
 select f.enabled into v_was_enabled from public.course_features f where f.course_id=p_course and f.feature=p_feature;
 if not found then raise exception 'course_unavailable' using errcode='P0002'; end if;
 update public.course_features set enabled=p_enabled,updated_at=clock_timestamp(),updated_by=auth.uid() where course_id=p_course and feature=p_feature;
 if p_feature='xp' and p_enabled and not v_was_enabled then
   for v_assignment in select a.id from public.assignments a where a.course_id=p_course loop
     perform xp_private.recompute(v_assignment.id,null,'assignment_xp_change');
   end loop;
 end if;
end $function$;
revoke all on function public.set_course_feature(uuid,text,boolean) from public,anon;
grant execute on function public.set_course_feature(uuid,text,boolean) to authenticated;

notify pgrst,'reload schema';
