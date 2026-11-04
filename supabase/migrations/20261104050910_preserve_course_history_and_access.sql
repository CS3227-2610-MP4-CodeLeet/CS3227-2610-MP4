-- Keep immutable submissions course-scoped even when assignment metadata is
-- hidden from students after an assignment is unpublished.
alter table public.submissions add column course_id uuid;
update public.submissions s set course_id=a.course_id
from public.assignments a where a.id=s.assignment_id;
alter table public.submissions alter column course_id set not null;
alter table public.submissions add constraint submissions_course_id_fkey
  foreign key(course_id) references public.courses(id) on delete restrict;
create index submissions_course_student_history_idx
  on public.submissions(course_id,student_id,created_at desc,id desc);

create function course_private.set_submission_course_id() returns trigger
language plpgsql security definer set search_path='' as $function$
begin
  select a.course_id into new.course_id from public.assignments a where a.id=new.assignment_id;
  if new.course_id is null then raise exception 'submission_not_allowed' using errcode='42501'; end if;
  return new;
end $function$;
revoke all on function course_private.set_submission_course_id() from public,anon,authenticated;
create trigger submissions_course_context before insert or update of assignment_id,course_id
  on public.submissions for each row execute function course_private.set_submission_course_id();

drop policy submissions_read_student_or_owner on public.submissions;
create policy submissions_read_student_or_owner on public.submissions for select to authenticated using(
  (student_id=(select auth.uid()) and exists(
    select 1 from public.course_memberships m where m.course_id=submissions.course_id
      and m.user_id=(select auth.uid()) and m.role='student'))
  or (course_private.can_read_assignment(assignment_id) and public.owns_assignment(assignment_id))
);

drop policy grades_read_published_or_owner on public.grades;
create policy grades_read_published_or_owner on public.grades for select to authenticated using(
  (grades.published_at is not null and exists(
    select 1 from public.submissions s join public.course_memberships m
      on m.course_id=s.course_id and m.user_id=(select auth.uid()) and m.role='student'
    where s.id=grades.submission_id and s.student_id=(select auth.uid())))
  or (course_private.can_read_assignment((select s.assignment_id from public.submissions s where s.id=grades.submission_id))
    and public.owns_assignment((select s.assignment_id from public.submissions s where s.id=grades.submission_id)))
);

-- The private validator is only called by the course-authorized wrapper. Keep
-- its grade validation and optimistic versioning, but do not require a global
-- instructor role or assignment creator identity inside this private core.
create or replace function xp_private.save_grade_core(
  p_submission_id uuid,p_scores jsonb,p_feedback text,p_total numeric,
  p_publish boolean,p_expected_version integer
) returns public.grades language plpgsql security definer set search_path='' as $function$
declare
  v_user uuid:=auth.uid(); v_grade public.grades; v_assignment_id uuid;
  v_criteria jsonb; v_score_total numeric:=0; v_criterion jsonb;
begin
  if v_user is null then raise exception using errcode='42501',message='instructor_required'; end if;
  if not exists(select 1 from public.submissions s where s.id=p_submission_id) then
    raise exception using errcode='42501',message='submission_not_owned';
  end if;
  if jsonb_typeof(p_scores)<>'object' or p_feedback is null or char_length(p_feedback)>4000 or p_total is null or p_total<0 then
    raise exception using errcode='22023',message='invalid_grade';
  end if;
  select s.assignment_id into v_assignment_id from public.submissions s where s.id=p_submission_id;
  select r.criteria into v_criteria from public.assignment_rubrics r where r.assignment_id=v_assignment_id;
  if v_criteria is null or (select count(*) from jsonb_object_keys(p_scores))<>jsonb_array_length(v_criteria) then
    raise exception using errcode='22023',message='invalid_grade_criteria';
  end if;
  for v_criterion in select value from jsonb_array_elements(v_criteria) loop
    if p_scores->>(v_criterion->>'id') is null
      or (p_scores->>(v_criterion->>'id')) !~ '^\d+(\.\d+)?$'
      or (p_scores->>(v_criterion->>'id'))::numeric<0
      or (p_scores->>(v_criterion->>'id'))::numeric>(v_criterion->>'maxScore')::numeric then
      raise exception using errcode='22023',message='invalid_grade_criteria';
    end if;
    v_score_total:=v_score_total+(p_scores->>(v_criterion->>'id'))::numeric;
  end loop;
  if abs(v_score_total-p_total)>=0.01 then raise exception using errcode='22023',message='invalid_grade_total'; end if;
  select * into v_grade from public.grades where submission_id=p_submission_id for update;
  if found then
    if v_grade.version<>p_expected_version then raise exception using errcode='40001',message='grade_version_conflict'; end if;
    update public.grades set scores=p_scores,feedback=p_feedback,total_score=p_total,
      published_at=case when p_publish then now() else null end,version=version+1,updated_at=now()
      where id=v_grade.id returning * into v_grade;
  else
    if p_expected_version<>0 then raise exception using errcode='40001',message='grade_version_conflict'; end if;
    insert into public.grades(submission_id,instructor_id,scores,feedback,total_score,published_at)
      values(p_submission_id,v_user,p_scores,p_feedback,p_total,case when p_publish then now() else null end)
      returning * into v_grade;
  end if;
  return v_grade;
end;
$function$;
revoke all on function xp_private.save_grade_core(uuid,jsonb,text,numeric,boolean,integer) from public,anon,authenticated;

-- Correlate usage visibility to the outer row, not any membership row in the
-- inner existence check.
drop policy usage_read_self on public.ai_usage;
create policy usage_read_self on public.ai_usage for select to authenticated using(
  requester_id=(select auth.uid()) and exists(
    select 1 from public.courses c join public.course_memberships m
      on m.course_id=c.id and m.user_id=(select auth.uid())
    where c.id=ai_usage.course_id));

-- Authorized instructors can inspect snapshots for their draft assignments;
-- students remain limited to published assignments.
drop policy practice_public_reader on public.assignment_practice_sets;
create policy practice_public_reader on public.assignment_practice_sets for select to authenticated using(
  course_private.can_read_assignment(assignment_id) and (
    public.owns_assignment(assignment_id) or exists(
      select 1 from public.assignments a where a.id=assignment_id and a.publication_status='published'))
);

notify pgrst,'reload schema';
