begin;
select no_plan();
insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
 ('e1000000-0000-4000-8000-000000000001','authenticated','authenticated','activity-owner@example.test','',now(),'{}','{}',now(),now()),
 ('e1000000-0000-4000-8000-000000000002','authenticated','authenticated','activity-student@example.test','',now(),'{}','{}',now(),now()),
 ('e1000000-0000-4000-8000-000000000003','authenticated','authenticated','activity-peer@example.test','',now(),'{}','{}',now(),now()),
 ('e1000000-0000-4000-8000-000000000004','authenticated','authenticated','activity-outsider@example.test','',now(),'{}','{}',now(),now());
update public.user_roles set role='instructor' where user_id='e1000000-0000-4000-8000-000000000001';
insert into public.courses(id,owner_id,created_by,title,description) values
 ('e2000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001','Activity one',''),
 ('e2000000-0000-4000-8000-000000000002','e1000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001','Activity two',''),
 ('e2000000-0000-4000-8000-000000000003','e1000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001','Activity three','');
insert into public.course_memberships(course_id,user_id,role) values
 ('e2000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001','instructor'),
 ('e2000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000002','student'),
 ('e2000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000003','student'),
 ('e2000000-0000-4000-8000-000000000002','e1000000-0000-4000-8000-000000000001','instructor'),
 ('e2000000-0000-4000-8000-000000000002','e1000000-0000-4000-8000-000000000002','student'),
 ('e2000000-0000-4000-8000-000000000003','e1000000-0000-4000-8000-000000000001','instructor');
insert into public.course_features(course_id,feature,enabled)
select c.id,f.feature,true from public.courses c cross join (values('assessments'),('xp'),('leaderboard'),('discussions')) f(feature)
where c.id in ('e2000000-0000-4000-8000-000000000001','e2000000-0000-4000-8000-000000000002','e2000000-0000-4000-8000-000000000003');
insert into public.assignments(id,instructor_id,title,instructions,publication_status,course_id) values
 ('e3000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001','One','Synthetic','published','e2000000-0000-4000-8000-000000000001'),
 ('e3000000-0000-4000-8000-000000000002','e1000000-0000-4000-8000-000000000001','Two','Synthetic','published','e2000000-0000-4000-8000-000000000002');
insert into public.xp_awards(student_id,assignment_id,amount) values
 ('e1000000-0000-4000-8000-000000000002','e3000000-0000-4000-8000-000000000001',10),
 ('e1000000-0000-4000-8000-000000000003','e3000000-0000-4000-8000-000000000001',5),
 ('e1000000-0000-4000-8000-000000000002','e3000000-0000-4000-8000-000000000002',20);
insert into public.forum_threads(id,course_id,author_id,author_name,author_role,title,body,request_id) values
 ('e4000000-0000-4000-8000-000000000001','e2000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001','Owner','instructor','Visible','Synthetic','e5000000-0000-4000-8000-000000000001'),
 ('e4000000-0000-4000-8000-000000000002','e2000000-0000-4000-8000-000000000002','e1000000-0000-4000-8000-000000000001','Owner','instructor','Other course','Synthetic','e5000000-0000-4000-8000-000000000002'),
 ('e4000000-0000-4000-8000-000000000003','e2000000-0000-4000-8000-000000000003','e1000000-0000-4000-8000-000000000001','Owner','instructor','No membership','Synthetic','e5000000-0000-4000-8000-000000000003');

set local role authenticated;
select set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000002',true);
select is((select count(*)::int from public.xp_awards),2,'student sees own awards from enrolled courses');
select is(public.get_my_xp('e2000000-0000-4000-8000-000000000001',1)->>'total_xp','10','My XP total is scoped to selected course');
select is(public.get_my_xp('e2000000-0000-4000-8000-000000000002',1)->>'total_xp','20','student can select another enrolled course independently');
select is(jsonb_array_length(public.get_leaderboard('e2000000-0000-4000-8000-000000000001',1)->'rows'),2,'leaderboard rows are scoped to selected course');
select is(public.get_leaderboard('e2000000-0000-4000-8000-000000000001',1)->'own'->>'total_xp','10','selected leaderboard own total excludes other course XP');
select is(jsonb_array_length(public.get_leaderboard('e2000000-0000-4000-8000-000000000002',1)->'rows'),1,'second course leaderboard has its own roster');
select is((select count(*)::int from public.forum_threads where course_id='e2000000-0000-4000-8000-000000000003'),0,'forum RLS hides discussions from courses without membership');
reset role;
update public.course_features set enabled=false where course_id='e2000000-0000-4000-8000-000000000001' and feature in ('xp','leaderboard','discussions');
set local role authenticated;
select set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000002',true);
select throws_ok($$select public.get_my_xp('e2000000-0000-4000-8000-000000000001',1)$$,'42501','course_feature_unavailable','disabled XP operation is denied');
select throws_ok($$select public.get_leaderboard('e2000000-0000-4000-8000-000000000001',1)$$,'42501','course_feature_unavailable','disabled leaderboard operation is denied');
select is((select count(*)::int from public.forum_threads where course_id='e2000000-0000-4000-8000-000000000001'),0,'disabled discussions are hidden through Data API RLS');
select set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000004',true);
select throws_ok($$select public.get_my_xp('e2000000-0000-4000-8000-000000000001',1)$$,'42501','course_member_required','nonmember cannot read course XP');
select throws_ok($$select public.get_leaderboard('e2000000-0000-4000-8000-000000000001',1)$$,'42501','course_member_required','nonmember cannot read course ranking');
reset role;
update auth.users set email_confirmed_at=null where id='e1000000-0000-4000-8000-000000000002';
set local role authenticated;
select set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000002',true);
select throws_ok($$select public.get_my_xp('e2000000-0000-4000-8000-000000000002',1)$$,'42501','course_member_required','unverified member cannot read XP directly');
select is((select count(*)::int from public.forum_threads where course_id='e2000000-0000-4000-8000-000000000001'),0,'unverified member cannot read forum history directly');
reset role;
delete from public.user_roles where user_id='e1000000-0000-4000-8000-000000000002';
set local role authenticated;
select set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000002',true);
select throws_ok($$select public.get_my_xp('e2000000-0000-4000-8000-000000000002',1)$$,'42501','course_member_required','deprovisioned member cannot read XP directly');
select is((select count(*)::int from public.forum_threads where course_id='e2000000-0000-4000-8000-000000000001'),0,'deprovisioned member cannot read forum history directly');
reset role;
select is((select count(*)::int from public.forum_threads where course_id='e2000000-0000-4000-8000-000000000001'),1,'disabling discussions preserves the original thread');
select is((select count(*)::int from public.xp_awards where assignment_id='e3000000-0000-4000-8000-000000000001'),2,'disabling XP preserves course awards');
select is((select count(*)::int from public.xp_awards where assignment_id='e3000000-0000-4000-8000-000000000002'),1,'disabling XP in one course preserves another course awards');
select * from finish();
rollback;
