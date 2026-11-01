begin;
select plan(21);

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('93000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'admin-one@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Admin One"}', now(), now()),
  ('93000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'admin-two@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Admin Two"}', now(), now()),
  ('93000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'instructor@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Instructor"}', now(), now()),
  ('93000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'student@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Student","role":"admin"}', now(), now());

update public.user_roles set role = 'admin'
where user_id in ('93000000-0000-4000-8000-000000000001', '93000000-0000-4000-8000-000000000002');
update public.user_roles set role = 'instructor'
where user_id = '93000000-0000-4000-8000-000000000003';
update public.user_roles set role = 'instructor'
where role = 'admin'
  and user_id not in ('93000000-0000-4000-8000-000000000001', '93000000-0000-4000-8000-000000000002');

insert into public.assignments (id, instructor_id, title, instructions, publication_status)
values ('94000000-0000-4000-8000-000000000001', '93000000-0000-4000-8000-000000000001', 'Admin assignment', 'Test ownership.', 'draft');
insert into public.assignment_rubrics (assignment_id, criteria)
values ('94000000-0000-4000-8000-000000000001', '[{"id":"97000000-0000-4000-8000-000000000004","title":"Correctness","description":"Works","maxScore":10}]');
insert into public.submissions (id, assignment_id, student_id, source, revision, request_id)
values ('97000000-0000-4000-8000-000000000002', '94000000-0000-4000-8000-000000000001', '93000000-0000-4000-8000-000000000004', 'print(1)', 1, '97000000-0000-4000-8000-000000000003');

select is((select role from public.user_roles where user_id = '93000000-0000-4000-8000-000000000004'), 'student', 'public signup ignores admin metadata');
select ok(not has_table_privilege('authenticated', 'public.user_roles', 'INSERT'), 'authenticated users cannot insert roles directly');
select ok(not has_table_privilege('authenticated', 'public.user_roles', 'UPDATE'), 'authenticated users cannot update roles directly');
select ok(has_function_privilege('authenticated', 'public.admin_list_users(uuid,integer)', 'EXECUTE'), 'authenticated can call the guarded admin directory function');
select ok(not has_function_privilege('anon', 'public.admin_list_users(uuid,integer)', 'EXECUTE'), 'anonymous users cannot call the admin directory function');

set local role authenticated;
select set_config('request.jwt.claim.sub', '93000000-0000-4000-8000-000000000001', true);
select is((
  select count(*)::integer from public.admin_list_users(null, 100)
  where user_id in (
    '93000000-0000-4000-8000-000000000001', '93000000-0000-4000-8000-000000000002',
    '93000000-0000-4000-8000-000000000003', '93000000-0000-4000-8000-000000000004'
  )
), 4, 'admin directory returns the registered account page');
select results_eq(
  $$select user_id::text, email, display_name, role from public.admin_list_users(null, 100)
    where user_id in (
      '93000000-0000-4000-8000-000000000001', '93000000-0000-4000-8000-000000000002',
      '93000000-0000-4000-8000-000000000003', '93000000-0000-4000-8000-000000000004'
    ) order by user_id$$,
  $$values
    ('93000000-0000-4000-8000-000000000001', 'admin-one@example.test', 'Admin One', 'admin'),
    ('93000000-0000-4000-8000-000000000002', 'admin-two@example.test', 'Admin Two', 'admin'),
    ('93000000-0000-4000-8000-000000000003', 'instructor@example.test', 'Instructor', 'instructor'),
    ('93000000-0000-4000-8000-000000000004', 'student@example.test', 'Student', 'student')$$,
  'admin directory returns only the approved account projection'
);
select is(public.owns_assignment('94000000-0000-4000-8000-000000000001'), true, 'admin inherits instructor assignment ownership');
select is((select count(*)::integer from public.assignments where id = '94000000-0000-4000-8000-000000000001'), 1, 'admin can read an owned instructor assignment');
select lives_ok($$select public.save_grade('97000000-0000-4000-8000-000000000002', '{"97000000-0000-4000-8000-000000000004":8}', 'Admin grading', 8, false, 0)$$, 'admin can grade an owned submission');
select lives_ok($$select public.admin_set_user_role('93000000-0000-4000-8000-000000000004', 'instructor')$$, 'admin can assign an allowed role');
select is((
  select role from public.admin_list_users(null, 100)
  where user_id = '93000000-0000-4000-8000-000000000004'
), 'instructor', 'admin role change is stored');
select throws_ok($$select public.admin_set_user_role('93000000-0000-4000-8000-000000000004', 'owner')$$, '22023', 'invalid_role', 'unsupported role is rejected');
select throws_ok($$select public.admin_set_user_role('93000000-0000-4000-8000-000000000099', 'student')$$, 'P0002', 'target_not_found', 'unknown target is rejected');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '93000000-0000-4000-8000-000000000003', true);
select throws_ok($$select * from public.admin_list_users(null, 20)$$, '42501', 'admin_required', 'instructor cannot list accounts');
select throws_ok($$select public.admin_set_user_role('93000000-0000-4000-8000-000000000004', 'student')$$, '42501', 'admin_required', 'instructor cannot change roles');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '93000000-0000-4000-8000-000000000004', true);
select throws_ok($$select * from public.admin_list_users(null, 20)$$, '42501', 'admin_required', 'student cannot list accounts');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '93000000-0000-4000-8000-000000000001', true);
select lives_ok($$select public.admin_set_user_role('93000000-0000-4000-8000-000000000001', 'instructor')$$, 'admin can confirm a self-demotion while another admin remains');
select is((select role from public.user_roles where user_id = auth.uid()), 'instructor', 'self-demotion takes effect immediately');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '93000000-0000-4000-8000-000000000002', true);
select throws_ok($$select public.admin_set_user_role('93000000-0000-4000-8000-000000000002', 'student')$$, 'P0001', 'final_admin_required', 'the final admin cannot be demoted');
select is((
  select count(*)::integer from public.admin_list_users(null, 100) where role = 'admin'
), 1, 'a failed final-admin demotion preserves one admin');

select * from finish();
rollback;
