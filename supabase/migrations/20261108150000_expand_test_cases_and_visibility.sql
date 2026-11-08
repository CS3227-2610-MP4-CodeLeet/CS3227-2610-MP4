-- Expand test case ceiling from 5 to 25 and support per-case is_public visibility.
create or replace function public.valid_practice_cases(p_cases jsonb) returns boolean
language plpgsql immutable set search_path = '' as $$
declare item jsonb; ids uuid[] := '{}'; case_id uuid; case_name text; key_count integer;
  trim_characters constant text := U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF';
begin
  if p_cases is null or jsonb_typeof(p_cases) <> 'array' then return false; end if;
  if jsonb_array_length(p_cases) > 25 then return false; end if;
  for item in select value from jsonb_array_elements(p_cases) loop
    if jsonb_typeof(item) <> 'object' then return false; end if;
    key_count := (select count(*) from jsonb_object_keys(item));
    if key_count not in (4, 5) then return false; end if;
    if not (item ? 'id' and item ? 'name' and item ? 'stdin' and item ? 'expected_stdout') then return false; end if;
    if jsonb_typeof(item->'id') is distinct from 'string'
       or jsonb_typeof(item->'name') is distinct from 'string'
       or jsonb_typeof(item->'stdin') is distinct from 'string'
       or jsonb_typeof(item->'expected_stdout') is distinct from 'string' then return false; end if;
    if key_count = 5 and (not (item ? 'is_public') or jsonb_typeof(item->'is_public') is distinct from 'boolean') then return false; end if;
    if (item->>'id') !~* '^([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$' then return false; end if;
    case_id := (item->>'id')::uuid;
    if case_id = any(ids) then return false; end if;
    ids := array_append(ids,case_id);
    case_name := btrim(item->>'name',trim_characters);
    if length(case_name) < 1 or length(case_name) > 120
       or octet_length(item->>'stdin') > 4096 or octet_length(item->>'expected_stdout') > 8192 then return false; end if;
  end loop;
  return true;
exception when others then return false;
end $$;
revoke all on function public.valid_practice_cases(jsonb) from public,anon,authenticated;

-- Drop any existing 13-argument version with defaults to prevent overload resolution ambiguity.
drop function if exists public.save_course_assignment(uuid,uuid,integer,text,text,jsonb,text,text,timestamptz,boolean,integer,boolean,jsonb);

-- Update save_course_assignment to atomically accept and persist test cases.
create or replace function public.save_course_assignment(
  p_course_id uuid,p_assignment_id uuid,p_expected_version integer,p_title text,
  p_instructions text,p_criteria jsonb,p_publication_status text,p_language text,
  p_due_at timestamptz,p_update_due_at boolean,p_max_xp integer,p_update_max_xp boolean,
  p_cases jsonb
) returns public.assignments language plpgsql security definer set search_path='' as $function$
declare
  v_assignment public.assignments;
  v_user uuid:=auth.uid();
  v_public_cases jsonb;
begin
  if v_user is null or not course_private.email_is_verified(v_user)
    or p_course_id is null or not course_private.is_member(p_course_id,array['instructor'],false)
    or not course_private.can_use_feature(p_course_id,'assessments') then
    raise exception 'course_staff_required' using errcode='42501';
  end if;
  perform 1 from public.courses where id=p_course_id and lifecycle='active' for update;
  if not found or not course_private.is_member(p_course_id,array['instructor'],false)
    or not course_private.can_use_feature(p_course_id,'assessments') then
    raise exception 'course_unavailable' using errcode='42501';
  end if;
  if char_length(btrim(p_title)) not between 1 and 160
    or char_length(btrim(p_instructions)) not between 1 and 12000
    or jsonb_typeof(p_criteria)<>'array' or jsonb_array_length(p_criteria) not between 1 and 20
    or p_publication_status not in ('draft','published')
    or p_language not in ('python','java')
    or (p_due_at is not null and not isfinite(p_due_at))
    or (p_update_max_xp and (p_max_xp is null or p_max_xp not between 0 and 100000))
    or (p_cases is not null and not public.valid_practice_cases(p_cases))
    or exists(select 1 from jsonb_array_elements(p_criteria) criterion where
      jsonb_typeof(criterion.value)<>'object'
      or coalesce(criterion.value->>'id','') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      or char_length(coalesce(criterion.value->>'title','')) not between 1 and 120
      or char_length(coalesce(criterion.value->>'description','')) not between 1 and 1000
      or jsonb_typeof(criterion.value->'maxScore')<>'number'
      or (case when jsonb_typeof(criterion.value->'maxScore')='number' then (criterion.value->>'maxScore')::numeric else 0 end) not between 1 and 100)
  then raise exception 'invalid_assignment' using errcode='22023'; end if;

  if p_assignment_id is null then
    if p_expected_version<>0 then raise exception 'assignment_version_conflict' using errcode='40001'; end if;
    insert into public.assignments(instructor_id,title,instructions,publication_status,language,course_id,due_at,max_xp)
      values(v_user,btrim(p_title),btrim(p_instructions),p_publication_status,p_language,p_course_id,
        case when p_update_due_at then p_due_at else null end,
        case when p_update_max_xp then p_max_xp else 0 end) returning * into v_assignment;
    insert into public.assignment_rubrics(assignment_id,criteria) values(v_assignment.id,p_criteria);
  else
    select * into v_assignment from public.assignments
      where id=p_assignment_id and course_id=p_course_id for update;
    if not found or v_assignment.version<>p_expected_version then
      raise exception 'assignment_version_conflict' using errcode='40001';
    end if;
    if v_assignment.language is distinct from p_language and exists(
      select 1 from public.submissions where assignment_id=p_assignment_id
    ) then raise exception 'assignment_language_locked' using errcode='40001'; end if;
    update public.assignments set title=btrim(p_title),instructions=btrim(p_instructions),
      publication_status=p_publication_status,language=p_language,
      due_at=case when p_update_due_at then p_due_at else due_at end,
      max_xp=case when p_update_max_xp then p_max_xp else max_xp end,
      version=version+1,updated_at=clock_timestamp()
      where id=p_assignment_id returning * into v_assignment;
    insert into public.assignment_rubrics(assignment_id,criteria) values(p_assignment_id,p_criteria)
      on conflict(assignment_id) do update set criteria=excluded.criteria,
        version=public.assignment_rubrics.version+1,updated_at=clock_timestamp();
  end if;

  if p_cases is not null then
    insert into public.assignment_practice_drafts(assignment_id, cases, version)
      values(v_assignment.id, p_cases, 1)
      on conflict(assignment_id) do update set cases = excluded.cases,
        version = public.assignment_practice_drafts.version + 1, updated_at = clock_timestamp();
    if p_publication_status = 'published' then
      select coalesce(jsonb_agg(c.value), '[]'::jsonb) into v_public_cases
        from jsonb_array_elements(p_cases) c
        where coalesce((c.value->>'is_public')::boolean, true) = true;
      insert into public.assignment_practice_sets(assignment_id, cases, published_revision, published_at)
        values(v_assignment.id, v_public_cases, 1, clock_timestamp())
        on conflict(assignment_id) do update set cases = excluded.cases,
          published_revision = public.assignment_practice_sets.published_revision + 1,
          published_at = clock_timestamp();
    end if;
  end if;

  return v_assignment;
end;
$function$;

-- 12-argument overload for backwards compatibility with existing calls.
create or replace function public.save_course_assignment(
  p_course_id uuid,p_assignment_id uuid,p_expected_version integer,p_title text,
  p_instructions text,p_criteria jsonb,p_publication_status text,p_language text,
  p_due_at timestamptz,p_update_due_at boolean,p_max_xp integer,p_update_max_xp boolean
) returns public.assignments language plpgsql security definer set search_path='' as $function$
begin
  return public.save_course_assignment(
    p_course_id, p_assignment_id, p_expected_version, p_title, p_instructions,
    p_criteria, p_publication_status, p_language, p_due_at, p_update_due_at,
    p_max_xp, p_update_max_xp, null
  );
end;
$function$;

revoke all on function public.save_course_assignment(uuid,uuid,integer,text,text,jsonb,text,text,timestamptz,boolean,integer,boolean,jsonb) from public,anon;
grant execute on function public.save_course_assignment(uuid,uuid,integer,text,text,jsonb,text,text,timestamptz,boolean,integer,boolean,jsonb) to authenticated;
revoke all on function public.save_course_assignment(uuid,uuid,integer,text,text,jsonb,text,text,timestamptz,boolean,integer,boolean) from public,anon;
grant execute on function public.save_course_assignment(uuid,uuid,integer,text,text,jsonb,text,text,timestamptz,boolean,integer,boolean) to authenticated;

-- Security definer helper to securely return published grade with criteria details to student.
create or replace function public.get_published_submission_grade(p_submission_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $function$
declare
  v_user uuid := auth.uid();
  v_submission public.submissions;
  v_grade public.grades;
  v_rubric public.assignment_rubrics;
  v_criteria jsonb;
  v_result_criteria jsonb := '[]'::jsonb;
  v_criterion jsonb;
  v_score numeric;
begin
  if v_user is null then raise exception 'unauthorized' using errcode='42501'; end if;
  select * into v_submission from public.submissions where id = p_submission_id;
  if not found or v_submission.student_id <> v_user then
    return null;
  end if;
  select * into v_grade from public.grades
    where submission_id = p_submission_id and published_at is not null;
  if not found then return null; end if;
  select * into v_rubric from public.assignment_rubrics
    where assignment_id = v_submission.assignment_id;
  v_criteria := coalesce(v_rubric.criteria, '[]'::jsonb);
  for v_criterion in select value from jsonb_array_elements(v_criteria) loop
    v_score := (v_grade.scores->>(v_criterion->>'id'))::numeric;
    v_result_criteria := v_result_criteria || jsonb_build_array(jsonb_build_object(
      'id', v_criterion->>'id',
      'title', v_criterion->>'title',
      'description', coalesce(v_criterion->>'description', ''),
      'maxScore', (v_criterion->>'maxScore')::numeric,
      'score', coalesce(v_score, 0)
    ));
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

revoke all on function public.get_published_submission_grade(uuid) from public, anon;
grant execute on function public.get_published_submission_grade(uuid) to authenticated;
