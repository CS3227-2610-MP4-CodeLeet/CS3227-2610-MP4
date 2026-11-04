begin;
select no_plan();
with function_source as (
  select lower(pg_get_functiondef('forum_private.create_post(uuid,uuid,text,text,uuid)'::regprocedure)) as source
)
select ok(position('for share' in source)>0
  and position('can_use_feature' in substring(source from position('for share' in source)))>0,
  'forum writer holds the course share lock while rechecking feature access') from function_source;
select has_table('public', 'forum_threads', 'threads persist');
select has_table('public', 'forum_replies', 'replies persist');
insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data) values
('f0300000-0000-4000-8000-000000000001','forum-student@example.test',now(),'{"display_name":"Forum Student","role":"instructor"}'),
('f0300000-0000-4000-8000-000000000002','forum-teacher@example.test',now(),'{"display_name":"Forum Teacher"}'),
('f0300000-0000-4000-8000-000000000003','forum-unprovisioned@example.test',now(),'{}');
update public.user_roles set role='instructor' where user_id='f0300000-0000-4000-8000-000000000002';
delete from public.user_roles where user_id='f0300000-0000-4000-8000-000000000003';
insert into public.courses(id,owner_id,created_by,title,description) values('f0400000-0000-4000-8000-000000000001','f0300000-0000-4000-8000-000000000002','f0300000-0000-4000-8000-000000000002','Forum tests','Synthetic active test course');
insert into public.course_memberships(course_id,user_id,role) values('f0400000-0000-4000-8000-000000000001','f0300000-0000-4000-8000-000000000001','student'),('f0400000-0000-4000-8000-000000000001','f0300000-0000-4000-8000-000000000002','instructor');
insert into public.course_features(course_id,feature,enabled) values('f0400000-0000-4000-8000-000000000001','discussions',true);
insert into public.courses(id,owner_id,created_by,title,description) values('f0400000-0000-4000-8000-000000000002','f0300000-0000-4000-8000-000000000002','f0300000-0000-4000-8000-000000000002','Other forum tests','Synthetic isolated course');
insert into public.courses(id,owner_id,created_by,title,description) values('f0400000-0000-4000-8000-000000000003','f0300000-0000-4000-8000-000000000002','f0300000-0000-4000-8000-000000000002','Student course','Synthetic isolated course');
insert into public.course_memberships(course_id,user_id,role) values('f0400000-0000-4000-8000-000000000002','f0300000-0000-4000-8000-000000000002','instructor'),('f0400000-0000-4000-8000-000000000003','f0300000-0000-4000-8000-000000000002','instructor'),('f0400000-0000-4000-8000-000000000003','f0300000-0000-4000-8000-000000000003','student');
insert into public.course_features(course_id,feature,enabled) values('f0400000-0000-4000-8000-000000000002','discussions',true),('f0400000-0000-4000-8000-000000000003','discussions',true);
insert into public.forum_threads(id,course_id,author_id,author_name,author_role,title,body,request_id)
values('f0500000-0000-4000-8000-000000000001','f0400000-0000-4000-8000-000000000003','f0300000-0000-4000-8000-000000000002','Forum Teacher','instructor','Other course thread','Synthetic','f0300000-0000-4000-8000-000000000030');
update public.course_features set enabled=false where course_id='f0400000-0000-4000-8000-000000000003' and feature='discussions';
set local role authenticated;
select set_config('request.jwt.claim.sub','f0300000-0000-4000-8000-000000000001',true);
select lives_ok($$select public.create_forum_post('f0400000-0000-4000-8000-000000000001',null,'Thread','<script>plain text</script>','f0300000-0000-4000-8000-000000000010')$$,'student posts');
select throws_ok($$select public.create_forum_post('f0400000-0000-4000-8000-000000000003',null,'Cross course','Denied',gen_random_uuid())$$,'42501','forum_member_required','student cannot post into another course');
select is((select count(*)::int from public.forum_threads where course_id='f0400000-0000-4000-8000-000000000003'),0,'direct forum reads cannot cross course membership');
select is((select author_role from public.forum_threads where title='Thread'),'student','ignores forged signup role');
select is((select author_name from public.forum_threads where title='Thread'),'Forum Student','trusted profile snapshot');
select is((select body from public.forum_threads where title='Thread'),'<script>plain text</script>','stores plain text');
select lives_ok($$select public.create_forum_post('f0400000-0000-4000-8000-000000000001',null,'Thread','<script>plain text</script>','f0300000-0000-4000-8000-000000000010')$$,'retry succeeds');
select is((select count(*)::int from public.forum_threads where title='Thread'),1,'retry creates no duplicate');
select throws_ok($$select public.create_forum_post('f0400000-0000-4000-8000-000000000001',null,'Changed','Body','f0300000-0000-4000-8000-000000000010')$$,'23505','forum_retry_conflict','changed retry rejected');
select throws_ok($$select public.create_forum_post('f0400000-0000-4000-8000-000000000001',null,' ','Body',gen_random_uuid())$$,'22023','invalid_forum_post','blank title rejected');
select throws_ok($$select public.create_forum_post('f0400000-0000-4000-8000-000000000001',null,'Title',repeat('x',8001),gen_random_uuid())$$,'22023','invalid_forum_post','body limit');
select throws_ok($$select public.create_forum_post('f0400000-0000-4000-8000-000000000001',null,repeat('x',161),'Body',gen_random_uuid())$$,'22023','invalid_forum_post','title limit');
select throws_ok($$select public.create_forum_post('f0400000-0000-4000-8000-000000000001',null,'Title',E'\n\t',gen_random_uuid())$$,'22023','invalid_forum_post','whitespace body rejected');
select throws_ok($$select public.create_forum_post('f0400000-0000-4000-8000-000000000001','f0300000-0000-4000-8000-000000000999',null,'Reply',gen_random_uuid())$$,'P0002','thread_unavailable','missing thread');
select is(has_table_privilege('authenticated','public.forum_threads','INSERT'),false,'no direct thread inserts');
select is(has_table_privilege('authenticated','public.forum_replies','INSERT'),false,'no direct reply inserts');
select is(has_table_privilege('authenticated','public.forum_threads','UPDATE'),false,'no thread edits');
select is(has_table_privilege('authenticated','public.forum_replies','DELETE'),false,'no reply deletes');
select is(has_column_privilege('authenticated','public.forum_threads','author_id','SELECT'),false,'author identity column not exposed');
select set_config('request.jwt.claim.sub','f0300000-0000-4000-8000-000000000002',true);
select lives_ok($$select public.create_forum_post('f0400000-0000-4000-8000-000000000001',(select id from public.forum_threads where title='Thread'),null,'Instructor reply',gen_random_uuid())$$,'instructor replies across roles');
select is((select author_role from public.forum_replies where body='Instructor reply'),'instructor','trusted instructor label');
select set_config('request.jwt.claim.sub','f0300000-0000-4000-8000-000000000001',true);
select lives_ok($$select public.create_forum_post('f0400000-0000-4000-8000-000000000001',(select id from public.forum_threads where title='Thread'),null,'Student reply','f0300000-0000-4000-8000-000000000011')$$,'student replies');
select lives_ok($$select public.create_forum_post('f0400000-0000-4000-8000-000000000001',(select id from public.forum_threads where title='Thread'),null,'Student reply','f0300000-0000-4000-8000-000000000011')$$,'reply retry succeeds');
select is((select count(*)::int from public.forum_replies where body='Student reply'),1,'reply retry does not duplicate');
select throws_ok($$select public.create_forum_post('f0400000-0000-4000-8000-000000000001',(select id from public.forum_threads where title='Thread'),null,'Wrong kind','f0300000-0000-4000-8000-000000000010')$$,'23505','forum_retry_conflict','thread request ID cannot create a reply');
select throws_ok($$select public.create_forum_post('f0400000-0000-4000-8000-000000000001',null,'Wrong kind','Student reply','f0300000-0000-4000-8000-000000000011')$$,'23505','forum_retry_conflict','reply request ID cannot create a thread');
do $quota$ begin
  for n in 1..8 loop perform public.create_forum_post('f0400000-0000-4000-8000-000000000001',null,'Quota '||n,'Body',gen_random_uuid()); end loop;
end; $quota$;
select throws_ok($$select public.create_forum_post('f0400000-0000-4000-8000-000000000001',null,'Over quota','Body',gen_random_uuid())$$,'P0001','forum_rate_limited','combined posting quota enforced');
select lives_ok($$select public.create_forum_post('f0400000-0000-4000-8000-000000000001',null,'Thread','<script>plain text</script>','f0300000-0000-4000-8000-000000000010')$$,'identical retry bypasses exhausted quota');
select set_config('request.jwt.claim.sub','f0300000-0000-4000-8000-000000000003',true);
select is((select count(*)::int from public.forum_threads),0,'disabled course discussions are hidden');
select throws_ok($$select public.create_forum_post('f0400000-0000-4000-8000-000000000001',null,'Title','Body',gen_random_uuid())$$,'42501','forum_member_required','unprovisioned cannot post');
set local role anon;
select is(has_function_privilege('anon','public.create_forum_post(uuid,uuid,text,text,uuid)','EXECUTE'),false,'anonymous RPC denied');
select is(has_function_privilege('authenticated','public.create_forum_post(uuid,text,text,uuid)','EXECUTE'),false,'context-free forum RPC is disabled');
select * from finish();
rollback;
