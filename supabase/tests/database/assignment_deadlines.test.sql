begin;
select no_plan();
select has_column('public','assignments','due_at','assignments have an optional due instant');
select has_column('public','submissions','due_at_submission','revisions retain the captured deadline');
select has_column('public','submissions','is_late','revisions retain database-owned lateness');

insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
 ('a1000000-0000-4000-8000-000000000001','authenticated','authenticated','deadline-owner@example.test','',now(),'{}','{}',now(),now()),
 ('a1000000-0000-4000-8000-000000000002','authenticated','authenticated','deadline-student@example.test','',now(),'{}','{}',now(),now()),
 ('a1000000-0000-4000-8000-000000000003','authenticated','authenticated','deadline-peer@example.test','',now(),'{}','{}',now(),now()),
 ('a1000000-0000-4000-8000-000000000004','authenticated','authenticated','deadline-other-owner@example.test','',now(),'{}','{}',now(),now());
update public.user_roles set role='instructor' where user_id in ('a1000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000004');
insert into public.assignments (id,instructor_id,title,instructions,language,publication_status,due_at,course_id) values ('a2000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000001','Past Python','Synthetic deadline test.','python','published','2000-01-01T00:00:00Z',(select id from public.courses where is_legacy)),
 ('a2000000-0000-4000-8000-000000000002','a1000000-0000-4000-8000-000000000001','Future Java','Synthetic deadline test.','java','published','2999-01-01T00:00:00Z',(select id from public.courses where is_legacy)),
 ('a2000000-0000-4000-8000-000000000003','a1000000-0000-4000-8000-000000000001','No deadline','Synthetic deadline test.','python','published',null,(select id from public.courses where is_legacy));
insert into public.assignment_rubrics(assignment_id,criteria)
select id,'[{"id":"a5000000-0000-4000-8000-000000000001","title":"Output","description":"Synthetic criterion","maxScore":10}]'::jsonb
from public.assignments where id in ('a2000000-0000-4000-8000-000000000001','a2000000-0000-4000-8000-000000000002','a2000000-0000-4000-8000-000000000003');
create temp table deadline_results(name text primary key,id uuid);
grant all on deadline_results to authenticated;

-- Privileged synthetic insertion tests exact equality and trigger override, not a student API.
insert into public.submissions(id,assignment_id,student_id,source,revision,request_id,created_at,due_at_submission,is_late)
values ('a4000000-0000-4000-8000-000000000001','a2000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000003','print(1)',1,'a3000000-0000-4000-8000-000000000001','2000-01-01T00:00:00Z','2999-01-01T00:00:00Z',true);
select ok(not is_late and due_at_submission=created_at,'exact deadline is on time and supplied timing is replaced')
from public.submissions where id='a4000000-0000-4000-8000-000000000001';

set local role authenticated;
select set_config('request.jwt.claim.sub','a1000000-0000-4000-8000-000000000002',true);
insert into deadline_results values
 ('late',(public.submit_code('a2000000-0000-4000-8000-000000000001','print(2)','a3000000-0000-4000-8000-000000000002')).id),
 ('future',(public.submit_code('a2000000-0000-4000-8000-000000000002','public class Main {}','a3000000-0000-4000-8000-000000000003')).id),
 ('none',(public.submit_code('a2000000-0000-4000-8000-000000000003','print(3)','a3000000-0000-4000-8000-000000000004')).id);
select ok(is_late and due_at_submission='2000-01-01T00:00:00Z'::timestamptz,'late Python save succeeds with captured deadline') from public.submissions where id=(select id from deadline_results where name='late');
select ok(not is_late and due_at_submission='2999-01-01T00:00:00Z'::timestamptz and language='java','on-time Java retains language and deadline') from public.submissions where id=(select id from deadline_results where name='future');
select ok(not is_late and due_at_submission is null,'no-deadline save has no invented lateness') from public.submissions where id=(select id from deadline_results where name='none');
select ok(created_at > now(),'new save time is actual database time, not transaction start') from public.submissions where id=(select id from deadline_results where name='late');
select throws_ok($$update public.submissions set is_late=false where id=(select id from deadline_results where name='late')$$,'42501',null,'student cannot rewrite late metadata');
select throws_ok($$insert into public.submissions(assignment_id,student_id,source,revision,request_id,created_at,is_late) values ('a2000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000002','fake',99,gen_random_uuid(),'1900-01-01',false)$$,'42501',null,'student cannot forge a submission timestamp through table writes');
select throws_ok($$select public.save_assignment('a2000000-0000-4000-8000-000000000001',1,'No','No.','[]','published','python',null)$$,'42501','instructor_required','student cannot change deadlines');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','a1000000-0000-4000-8000-000000000001',true);
select is((public.save_assignment('a2000000-0000-4000-8000-000000000001',1,'Past Python','Synthetic deadline test.',(select criteria from public.assignment_rubrics where assignment_id='a2000000-0000-4000-8000-000000000001'),'published','python','2999-01-01T00:00:00Z')).due_at,'2999-01-01T00:00:00Z'::timestamptz,'owner can extend a deadline through the versioned RPC');
select throws_ok($$select public.save_assignment('a2000000-0000-4000-8000-000000000001',1,'Stale','Synthetic.',(select criteria from public.assignment_rubrics where assignment_id='a2000000-0000-4000-8000-000000000001'),'published','python',null)$$,'40001','assignment_version_conflict','stale deadline update is rejected');
select throws_ok($$select public.save_assignment('a2000000-0000-4000-8000-000000000001',2,'Invalid','Synthetic.',(select criteria from public.assignment_rubrics where assignment_id='a2000000-0000-4000-8000-000000000001'),'published','python','infinity')$$,'22023','invalid_deadline','nonfinite deadlines are rejected');
select is((public.save_assignment('a2000000-0000-4000-8000-000000000001',2,'Past Python','Synthetic deadline test.',(select criteria from public.assignment_rubrics where assignment_id='a2000000-0000-4000-8000-000000000001'),'published','python')).due_at,'2999-01-01T00:00:00Z'::timestamptz,'legacy seven-argument updates preserve the deadline');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','a1000000-0000-4000-8000-000000000002',true);
select is((public.submit_code('a2000000-0000-4000-8000-000000000001','print(2)','a3000000-0000-4000-8000-000000000002')).id,(select id from deadline_results where name='late'),'identical retry after extension returns original revision');
select ok(is_late and due_at_submission='2000-01-01T00:00:00Z'::timestamptz,'extension does not rewrite captured late history') from public.submissions where id=(select id from deadline_results where name='late');
select ok(not (public.submit_code('a2000000-0000-4000-8000-000000000001','print(4)','a3000000-0000-4000-8000-000000000005')).is_late,'new revision uses the extended deadline');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','a1000000-0000-4000-8000-000000000001',true);
select ok((public.save_assignment('a2000000-0000-4000-8000-000000000001',3,'Past Python','Synthetic deadline test.',(select criteria from public.assignment_rubrics where assignment_id='a2000000-0000-4000-8000-000000000001'),'published','python',null)).due_at is null,'explicit null clears a deadline');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','a1000000-0000-4000-8000-000000000003',true);
select is((select count(*)::integer from public.submissions where id=(select id from deadline_results where name='late')),0,'peer cannot read captured metadata');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','a1000000-0000-4000-8000-000000000004',true);
select is((select count(*)::integer from public.submissions where id=(select id from deadline_results where name='late')),0,'unrelated instructor cannot read timing');
select throws_ok($$select public.save_assignment('a2000000-0000-4000-8000-000000000001',4,'Steal','Synthetic.','[{"id":"a5000000-0000-4000-8000-000000000001","title":"Output","description":"Synthetic criterion","maxScore":10}]','published','python',null)$$,'40001','assignment_version_conflict','unrelated instructor cannot alter deadlines');
reset role;
select ok(not has_function_privilege('anon','public.save_assignment(uuid,integer,text,text,jsonb,text,text,timestamptz)','EXECUTE'),'anonymous callers cannot edit deadlines');
select * from finish();
rollback;
