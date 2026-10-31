create or replace function public.save_grade(
  p_submission_id uuid, p_scores jsonb, p_feedback text, p_total numeric,
  p_publish boolean, p_expected_version integer
)
returns public.grades
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user uuid := auth.uid();
  v_grade public.grades;
  v_assignment_id uuid;
  v_criteria jsonb;
  v_score_total numeric := 0;
  v_criterion jsonb;
begin
  if v_user is null or not exists (
    select 1 from public.user_roles r
    where r.user_id = v_user and r.role in ('instructor', 'admin')
  ) then
    raise exception using errcode = '42501', message = 'instructor_required';
  end if;
  if not exists (
    select 1 from public.submissions s
    join public.assignments a on a.id = s.assignment_id
    where s.id = p_submission_id and a.instructor_id = v_user
  ) then
    raise exception using errcode = '42501', message = 'submission_not_owned';
  end if;
  if jsonb_typeof(p_scores) <> 'object' or p_feedback is null or char_length(p_feedback) > 4000 or p_total is null or p_total < 0 then
    raise exception using errcode = '22023', message = 'invalid_grade';
  end if;

  select s.assignment_id into v_assignment_id
  from public.submissions s where s.id = p_submission_id;
  select r.criteria into v_criteria
  from public.assignment_rubrics r where r.assignment_id = v_assignment_id;
  if v_criteria is null or (select count(*) from jsonb_object_keys(p_scores)) <> jsonb_array_length(v_criteria) then
    raise exception using errcode = '22023', message = 'invalid_grade_criteria';
  end if;
  for v_criterion in select value from jsonb_array_elements(v_criteria)
  loop
    if p_scores ->> (v_criterion ->> 'id') is null
      or (p_scores ->> (v_criterion ->> 'id')) !~ '^\d+(\.\d+)?$'
      or (p_scores ->> (v_criterion ->> 'id'))::numeric < 0
      or (p_scores ->> (v_criterion ->> 'id'))::numeric > (v_criterion ->> 'maxScore')::numeric then
      raise exception using errcode = '22023', message = 'invalid_grade_criteria';
    end if;
    v_score_total := v_score_total + (p_scores ->> (v_criterion ->> 'id'))::numeric;
  end loop;
  if abs(v_score_total - p_total) >= 0.01 then
    raise exception using errcode = '22023', message = 'invalid_grade_total';
  end if;
  select * into v_grade from public.grades
  where submission_id = p_submission_id for update;
  if found then
    if v_grade.version <> p_expected_version then
      raise exception using errcode = '40001', message = 'grade_version_conflict';
    end if;
    update public.grades set scores = p_scores, feedback = p_feedback, total_score = p_total,
      published_at = case when p_publish then now() else null end,
      version = version + 1, updated_at = now()
      where id = v_grade.id returning * into v_grade;
  else
    if p_expected_version <> 0 then
      raise exception using errcode = '40001', message = 'grade_version_conflict';
    end if;
    insert into public.grades (submission_id, instructor_id, scores, feedback, total_score, published_at)
      values (p_submission_id, v_user, p_scores, p_feedback, p_total,
        case when p_publish then now() else null end)
      returning * into v_grade;
  end if;
  return v_grade;
end;
$function$;

revoke all on function public.save_grade(uuid, jsonb, text, numeric, boolean, integer) from public, anon;
grant execute on function public.save_grade(uuid, jsonb, text, numeric, boolean, integer) to authenticated;

notify pgrst, 'reload schema';
