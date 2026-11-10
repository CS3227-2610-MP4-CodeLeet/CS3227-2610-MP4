begin;
select no_plan();
with function_source as (
  select lower(pg_get_functiondef('public.submit_code(uuid,text,uuid)'::regprocedure)) as source
)
select ok(position('from public.courses c where c.id=v_course and c.lifecycle=''active'' for share' in source)>0
  and position('select m.role into v_role' in substring(source from position('for share' in source)))>0
  and position('can_use_feature' in substring(source from position('for share' in source)))>0,
  'submission writer locks its course and rechecks membership and assessment access') from function_source;
with function_source as (
  select lower(pg_get_functiondef('public.reserve_ai_request(text,uuid)'::regprocedure)) as source
)
select ok(position('from public.courses c where c.id=v_course and c.lifecycle=''active'' for share' in source)>0
  and position('select m.role into v_role' in substring(source from position('for share' in source)))>0
  and position('can_use_feature' in substring(source from position('for share' in source)))>0,
  'AI reservation locks its course and rechecks membership and feature access') from function_source;
with function_source as (
  select lower(pg_get_functiondef('public.record_ai_cache_hit(text,uuid,integer,integer)'::regprocedure)) as source
)
select ok(position('from public.courses c where c.id=v_course and c.lifecycle=''active'' for share' in source)>0
  and position('select m.role into v_role' in substring(source from position('for share' in source)))>0
  and position('can_use_feature' in substring(source from position('for share' in source)))>0,
  'AI cache-hit writer locks its course and rechecks membership and feature access') from function_source;

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('20000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'instructor@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{"role":"instructor"}', now(), now()),
  ('20000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'student-one@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('20000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'student-two@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('20000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'instructor-two@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

update public.user_roles set role = 'instructor' where user_id = '20000000-0000-4000-8000-000000000001';
update public.user_roles set role = 'instructor' where user_id = '20000000-0000-4000-8000-000000000004';
insert into public.courses(id,owner_id,created_by,title,description) values ('22000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Scoped fixture','');
insert into public.course_memberships(course_id,user_id,role) values ('22000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','instructor');
insert into public.course_memberships(course_id,user_id,role) values ('22000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000004','instructor');
insert into public.course_memberships(course_id,user_id,role) values ('22000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002','student');
insert into public.course_memberships(course_id,user_id,role) values ('22000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000003','student');
insert into public.course_features(course_id,feature,enabled) select '22000000-0000-4000-8000-000000000001',feature,true from unnest(array['assessments','ai','discussions','xp','leaderboard']) feature;
insert into public.courses(id,owner_id,created_by,title,description) values ('22000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000004','Other course','');
insert into public.course_memberships(course_id,user_id,role) values ('22000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000004','instructor');
insert into public.course_memberships(course_id,user_id,role) values ('22000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','student');
insert into public.course_features(course_id,feature,enabled) select '22000000-0000-4000-8000-000000000002',feature,true from unnest(array['assessments','ai','discussions','xp','leaderboard']) feature;
insert into public.assignments (id, instructor_id, title, instructions, publication_status,course_id) values ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Published', 'Write a loop.', 'published','22000000-0000-4000-8000-000000000001'::uuid),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'Draft', 'Private draft.', 'draft','22000000-0000-4000-8000-000000000001'::uuid),
  ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000004', 'Other owner', 'Not accessible.', 'published','22000000-0000-4000-8000-000000000002'::uuid),
  ('30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000004', 'Second course', 'Separate AI quota.', 'published','22000000-0000-4000-8000-000000000002'::uuid);
insert into public.assignment_rubrics (assignment_id, criteria)
values
  ('30000000-0000-4000-8000-000000000001', '[{"id":"40000000-0000-4000-8000-000000000001","title":"Correctness","description":"Works","maxScore":10}]'),
  ('30000000-0000-4000-8000-000000000003', '[{"id":"40000000-0000-4000-8000-000000000002","title":"Private","description":"Other owner rubric.","maxScore":10}]');
insert into public.submissions (id, assignment_id, student_id, source, revision, request_id)
values
  ('50000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', 'print(1)', 1, '60000000-0000-4000-8000-000000000001'),
  ('50000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000003', 'print(2)', 1, '60000000-0000-4000-8000-000000000002'),
  ('50000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000002', 'print(3)', 1, '60000000-0000-4000-8000-000000000004');
insert into public.grades (submission_id, instructor_id, scores, feedback, total_score, published_at)
values
  ('50000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '{}', 'Draft', 0, null),
  ('50000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', '{}', 'Published to another student', 10, now());
insert into public.ai_reviews (submission_id,requester_id,review_type,assignment_version,rubric_version,prompt_version,model,cache_key,result)
values
  ('50000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002','student_feedback',1,null,'test-v1','test-model','student-history-fixture','{"feedback":"Student guidance"}'),
  ('50000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000004','instructor_evaluation',1,1,'test-v1','test-model','instructor-history-fixture','{"suggestions":[]}');
create temporary table ai_usage_test_state (usage_id uuid primary key);
grant all on ai_usage_test_state to service_role;

select is((select role from public.user_roles where user_id = '20000000-0000-4000-8000-000000000002'), 'student', 'public signups are students');
select is((select count(*)::integer from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'assignment_rubrics' and policyname = 'rubrics_read_owner'), 1, 'rubrics have an owner-scoped read policy');

set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000002', true);
select is((select count(id)::integer from public.assignments where id = '30000000-0000-4000-8000-000000000001'), 1, 'student sees the published fixture assignment');
select is((select count(id)::integer from public.assignments where id = '30000000-0000-4000-8000-000000000002'), 0, 'student cannot see the draft fixture assignment');
select is((select count(*)::integer from public.assignment_rubrics), 0, 'student cannot read private rubrics');
select is((select count(*)::integer from public.submissions where assignment_id='30000000-0000-4000-8000-000000000001'), 1, 'student sees only own submissions for this assignment');
select is((select count(*)::integer from public.grades), 0, 'student cannot see unpublished or other student grades');
select is((public.submit_code('30000000-0000-4000-8000-000000000001', 'print(3)', '60000000-0000-4000-8000-000000000003')).revision, 2, 'submission revision is assigned atomically');
select is((public.submit_code('30000000-0000-4000-8000-000000000001', 'print(3)', '60000000-0000-4000-8000-000000000003')).id, (select id from public.submissions where request_id = '60000000-0000-4000-8000-000000000003'), 'identical retries return the original submission');
select throws_ok($$select public.submit_code('30000000-0000-4000-8000-000000000001', 'print(4)', '60000000-0000-4000-8000-000000000003')$$, '23505', 'request_id_conflict', 'conflicting retries are rejected');
select ok(not has_function_privilege('authenticated', 'public.reserve_ai_request(text,uuid)', 'EXECUTE'), 'authenticated users cannot create server-managed provider reservations');
select ok(has_function_privilege('service_role', 'public.reserve_ai_request(uuid,text,uuid,text)', 'EXECUTE'), 'only the server role can create a provider reservation');
select ok(not has_function_privilege('authenticated', 'public.finish_ai_request(uuid,boolean,text,integer,integer,integer,text)', 'EXECUTE'), 'authenticated users cannot finalize provider usage');
select ok(has_function_privilege('service_role', 'public.finish_ai_request(uuid,uuid,text,boolean,text,integer,integer,integer,text)', 'EXECUTE'), 'server role can finalize provider usage with its private reservation capability');
select ok(not has_table_privilege('authenticated', 'public.ai_reviews', 'INSERT'), 'clients cannot forge AI reviews');
select ok(not has_function_privilege('authenticated', 'public.record_ai_cache_hit(text,uuid,integer,integer)', 'EXECUTE'), 'clients cannot forge cache-hit usage');
select ok(has_function_privilege('service_role', 'public.record_ai_cache_hit(uuid,text,uuid,text,integer,integer)', 'EXECUTE'), 'server can record a verified cache hit');
select ok(not has_table_privilege('authenticated', 'public.submissions', 'INSERT'), 'clients cannot insert submissions directly');
select ok(not has_table_privilege('authenticated', 'public.submissions', 'UPDATE'), 'clients cannot mutate immutable submissions directly');
select ok(not has_table_privilege('authenticated', 'public.assignments', 'INSERT'), 'assignment writes require the validated RPC');
select ok(not has_table_privilege('authenticated', 'public.assignment_rubrics', 'UPDATE'), 'rubric writes require the validated RPC');
select ok(not has_table_privilege('authenticated', 'public.grades', 'INSERT'), 'grade writes require the publication RPC');
reset role;
set local role service_role;
insert into ai_usage_test_state
select public.reserve_ai_request('20000000-0000-4000-8000-000000000002','student_feedback','50000000-0000-4000-8000-000000000001',repeat('a',64));
select throws_ok($$select public.finish_ai_request((select usage_id from ai_usage_test_state),'20000000-0000-4000-8000-000000000002',null,true)$$,
  '42501','completion_not_allowed','null completion capability is rejected');
select throws_ok($$select public.finish_ai_request((select usage_id from ai_usage_test_state),'20000000-0000-4000-8000-000000000002',repeat('b',64),true)$$,
  '42501','completion_not_allowed','wrong completion capability cannot release a reservation');
select is((select status from public.ai_usage where id=(select usage_id from ai_usage_test_state)),'pending','wrong completion capability leaves usage pending');
select lives_ok($$select public.finish_ai_request((select usage_id from ai_usage_test_state),'20000000-0000-4000-8000-000000000002',repeat('a',64),true,null,20,12,4,'estimate')$$,
  'matching server capability finalizes provider usage');
select throws_ok($$select public.finish_ai_request((select usage_id from ai_usage_test_state),'20000000-0000-4000-8000-000000000002',repeat('a',64),true,null,20,12,4,'estimate')$$,
  '42501','completion_not_allowed','completion capability cannot be replayed');
select public.reserve_ai_request('20000000-0000-4000-8000-000000000002','student_feedback','50000000-0000-4000-8000-000000000001',repeat('b',64));
select public.reserve_ai_request('20000000-0000-4000-8000-000000000002','student_feedback','50000000-0000-4000-8000-000000000001',repeat('c',64));
select public.reserve_ai_request('20000000-0000-4000-8000-000000000002','student_feedback','50000000-0000-4000-8000-000000000001',repeat('d',64));
select public.reserve_ai_request('20000000-0000-4000-8000-000000000002','student_feedback','50000000-0000-4000-8000-000000000001',repeat('e',64));
reset role;
set local role service_role;
select lives_ok($$select public.record_ai_cache_hit('20000000-0000-4000-8000-000000000002','student_feedback', '50000000-0000-4000-8000-000000000001', 'student-history-fixture', 12, 20)$$, 'server records a verified cached review');
select throws_ok($$select public.record_ai_cache_hit('20000000-0000-4000-8000-000000000002','student_feedback', '50000000-0000-4000-8000-000000000001', 'missing-cache-key', 12, 20)$$, '42501', 'cache_hit_not_allowed', 'server cannot record a nonexistent cache hit');
select is((select count(*)::integer from public.ai_usage where requester_id = '20000000-0000-4000-8000-000000000002' and status = 'cache_hit'), 1, 'cache hits are recorded separately from successful quota usage');
select throws_ok($$select public.reserve_ai_request('20000000-0000-4000-8000-000000000002','student_feedback','50000000-0000-4000-8000-000000000001',repeat('f',64))$$, 'P0001', 'daily_quota_exceeded', 'daily successful request quota is reserved atomically');
select ok(public.reserve_ai_request('20000000-0000-4000-8000-000000000002','student_feedback','50000000-0000-4000-8000-000000000003',repeat('f',64)) is not null, 'daily AI quota is independent for each course');

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
select ok(course_private.can_read_assignment('30000000-0000-4000-8000-000000000001'), 'current instructor can read the published assignment');
select ok(course_private.can_use_feature('22000000-0000-4000-8000-000000000001', 'ai'), 'current instructor has the enabled AI feature');
select ok(exists (select 1 from public.course_memberships where course_id='22000000-0000-4000-8000-000000000001' and user_id=auth.uid() and role='instructor'), 'current user has instructor membership');
select is((select count(*)::integer from public.ai_reviews where review_type='instructor_evaluation'),1,'current course instructor can read instructor evaluation history');

reset role;
update public.course_memberships set role='student' where course_id='22000000-0000-4000-8000-000000000001' and user_id='20000000-0000-4000-8000-000000000004';
set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000004', true);
select is((select count(*)::integer from public.ai_reviews where requester_id=auth.uid() and review_type='instructor_evaluation'),0,'course role demotion hides private instructor evaluation history');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000002', true);
select is((select count(*)::integer from public.ai_reviews where requester_id=auth.uid() and review_type='student_feedback'),1,'student feedback history remains available to its requester');
reset role;
update public.user_roles set role = 'student' where user_id = '20000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000001', true);
select lives_ok($$select public.save_grade('50000000-0000-4000-8000-000000000001', '{"40000000-0000-4000-8000-000000000001":8}', 'Course instructor', 8, false, 2)$$, 'course instructor can grade despite a different platform-wide role');
reset role;
select is((select version from public.grades where submission_id = '50000000-0000-4000-8000-000000000001'), 3, 'course-authorized grade save advances the grade version');

set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000001', true);
select lives_ok($$select public.set_course_member('22000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002',null)$$,'owner can remove a student from one course');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000002', true);
select is((select count(*)::integer from public.ai_usage where course_id='22000000-0000-4000-8000-000000000001'),0,'removed member cannot read AI usage history from the prior course');
select ok((select count(*)::integer from public.ai_usage where course_id='22000000-0000-4000-8000-000000000002')>0,'remaining course usage stays readable');

select * from finish();
rollback;
