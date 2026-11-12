begin;
select plan(8);

-- 1. 25 cases with is_public boolean are accepted
select ok(public.valid_practice_cases((
  select jsonb_agg(jsonb_build_object(
    'id', gen_random_uuid(),
    'name', 'Case ' || i,
    'stdin', '',
    'expected_stdout', '',
    'is_public', i % 2 = 0
  )) from generate_series(1, 25) i
)), '25 test cases with is_public boolean are accepted');

-- 2. 25 cases without is_public (4 keys) are also accepted for backwards compatibility
select ok(public.valid_practice_cases((
  select jsonb_agg(jsonb_build_object(
    'id', gen_random_uuid(),
    'name', 'Legacy Case ' || i,
    'stdin', '',
    'expected_stdout', ''
  )) from generate_series(1, 25) i
)), '25 test cases without is_public (4 keys) are accepted');

-- 3. 26 cases are rejected
select ok(not public.valid_practice_cases((
  select jsonb_agg(jsonb_build_object(
    'id', gen_random_uuid(),
    'name', 'Case ' || i,
    'stdin', '',
    'expected_stdout', ''
  )) from generate_series(1, 26) i
)), '26 test cases are rejected');

-- 4. Non-boolean is_public is rejected
select ok(not public.valid_practice_cases(jsonb_build_array(
  jsonb_build_object('id', gen_random_uuid(), 'name', 'Bad Case', 'stdin', '', 'expected_stdout', '', 'is_public', 'yes')
)), 'Non-boolean is_public is rejected');

-- 5. Extra disallowed keys are rejected
select ok(not public.valid_practice_cases(jsonb_build_array(
  jsonb_build_object('id', gen_random_uuid(), 'name', 'Bad Key', 'stdin', '', 'expected_stdout', '', 'is_public', true, 'extra', 123)
)), 'Objects with extra keys are rejected');

-- 6. RPC get_published_submission_grade exists
select has_function('public', 'get_published_submission_grade', array['uuid'], 'get_published_submission_grade function exists');

-- 7. public.grades has rubric_snapshot column
select has_column('public', 'grades', 'rubric_snapshot', 'grades table has rubric_snapshot column');

-- 8. Independent test publication is retired
select ok(to_regprocedure('public.save_practice_tests(uuid,integer,text,jsonb)') is null, 'independent test publication RPC is absent');

select * from finish();
rollback;
