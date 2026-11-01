begin;
select plan(11);
insert into auth.users(id,email,raw_user_meta_data) values
('f0380000-0000-4000-8000-000000000001','profile-a@example.test','{"display_name":"Student A"}'),
('f0380000-0000-4000-8000-000000000002','profile-b@example.test','{"display_name":"Student B"}'),
('f0380000-0000-4000-8000-000000000003','profile-teacher@example.test','{"display_name":"Teacher"}');
update public.user_roles set role='instructor' where user_id='f0380000-0000-4000-8000-000000000003';
set local role authenticated;
select set_config('request.jwt.claim.sub','f0380000-0000-4000-8000-000000000001',true);
select is((select count(*)::int from public.profiles),1,'student reads only own profile');
select lives_ok($$update public.profiles set display_name='<b>New username</b>' where id=auth.uid()$$,'own username updates as literal text');
select is((select display_name from public.profiles where id=auth.uid()),'<b>New username</b>','name persisted');
update public.profiles set display_name='FORGED' where id='f0380000-0000-4000-8000-000000000002';
select is((select role from public.user_roles where user_id=auth.uid()),'student','name change does not promote role');
select throws_ok($$update public.profiles set display_name=repeat('x',81) where id=auth.uid()$$,'23514',null,'database name limit holds');
select is(has_column_privilege('authenticated','public.profiles','id','UPDATE'),false,'cannot change profile owner');
select is(has_column_privilege('authenticated','public.profiles','created_at','UPDATE'),false,'cannot change profile metadata');
select set_config('request.jwt.claim.sub','f0380000-0000-4000-8000-000000000002',true);
select is((select display_name from public.profiles where id=auth.uid()),'Student B','peer profile remained unchanged');
select set_config('request.jwt.claim.sub','f0380000-0000-4000-8000-000000000003',true);
select lives_ok($$update public.profiles set display_name='Updated Teacher' where id=auth.uid()$$,'instructor updates own name');
select is((select count(*)::int from public.profiles),1,'instructor cannot read student profiles');
select is((select role from public.user_roles where user_id=auth.uid()),'instructor','instructor role preserved');
select * from finish();
rollback;
