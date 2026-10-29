begin;
select plan(24);

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('20000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'instructor@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{"role":"instructor"}', now(), now()),
  ('20000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'student-one@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('20000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'student-two@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('20000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'instructor-two@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

update public.user_roles set role = 'instructor' where user_id = '20000000-0000-4000-8000-000000000001';
update public.user_roles set role = 'instructor' where user_id = '20000000-0000-4000-8000-000000000004';
insert into public.assignments (id, instructor_id, title, instructions, publication_status)
values
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Published', 'Write a loop.', 'published'),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'Draft', 'Private draft.', 'draft'),
  ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000004', 'Other owner', 'Not accessible.', 'published');
insert into public.assignment_rubrics (assignment_id, criteria)
values
  ('30000000-0000-4000-8000-000000000001', '[{"id":"40000000-0000-4000-8000-000000000001","title":"Correctness","description":"Works","maxScore":10}]'),
  ('30000000-0000-4000-8000-000000000003', '[{"id":"40000000-0000-4000-8000-000000000002","title":"Private","description":"Other owner rubric.","maxScore":10}]');
insert into public.submissions (id, assignment_id, student_id, source, revision, request_id)
values
  ('50000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', 'print(1)', 1, '60000000-0000-4000-8000-000000000001'),
  ('50000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000003', 'print(2)', 1, '60000000-0000-4000-8000-000000000002');
insert into public.grades (submission_id, instructor_id, scores, feedback, total_score, published_at)
values
  ('50000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '{}', 'Draft', 0, null),
  ('50000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', '{}', 'Published to another student', 10, now());

select is((select role from public.user_roles where user_id = '20000000-0000-4000-8000-000000000002'), 'student', 'public signups are students');
select is((select count(*)::integer from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'assignment_rubrics' and policyname = 'rubrics_read_owner'), 1, 'rubrics have an owner-scoped read policy');

set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000002', true);
select is((select count(id)::integer from public.assignments where id = '30000000-0000-4000-8000-000000000001'), 1, 'student sees the published fixture assignment');
select is((select count(id)::integer from public.assignments where id = '30000000-0000-4000-8000-000000000002'), 0, 'student cannot see the draft fixture assignment');
select is((select count(*)::integer from public.assignment_rubrics), 0, 'student cannot read private rubrics');
select is((select count(*)::integer from public.submissions), 1, 'student sees only own submissions');
select is((select count(*)::integer from public.grades), 0, 'student cannot see unpublished or other student grades');
select is((public.submit_code('30000000-0000-4000-8000-000000000001', 'print(3)', '60000000-0000-4000-8000-000000000003')).revision, 2, 'submission revision is assigned atomically');
select is((public.submit_code('30000000-0000-4000-8000-000000000001', 'print(3)', '60000000-0000-4000-8000-000000000003')).id, (select id from public.submissions where request_id = '60000000-0000-4000-8000-000000000003'), 'identical retries return the original submission');
select throws_ok($$select public.submit_code('30000000-0000-4000-8000-000000000001', 'print(4)', '60000000-0000-4000-8000-000000000003')$$, '23505', 'request_id_conflict', 'conflicting retries are rejected');
select ok(has_function_privilege('authenticated', 'public.reserve_ai_request(text,uuid)', 'EXECUTE'), 'authenticated users can reserve AI quota through the guarded function');
select ok(not has_table_privilege('authenticated', 'public.submissions', 'INSERT'), 'clients cannot insert submissions directly');
select ok(not has_table_privilege('authenticated', 'public.submissions', 'UPDATE'), 'clients cannot mutate immutable submissions directly');
select ok(not has_table_privilege('authenticated', 'public.assignments', 'INSERT'), 'assignment writes require the validated RPC');
select ok(not has_table_privilege('authenticated', 'public.assignment_rubrics', 'UPDATE'), 'rubric writes require the validated RPC');
select ok(not has_table_privilege('authenticated', 'public.grades', 'INSERT'), 'grade writes require the publication RPC');
select public.reserve_ai_request('student_feedback', '50000000-0000-4000-8000-000000000001');
select public.reserve_ai_request('student_feedback', '50000000-0000-4000-8000-000000000001');
select public.reserve_ai_request('student_feedback', '50000000-0000-4000-8000-000000000001');
select public.reserve_ai_request('student_feedback', '50000000-0000-4000-8000-000000000001');
select public.reserve_ai_request('student_feedback', '50000000-0000-4000-8000-000000000001');
select public.record_ai_cache_hit('student_feedback', '50000000-0000-4000-8000-000000000001', 12, 20);
select is((select count(*)::integer from public.ai_usage where requester_id = auth.uid() and status = 'cache_hit'), 1, 'cache hits are recorded separately from successful quota usage');
select throws_ok($$select public.reserve_ai_request('student_feedback', '50000000-0000-4000-8000-000000000001')$$, 'P0001', 'daily_quota_exceeded', 'daily successful request quota is reserved atomically');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000001', true);
select is((public.save_grade('50000000-0000-4000-8000-000000000001', '{"40000000-0000-4000-8000-000000000001":8}', 'Good', 8, true, 1)).version, 2, 'instructor explicitly publishes a versioned grade');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000002', true);
select is((select count(*)::integer from public.grades), 1, 'student sees the published grade for their own submission');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000001', true);
select is((select count(*)::integer from public.assignments where id in ('30000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000002')), 2, 'instructor sees both owned published and draft assignments');
select is((select count(*)::integer from public.assignments where id = '30000000-0000-4000-8000-000000000003'), 0, 'instructor cannot see another owner assignment');
select is((select count(*)::integer from public.submissions where id in ('50000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000002')), 2, 'instructor sees submissions for owned assignments');
select is((select count(*)::integer from public.assignment_rubrics where assignment_id = '30000000-0000-4000-8000-000000000003'), 0, 'instructor cannot see another owner rubric');

select * from finish();
rollback;
