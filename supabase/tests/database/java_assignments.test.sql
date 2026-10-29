begin;
select no_plan();
select has_column('public', 'submissions', 'language', 'revisions store language');

insert into auth.users(id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
 ('71000000-0000-4000-8000-000000000001','authenticated','authenticated','java-owner@example.test','',now(),'{}','{}',now(),now()),
 ('71000000-0000-4000-8000-000000000002','authenticated','authenticated','java-student-a@example.test','',now(),'{}','{}',now(),now()),
 ('71000000-0000-4000-8000-000000000003','authenticated','authenticated','java-student-b@example.test','',now(),'{}','{}',now(),now()),
 ('71000000-0000-4000-8000-000000000004','authenticated','authenticated','java-other-owner@example.test','',now(),'{}','{}',now(),now());
update public.user_roles set role='instructor' where user_id in ('71000000-0000-4000-8000-000000000001','71000000-0000-4000-8000-000000000004');
insert into public.assignments(id,instructor_id,title,instructions,language,publication_status) values
 ('72000000-0000-4000-8000-000000000001','71000000-0000-4000-8000-000000000001','Python fixture','Print one.','python','published'),
 ('72000000-0000-4000-8000-000000000002','71000000-0000-4000-8000-000000000001','Java fixture','Use Main.','java','published'),
 ('72000000-0000-4000-8000-000000000003','71000000-0000-4000-8000-000000000001','Draft Java fixture','Unpublished.','java','draft');
insert into public.assignment_rubrics(assignment_id,criteria) values
 ('72000000-0000-4000-8000-000000000002','[{"id":"75000000-0000-4000-8000-000000000001","title":"Private criterion","description":"Synthetic private rubric","maxScore":10}]');
insert into public.submissions(assignment_id,student_id,source,revision,request_id,language) values
 ('72000000-0000-4000-8000-000000000002','71000000-0000-4000-8000-000000000003','class Other {}',1,'74000000-0000-4000-8000-000000000001','python');
select is((select language from public.submissions where request_id='74000000-0000-4000-8000-000000000001'),'java','database derives language even if an insert claims Python');

set local role authenticated;
select set_config('request.jwt.claim.sub','71000000-0000-4000-8000-000000000002',true);
select is((public.submit_code('72000000-0000-4000-8000-000000000002','class Main {}','74000000-0000-4000-8000-000000000002')).language,'java','student submits Java');
select is((public.submit_code('72000000-0000-4000-8000-000000000001','print(1)','74000000-0000-4000-8000-000000000003')).language,'python','student still submits Python');
select is((public.submit_code('72000000-0000-4000-8000-000000000002','class Main {}','74000000-0000-4000-8000-000000000002')).revision,1,'Java retry returns original revision');
select is((public.submit_code('72000000-0000-4000-8000-000000000002','class Main { int n; }','74000000-0000-4000-8000-000000000004')).revision,2,'Java resubmission allocates revision two');
select is((select source from public.submissions where request_id='74000000-0000-4000-8000-000000000002'),'class Main {}','first Java revision source is unchanged');
reset role;
insert into public.grades(submission_id,instructor_id,scores,feedback,total_score,published_at)
select id,'71000000-0000-4000-8000-000000000001','{}','Synthetic private draft',0,null
from public.submissions where request_id='74000000-0000-4000-8000-000000000002';
set local role authenticated;
select set_config('request.jwt.claim.sub','71000000-0000-4000-8000-000000000002',true);
select is((select count(*)::integer from public.grades),0,'own unpublished Java grade stays hidden');
select is((select count(*)::integer from public.submissions where assignment_id='72000000-0000-4000-8000-000000000002'),2,'student sees only own Java revisions');
select is((select count(*)::integer from public.submissions where student_id='71000000-0000-4000-8000-000000000003'),0,'other student source and language stay private');
select is((select count(*)::integer from public.assignment_rubrics where assignment_id='72000000-0000-4000-8000-000000000002'),0,'Java private rubric is hidden');
select throws_ok($$select public.submit_code('72000000-0000-4000-8000-000000000003','class Main {}','74000000-0000-4000-8000-000000000005')$$,'P0002','assignment_unavailable','draft Java rejects submission');
select throws_ok($$select public.submit_code('72000000-0000-4000-8000-000000000002','changed','74000000-0000-4000-8000-000000000002')$$,'23505','request_id_conflict','Java conflicting retry is rejected');
select ok(not has_table_privilege('authenticated','public.submissions','UPDATE'),'revision update remains unavailable');
select ok(not has_table_privilege('authenticated','public.submissions','INSERT'),'client cannot forge revision identity/language by direct insert');
select throws_ok($$select public.save_assignment(null,0,'Forbidden','No access.','[]','draft','java')$$,'42501','instructor_required','student cannot create Java assignments');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','71000000-0000-4000-8000-000000000001',true);
select throws_ok($$select public.save_assignment('72000000-0000-4000-8000-000000000002',1,'Changed','New instructions.',(select criteria from public.assignment_rubrics where assignment_id='72000000-0000-4000-8000-000000000002'),'published','python')$$,'22023','assignment_language_locked','instructor cannot relabel existing Java revisions');
select is((select version from public.assignments where id='72000000-0000-4000-8000-000000000002'),1,'failed relabel rolls back the whole save');
select is((select version from public.assignment_rubrics where assignment_id='72000000-0000-4000-8000-000000000002'),1,'failed relabel also rolls back rubric changes');
select is((public.save_assignment(null,0,'Created Java fixture','Use Main.',(select criteria from public.assignment_rubrics where assignment_id='72000000-0000-4000-8000-000000000002'),'published','java')).language,'java','instructor creates Java through guarded RPC');
select is((public.save_assignment(null,0,'Legacy Python fixture','Print one.',(select criteria from public.assignment_rubrics where assignment_id='72000000-0000-4000-8000-000000000002'),'draft')).language,'python','old six-argument caller still creates Python');
select throws_ok($$select public.save_assignment(null,0,'Invalid','No JS.',(select criteria from public.assignment_rubrics where assignment_id='72000000-0000-4000-8000-000000000002'),'draft','javascript')$$,'22023','invalid_language','RPC rejects unsupported languages');
select is((public.save_assignment('72000000-0000-4000-8000-000000000003',1,'Draft changed','No revisions yet.',(select criteria from public.assignment_rubrics where assignment_id='72000000-0000-4000-8000-000000000002'),'draft','python')).language,'python','language may change before submissions');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','71000000-0000-4000-8000-000000000004',true);
select is((select count(*)::integer from public.submissions where assignment_id='72000000-0000-4000-8000-000000000002'),0,'unrelated instructor cannot read Java revisions');
select throws_ok($$select public.save_assignment('72000000-0000-4000-8000-000000000002',1,'Steal','No access.','[{"id":"75000000-0000-4000-8000-000000000001","title":"Output","description":"Synthetic criterion","maxScore":10}]','published','java')$$,'40001','assignment_version_conflict','unrelated instructor cannot edit a Java assignment');
reset role;
select ok(not has_function_privilege('anon','public.save_assignment(uuid,integer,text,text,jsonb,text,text)','EXECUTE'),'anonymous Java RPC access is denied');
select * from finish();
rollback;
