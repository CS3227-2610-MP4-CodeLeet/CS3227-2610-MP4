begin;
select no_plan();
select ok(to_regprocedure('public.save_practice_tests(uuid,integer,text,jsonb)') is null, 'independent publication RPC is retired');
select has_table('public','assignment_practice_drafts','instructor case storage is preserved');
select has_table('public','assignment_practice_sets','student projection storage is preserved');
insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
 ('b1000000-0000-4000-8000-000000000001','authenticated','authenticated','case-owner@example.test','',now(),'{}','{}',now(),now()),
 ('b1000000-0000-4000-8000-000000000002','authenticated','authenticated','case-student@example.test','',now(),'{}','{}',now(),now()),
 ('b1000000-0000-4000-8000-000000000003','authenticated','authenticated','case-other@example.test','',now(),'{}','{}',now(),now());
update public.user_roles set role='instructor' where user_id in ('b1000000-0000-4000-8000-000000000001','b1000000-0000-4000-8000-000000000003');
insert into public.courses(id,owner_id,created_by,title,description) values ('b4000000-0000-4000-8000-000000000001','b1000000-0000-4000-8000-000000000001','b1000000-0000-4000-8000-000000000001','Practice test fixture','');
insert into public.course_memberships(course_id,user_id,role) values
 ('b4000000-0000-4000-8000-000000000001','b1000000-0000-4000-8000-000000000001','instructor'),
 ('b4000000-0000-4000-8000-000000000001','b1000000-0000-4000-8000-000000000002','student');
insert into public.course_features(course_id,feature,enabled) values
 ('b4000000-0000-4000-8000-000000000001','assessments',true);
insert into public.assignments (id,instructor_id,title,instructions,language,publication_status,course_id) values ('b2000000-0000-4000-8000-000000000001','b1000000-0000-4000-8000-000000000001','Cases Python','Synthetic','python','published','b4000000-0000-4000-8000-000000000001'),
 ('b2000000-0000-4000-8000-000000000002','b1000000-0000-4000-8000-000000000001','Cases Java','Synthetic','java','draft','b4000000-0000-4000-8000-000000000001');
create function pg_temp.save_cases(p_id uuid, p_cases jsonb, p_status text default 'published')
returns public.assignments language sql as $$
  select public.save_course_assignment(
    'b4000000-0000-4000-8000-000000000001', p_id,
    (select version from public.assignments where id=p_id),
    'Cases', 'Synthetic assignment',
    '[{"id":"b5000000-0000-4000-8000-000000000001","title":"Correctness","description":"Synthetic rubric","maxScore":10}]',
    p_status, 'python', null, false, null, false, p_cases);
$$;
set local role authenticated;
select set_config('request.jwt.claim.sub','b1000000-0000-4000-8000-000000000001',true);
select lives_ok($$select pg_temp.save_cases('b2000000-0000-4000-8000-000000000001',
 '[{"id":"b3000000-0000-4000-8000-000000000001","name":"Public","stdin":" 2 3\n","expected_stdout":"5\n","is_public":true},
 {"id":"b3000000-0000-4000-8000-000000000002","name":"Private","stdin":"","expected_stdout":"","is_public":false}]')$$,
 'assignment save persists public and private cases together');
select is((select jsonb_array_length(cases) from public.assignment_practice_drafts),2,'instructor review retains both cases');
select is((select jsonb_array_length(cases) from public.assignment_practice_sets),1,'assignment save immediately projects only public cases');
select is((select cases->0->>'stdin' from public.assignment_practice_sets),E' 2 3\n','literal whitespace preserved');
select throws_ok($$select public.save_course_assignment(
 'b4000000-0000-4000-8000-000000000001','b2000000-0000-4000-8000-000000000001',0,
 'Cases','Synthetic','[{"id":"b5000000-0000-4000-8000-000000000001","title":"Correctness","description":"Synthetic","maxScore":10}]',
 'published','python',null,false,null,false,'[]')$$,'40001','assignment_version_conflict','stale assignment save cannot replace cases');
select set_config('request.jwt.claim.sub','b1000000-0000-4000-8000-000000000002',true);
select is((select count(*)::integer from public.assignment_practice_drafts),0,'students cannot read instructor cases directly');
select is((select jsonb_array_length(cases) from public.assignment_practice_sets),1,'students receive only public cases');
select throws_ok($$select pg_temp.save_cases('b2000000-0000-4000-8000-000000000001','[]')$$,'42501','course_staff_required','student cannot replace cases');
select throws_ok($$update public.assignment_practice_sets set cases='[]'$$,'42501',null,'direct public writes denied');
select throws_ok($$insert into public.assignment_practice_drafts(assignment_id,cases,version) values ('b2000000-0000-4000-8000-000000000001','[]',1)$$,'42501',null,'direct instructor-case writes denied');
select set_config('request.jwt.claim.sub','b1000000-0000-4000-8000-000000000003',true);
select is((select count(*)::integer from public.assignment_practice_drafts),0,'unrelated instructor cannot read cases');
select is((select count(*)::integer from public.assignment_practice_sets),0,'unrelated instructor cannot read public projections');
select throws_ok($$select pg_temp.save_cases('b2000000-0000-4000-8000-000000000001','[]')$$,'42501','course_staff_required','unrelated instructor cannot replace cases');
select set_config('request.jwt.claim.sub','b1000000-0000-4000-8000-000000000001',true);
select lives_ok($$select pg_temp.save_cases('b2000000-0000-4000-8000-000000000001',
 '[{"id":"b3000000-0000-4000-8000-000000000001","name":"Hidden","stdin":"","expected_stdout":"","is_public":false}]')$$,'marking every case private is supported');
select is((select jsonb_array_length(cases) from public.assignment_practice_sets),0,'making cases private clears student projection immediately');
select is((select jsonb_array_length(cases) from public.assignment_practice_drafts),1,'private case remains available for instructor review');
select lives_ok($$select pg_temp.save_cases('b2000000-0000-4000-8000-000000000001','[]')$$,'all cases may be removed through assignment saving');
select is((select jsonb_array_length(cases) from public.assignment_practice_drafts),0,'removed cases no longer available to instructors');
select is((select jsonb_array_length(cases) from public.assignment_practice_sets),0,'removed cases no longer available to students');
select lives_ok($$select pg_temp.save_cases('b2000000-0000-4000-8000-000000000002',
 '[{"id":"b3000000-0000-4000-8000-000000000001","name":"Draft assignment case","stdin":"","expected_stdout":""}]','draft')$$,'draft assignment cases can be saved');
select set_config('request.jwt.claim.sub','b1000000-0000-4000-8000-000000000002',true);
select is((select count(*)::integer from public.assignment_practice_sets),1,'student cannot read cases of draft assignment');
reset role;
select ok(public.valid_practice_cases(jsonb_build_array(jsonb_build_object('id','b3000000-0000-4000-8000-000000000001','name',repeat('😀',120),'stdin',repeat('é',2048),'expected_stdout',repeat('😀',2048)))),'exact Unicode character and byte limits accepted');
select ok(not public.valid_practice_cases(jsonb_build_array(jsonb_build_object('id','b3000000-0000-4000-8000-000000000001','name',repeat('😀',121),'stdin','','expected_stdout',''))),'overlong Unicode name rejected');
select ok(not public.valid_practice_cases(jsonb_build_array(jsonb_build_object('id','b3000000-0000-4000-8000-000000000001','name','Large output','stdin','','expected_stdout',repeat('😀',2048)||'a'))),'UTF8 output overflow rejected');
select ok(not public.valid_practice_cases('[{"id":"b3000000-0000-4000-8000-000000000001","name":"Bad","stdin":"","expected_stdout":"","grade":100}]'),'unknown case fields rejected');
select * from finish();
rollback;