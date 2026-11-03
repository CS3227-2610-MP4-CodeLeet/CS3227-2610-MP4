begin;
select no_plan();
select has_column('public','assignments','max_xp','assignment XP configuration exists');
insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
 ('c1000000-0000-4000-8000-000000000001','authenticated','authenticated','xp-owner@example.test','',now(),'{}','{}',now(),now()),
 ('c1000000-0000-4000-8000-000000000002','authenticated','authenticated','xp-student@example.test','',now(),'{}','{}',now(),now()),
 ('c1000000-0000-4000-8000-000000000003','authenticated','authenticated','xp-peer@example.test','',now(),'{}','{}',now(),now());
update public.user_roles set role='instructor' where user_id='c1000000-0000-4000-8000-000000000001';
insert into public.courses(id,owner_id,created_by,title,description) values ('cc000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000001','Scoped fixture','');
insert into public.course_memberships(course_id,user_id,role) values ('cc000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000001','instructor');
insert into public.course_memberships(course_id,user_id,role) values ('cc000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000002','student');
insert into public.course_memberships(course_id,user_id,role) values ('cc000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000003','student');
insert into public.course_features(course_id,feature,enabled) select 'cc000000-0000-4000-8000-000000000001',feature,true from unnest(array['assessments','ai','discussions','xp','leaderboard']) feature;
insert into public.assignments (id,instructor_id,title,instructions,language,publication_status,max_xp,course_id) values ('c2000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000001','XP example','Synthetic','python','published',100,'cc000000-0000-4000-8000-000000000001'::uuid);
insert into public.assignment_rubrics(assignment_id,criteria) values ('c2000000-0000-4000-8000-000000000001','[{"id":"c5000000-0000-4000-8000-000000000001","title":"Correctness","description":"Synthetic","maxScore":10}]');
insert into public.submissions(id,assignment_id,student_id,source,revision,request_id) values
 ('c4000000-0000-4000-8000-000000000001','c2000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000002','print(1)',1,'c3000000-0000-4000-8000-000000000001'),
 ('c4000000-0000-4000-8000-000000000002','c2000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000002','print(2)',2,'c3000000-0000-4000-8000-000000000002');
-- Legacy publications have no invented historical rubric maximum.
insert into public.grades(submission_id,instructor_id,scores,feedback,total_score,published_at) values
 ('c4000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000001','{"c5000000-0000-4000-8000-000000000001":8}','Legacy',8,now());
set local role authenticated;
select set_config('request.jwt.claim.sub','c1000000-0000-4000-8000-000000000002',true);
select is(public.get_my_xp('cc000000-0000-4000-8000-000000000001',1)->>'total_xp','0','legacy publication does not invent an XP basis');
select throws_ok($$update public.assignments set max_xp=100000$$,'42501',null,'student cannot configure XP');
select throws_ok($$insert into public.xp_awards(student_id,assignment_id,amount) values('c1000000-0000-4000-8000-000000000002','c2000000-0000-4000-8000-000000000001',100)$$,'42501',null,'student cannot forge awards');
select throws_ok($$select * from xp_private.grade_basis$$,'42501',null,'publication score basis stays private');
select set_config('request.jwt.claim.sub','c1000000-0000-4000-8000-000000000001',true);
select lives_ok($$select public.save_grade('c4000000-0000-4000-8000-000000000001','{"c5000000-0000-4000-8000-000000000001":8}','Reviewed',8,true,1)$$,'legacy review and republish creates trusted basis');
reset role;
select is((select amount from public.xp_awards where student_id='c1000000-0000-4000-8000-000000000002'),80,'8/10 on 100 XP awards 80');
set local role authenticated;
select set_config('request.jwt.claim.sub','c1000000-0000-4000-8000-000000000001',true);
select lives_ok($$select public.save_grade('c4000000-0000-4000-8000-000000000001','{"c5000000-0000-4000-8000-000000000001":8}','Same',8,true,2)$$,'same amount can be republished');
reset role;
select is((select count(*)::integer from public.xp_ledger where student_id='c1000000-0000-4000-8000-000000000002'),1,'same resulting award creates no duplicate delta');
set local role authenticated;
select set_config('request.jwt.claim.sub','c1000000-0000-4000-8000-000000000001',true);
select lives_ok($$select public.save_grade('c4000000-0000-4000-8000-000000000002','{"c5000000-0000-4000-8000-000000000001":9}','Better',9,true,0)$$,'second revision can publish');
reset role;
select is((select amount from public.xp_awards where assignment_id='c2000000-0000-4000-8000-000000000001'),90,'only best revision counts, not 170');
set local role authenticated;
select set_config('request.jwt.claim.sub','c1000000-0000-4000-8000-000000000001',true);
select lives_ok($$select public.save_grade('c4000000-0000-4000-8000-000000000002','{"c5000000-0000-4000-8000-000000000001":2}','Correction',2,true,1)$$,'grade correction succeeds');
reset role;
select is((select amount from public.xp_awards where assignment_id='c2000000-0000-4000-8000-000000000001'),80,'lower correction falls back to remaining best publication');
update public.assignments set max_xp=201 where id='c2000000-0000-4000-8000-000000000001';
select is((select amount from public.xp_awards where assignment_id='c2000000-0000-4000-8000-000000000001'),160,'maximum edit recomputes and floors existing awards');
-- Rubric changes do not reinterpret the captured publication basis.
update public.assignment_rubrics set criteria='[{"id":"c5000000-0000-4000-8000-000000000001","title":"Correctness","description":"Synthetic","maxScore":20}]' where assignment_id='c2000000-0000-4000-8000-000000000001';
update public.assignments set max_xp=100 where id='c2000000-0000-4000-8000-000000000001';
select is((select amount from public.xp_awards where assignment_id='c2000000-0000-4000-8000-000000000001'),80,'later rubric edits preserve the old published denominator');
set local role authenticated;
select set_config('request.jwt.claim.sub','c1000000-0000-4000-8000-000000000001',true);
select lives_ok($$select public.save_grade('c4000000-0000-4000-8000-000000000001','{"c5000000-0000-4000-8000-000000000001":8}','Withdraw',8,false,3)$$,'best publication can be withdrawn');
reset role;
select is((select amount from public.xp_awards where assignment_id='c2000000-0000-4000-8000-000000000001'),20,'withdrawal uses the remaining 2/10 publication');
set local role authenticated;
select set_config('request.jwt.claim.sub','c1000000-0000-4000-8000-000000000001',true);
select lives_ok($$select public.save_grade('c4000000-0000-4000-8000-000000000002','{"c5000000-0000-4000-8000-000000000001":2}','Withdraw',2,false,2)$$,'last publication can be withdrawn');
reset role;
select is((select amount from public.xp_awards where assignment_id='c2000000-0000-4000-8000-000000000001'),0,'no published grades means zero XP');
select is((select sum(delta)::integer from public.xp_ledger where student_id='c1000000-0000-4000-8000-000000000002'),0,'audit deltas reconcile to the current award');
create function pg_temp.fail_xp_ledger() returns trigger language plpgsql as $$begin if new.student_id='c1000000-0000-4000-8000-000000000002' then raise exception 'synthetic_xp_failure'; end if; return new; end$$;
create trigger fail_xp_test before insert on public.xp_ledger for each row execute function pg_temp.fail_xp_ledger();
set local role authenticated;
select set_config('request.jwt.claim.sub','c1000000-0000-4000-8000-000000000001',true);
select throws_ok($$select public.save_grade('c4000000-0000-4000-8000-000000000001','{"c5000000-0000-4000-8000-000000000001":6.67}','Rollback',6.67,true,4)$$,'P0001','synthetic_xp_failure','ledger failure rolls back publication');
reset role;
select is((select version from public.grades where submission_id='c4000000-0000-4000-8000-000000000001'),4,'failed publication preserves grade version');
select ok((select published_at is null from public.grades where submission_id='c4000000-0000-4000-8000-000000000001'),'failed publication preserves draft state');
select is((select amount from public.xp_awards where assignment_id='c2000000-0000-4000-8000-000000000001'),0,'failed publication preserves award');
drop trigger fail_xp_test on public.xp_ledger;
set local role authenticated;
select set_config('request.jwt.claim.sub','c1000000-0000-4000-8000-000000000001',true);
select lives_ok($$select public.save_grade('c4000000-0000-4000-8000-000000000001','{"c5000000-0000-4000-8000-000000000001":6.67}','Fraction',6.67,true,4)$$,'fractional earned score can publish');
select throws_ok($$select xp_private.save_grade_core('c4000000-0000-4000-8000-000000000001','{}','Bypass',20,true,5)$$,'42501',null,'even owner cannot bypass XP wrapper');
select throws_ok($$select public.get_my_xp('cc000000-0000-4000-8000-000000000001',1)$$,'42501','course_member_required','instructor cannot invoke student total endpoint');
reset role;
select is((select amount from public.xp_awards where assignment_id='c2000000-0000-4000-8000-000000000001'),33,'fractional result floors rather than rounds');
update public.assignments set max_xp=0 where id='c2000000-0000-4000-8000-000000000001';
select is((select amount from public.xp_awards where assignment_id='c2000000-0000-4000-8000-000000000001'),0,'zero maximum removes existing XP');
update public.assignments set max_xp=100000 where id='c2000000-0000-4000-8000-000000000001';
select is((select amount from public.xp_awards where assignment_id='c2000000-0000-4000-8000-000000000001'),33350,'maximum cap uses exact numeric arithmetic');
select throws_ok($$update public.assignments set max_xp=100001 where id='c2000000-0000-4000-8000-000000000001'$$,'23514',null,'database enforces XP cap');
update public.assignments set due_at='2999-01-01T00:00:00Z' where id='c2000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claim.sub','c1000000-0000-4000-8000-000000000001',true);
select is((public.save_assignment_with_xp('c2000000-0000-4000-8000-000000000001',1,'XP example','Synthetic',(select criteria from public.assignment_rubrics where assignment_id='c2000000-0000-4000-8000-000000000001'),'published','python',100)).due_at,'2999-01-01T00:00:00Z'::timestamptz,'XP-aware update preserves omitted deadline');
select is((public.save_assignment('c2000000-0000-4000-8000-000000000001',2,'XP example','Synthetic',(select criteria from public.assignment_rubrics where assignment_id='c2000000-0000-4000-8000-000000000001'),'published','python')).max_xp,100,'legacy assignment RPC preserves configured XP');
reset role;
select is((select amount from public.xp_awards where assignment_id='c2000000-0000-4000-8000-000000000001'),33,'owner XP-aware save recomputes the award');
update public.assignments set publication_status='draft' where id='c2000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claim.sub','c1000000-0000-4000-8000-000000000002',true);
select is((public.get_my_xp('cc000000-0000-4000-8000-000000000001',1)->'awards'->0->>'assignment_title'),null::text,'unpublished assignment title stays hidden in own awards');
select is(public.get_my_xp('cc000000-0000-4000-8000-000000000001',1)->>'total_xp','33','own earned XP remains after assignment becomes hidden');
select throws_ok($$update public.xp_ledger set delta=100$$,'42501',null,'ledger adjustments cannot be forged');
select throws_ok($$select actor_id from public.xp_ledger$$,'42501',null,'private actor identifiers are excluded from student projection');
select throws_ok($$select public.get_my_xp('cc000000-0000-4000-8000-000000000001',0)$$,'22023','invalid_page','total RPC bounds pagination');
reset role;
update public.assignments set publication_status='published' where id='c2000000-0000-4000-8000-000000000001';
-- Existing validators accept fractional maxima/totals beyond two decimal places.
insert into public.assignments (id,instructor_id,title,instructions,language,publication_status,max_xp,course_id) values ('c2000000-0000-4000-8000-000000000003','c1000000-0000-4000-8000-000000000001','Fraction A','Synthetic','python','published',100,'cc000000-0000-4000-8000-000000000001'::uuid),
 ('c2000000-0000-4000-8000-000000000004','c1000000-0000-4000-8000-000000000001','Fraction B','Synthetic','java','published',100,'cc000000-0000-4000-8000-000000000001'::uuid);
insert into public.assignment_rubrics(assignment_id,criteria) values
 ('c2000000-0000-4000-8000-000000000003','[{"id":"c5000000-0000-4000-8000-000000000001","title":"Fraction","description":"Synthetic","maxScore":1.234}]'),
 ('c2000000-0000-4000-8000-000000000004','[{"id":"c5000000-0000-4000-8000-000000000001","title":"Fraction","description":"Synthetic","maxScore":1.236}]');
insert into public.submissions(id,assignment_id,student_id,source,revision,request_id) values
 ('c4000000-0000-4000-8000-000000000003','c2000000-0000-4000-8000-000000000003','c1000000-0000-4000-8000-000000000002','print(3)',1,'c3000000-0000-4000-8000-000000000003'),
 ('c4000000-0000-4000-8000-000000000004','c2000000-0000-4000-8000-000000000004','c1000000-0000-4000-8000-000000000002','class Main {}',1,'c3000000-0000-4000-8000-000000000004');
set local role authenticated;
select set_config('request.jwt.claim.sub','c1000000-0000-4000-8000-000000000001',true);
select lives_ok($$select public.save_grade('c4000000-0000-4000-8000-000000000003','{"c5000000-0000-4000-8000-000000000001":1.234}','Exact',1.234,true,0)$$,'fractional full score remains publishable');
select lives_ok($$select public.save_grade('c4000000-0000-4000-8000-000000000004','{"c5000000-0000-4000-8000-000000000001":1.236}','Exact',1.236,true,0)$$,'rounding cannot abort a valid publication');
reset role;
select is((select amount from public.xp_awards where assignment_id='c2000000-0000-4000-8000-000000000003'),100,'1.234/1.234 earns full XP');
select is((select amount from public.xp_awards where assignment_id='c2000000-0000-4000-8000-000000000004'),100,'1.236/1.236 earns full XP');
-- Browser arithmetic totals must not override the exact validated criterion sum.
update public.assignment_rubrics set criteria='[{"id":"c5000000-0000-4000-8000-000000000001","title":"A","description":"Synthetic","maxScore":1.1},{"id":"c5000000-0000-4000-8000-000000000002","title":"B","description":"Synthetic","maxScore":2.2}]' where assignment_id='c2000000-0000-4000-8000-000000000003';
update public.assignment_rubrics set criteria='[{"id":"c5000000-0000-4000-8000-000000000001","title":"A","description":"Synthetic","maxScore":1.2},{"id":"c5000000-0000-4000-8000-000000000002","title":"B","description":"Synthetic","maxScore":2.4}]' where assignment_id='c2000000-0000-4000-8000-000000000004';
set local role authenticated;
select set_config('request.jwt.claim.sub','c1000000-0000-4000-8000-000000000001',true);
select lives_ok($$select public.save_grade('c4000000-0000-4000-8000-000000000003','{"c5000000-0000-4000-8000-000000000001":1.1,"c5000000-0000-4000-8000-000000000002":2.2}','Exact sum',3.3000000000000003,true,1)$$,'positive floating-point noise cannot abort publication');
select lives_ok($$select public.save_grade('c4000000-0000-4000-8000-000000000004','{"c5000000-0000-4000-8000-000000000001":1.2,"c5000000-0000-4000-8000-000000000002":2.4}','Exact sum',3.5999999999999996,true,1)$$,'negative floating-point noise remains publishable');
reset role;
select is((select amount from public.xp_awards where assignment_id='c2000000-0000-4000-8000-000000000003'),100,'positive floating-point noise still earns full XP');
select is((select amount from public.xp_awards where assignment_id='c2000000-0000-4000-8000-000000000004'),100,'negative floating-point noise still earns full XP');
select is((select total_score from public.grades where submission_id='c4000000-0000-4000-8000-000000000003'),3.3::numeric,'stored total uses the exact validated criterion sum');
update public.assignment_rubrics set criteria='[{"id":"c5000000-0000-4000-8000-000000000001","title":"A","description":"Synthetic","maxScore":1},{"id":"c5000000-0000-4000-8000-000000000002","title":"B","description":"Synthetic","maxScore":1}]' where assignment_id='c2000000-0000-4000-8000-000000000003';
set local role authenticated;
select set_config('request.jwt.claim.sub','c1000000-0000-4000-8000-000000000001',true);
select lives_ok($$select public.save_grade('c4000000-0000-4000-8000-000000000003','{"c5000000-0000-4000-8000-000000000001":0.1,"c5000000-0000-4000-8000-000000000002":0.7}','Partial exact sum',0.7999999999999999,true,2)$$,'partial scores tolerate browser addition noise');
reset role;
select is((select amount from public.xp_awards where assignment_id='c2000000-0000-4000-8000-000000000003'),40,'0.1 plus 0.7 of 2 earns exactly 40 XP');
select is((select total_score from public.grades where submission_id='c4000000-0000-4000-8000-000000000003'),0.8::numeric,'partial score total is canonical');
-- Legacy rubric validation allows duplicate IDs; never sum an unvalidated extra key.
update public.assignment_rubrics set criteria='[{"id":"c5000000-0000-4000-8000-000000000001","title":"A","description":"Synthetic","maxScore":10},{"id":"c5000000-0000-4000-8000-000000000001","title":"B","description":"Synthetic","maxScore":10}]' where assignment_id='c2000000-0000-4000-8000-000000000003';
set local role authenticated;
select set_config('request.jwt.claim.sub','c1000000-0000-4000-8000-000000000001',true);
select lives_ok($$select public.save_grade('c4000000-0000-4000-8000-000000000003','{"c5000000-0000-4000-8000-000000000001":1,"c5000000-0000-4000-8000-000000000002":19}','Legacy duplicate IDs',2,true,3)$$,'legacy duplicate rubric retains core validation semantics');
reset role;
select is((select amount from public.xp_awards where assignment_id='c2000000-0000-4000-8000-000000000003'),10,'unvalidated extra score cannot inflate XP');
select is((select total_score from public.grades where submission_id='c4000000-0000-4000-8000-000000000003'),2::numeric,'canonical total uses rubric-validated entries only');
set local role authenticated;
select set_config('request.jwt.claim.sub','c1000000-0000-4000-8000-000000000003',true);
select is(public.get_my_xp('cc000000-0000-4000-8000-000000000001',1)->>'total_xp','0','peer sees own total only');
select is((select count(*)::integer from public.xp_awards),0,'peer cannot read awards');
select is((select count(*)::integer from public.xp_ledger),0,'peer cannot read ledger');
select throws_ok($$select public.save_grade('c4000000-0000-4000-8000-000000000001','{}','Forge',10,true,4)$$,'42501','submission_not_owned','non-member cannot mutate grades or XP');
reset role;
select ok(not has_function_privilege('anon','public.get_my_xp(uuid,integer)','EXECUTE'),'anonymous total RPC denied');
select * from finish();
rollback;
