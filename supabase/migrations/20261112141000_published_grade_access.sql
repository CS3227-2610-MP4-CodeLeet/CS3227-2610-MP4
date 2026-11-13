-- Issue #170: current course authorization and publication-only rubric context.
create or replace function public.get_published_submission_grade(p_submission_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $function$
declare
  v_user uuid := auth.uid();
  v_submission public.submissions;
  v_grade public.grades;

  v_criteria jsonb;
  v_result_criteria jsonb := '[]'::jsonb;
  v_criterion jsonb;
  v_score numeric;
  v_seen_ids text[] := '{}';
  v_key text;
begin
  if v_user is null then raise exception 'unauthorized' using errcode='42501'; end if;
  select * into v_submission from public.submissions where id = p_submission_id;
  if not found or v_submission.student_id <> v_user then
    return null;
  end if;
  if not course_private.email_is_verified()
    or not exists(select 1 from public.user_roles where user_id=v_user)
    or not course_private.is_member(v_submission.course_id,array['student'])
    or not course_private.can_read_feature(v_submission.course_id,'assessments') then
    return null;
  end if;
  select * into v_grade from public.grades
    where submission_id = p_submission_id and published_at is not null;
  if not found then return null; end if;

  -- Only a captured publication snapshot is authorized for release. Current
  -- private rubric edits must never become a legacy grade's public context.
  v_criteria := coalesce(v_grade.rubric_snapshot, '[]'::jsonb);

  for v_criterion in select value from jsonb_array_elements(v_criteria) loop
    v_score := (v_grade.scores->>(v_criterion->>'id'))::numeric;
    if v_score is not null then
      v_seen_ids := array_append(v_seen_ids, v_criterion->>'id');
      v_result_criteria := v_result_criteria || jsonb_build_array(jsonb_build_object(
        'id', v_criterion->>'id',
        'title', v_criterion->>'title',
        'description', coalesce(v_criterion->>'description', ''),
        'maxScore', (v_criterion->>'maxScore')::numeric,
        'score', v_score
      ));
    end if;
  end loop;

  -- Preserve any score keys that may have been removed or renamed in current rubric
  for v_key in select jsonb_object_keys(v_grade.scores) loop
    if not (v_key = any(v_seen_ids)) then
      v_score := (v_grade.scores->>v_key)::numeric;
      v_result_criteria := v_result_criteria || jsonb_build_array(jsonb_build_object(
        'id', v_key,
        'title', 'Criterion',
        'description', '',
        'maxScore', null,
        'score', v_score
      ));
    end if;
  end loop;

  return jsonb_build_object(
    'id', v_grade.id,
    'total_score', v_grade.total_score,
    'feedback', v_grade.feedback,
    'published_at', v_grade.published_at,
    'criteria', v_result_criteria
  );
end;
$function$;
revoke all on function public.get_published_submission_grade(uuid) from public,anon;
grant execute on function public.get_published_submission_grade(uuid) to authenticated;
notify pgrst, 'reload schema';
