begin;
select plan(7);

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('93000000-0000-4000-8000-000000000011', 'authenticated', 'authenticated', 'search-admin@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Search Admin"}', now(), now()),
  ('93000000-0000-4000-8000-000000000012', 'authenticated', 'authenticated', 'search-student@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Alice Student"}', now(), now()),
  ('93000000-0000-4000-8000-000000000013', 'authenticated', 'authenticated', 'search-instructor@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Bob Instructor"}', now(), now());

update public.user_roles set role = 'admin' where user_id = '93000000-0000-4000-8000-000000000011';
update public.user_roles set role = 'student' where user_id = '93000000-0000-4000-8000-000000000012';
update public.user_roles set role = 'instructor' where user_id = '93000000-0000-4000-8000-000000000013';

select ok(has_function_privilege('authenticated', 'public.admin_list_users(uuid,integer,text,text)', 'EXECUTE'), 'authenticated can call 4-arg admin_list_users');
select ok(not has_function_privilege('anon', 'public.admin_list_users(uuid,integer,text,text)', 'EXECUTE'), 'anon cannot call 4-arg admin_list_users');

set local role authenticated;
select set_config('request.jwt.claim.sub', '93000000-0000-4000-8000-000000000011', true);

-- Search by email
select is((
  select count(*)::integer from public.admin_list_users(null, 100, 'alice', null)
  where user_id = '93000000-0000-4000-8000-000000000012'
), 1, 'admin_list_users filters by search substring on display name or email');

-- Filter by role
select is((
  select count(*)::integer from public.admin_list_users(null, 100, null, 'instructor')
  where user_id in ('93000000-0000-4000-8000-000000000011', '93000000-0000-4000-8000-000000000012', '93000000-0000-4000-8000-000000000013')
), 1, 'admin_list_users filters by role instructor');

select is((
  select count(*)::integer from public.admin_list_users(null, 100, null, 'student')
  where user_id in ('93000000-0000-4000-8000-000000000011', '93000000-0000-4000-8000-000000000012', '93000000-0000-4000-8000-000000000013')
), 1, 'admin_list_users filters by role student');

-- Invalid role raises error
select throws_ok(
  $$select * from public.admin_list_users(null, 50, null, 'invalid')$$,
  '22023',
  'invalid_role',
  'invalid role throws 22023'
);

-- Search and role combined
select is((
  select count(*)::integer from public.admin_list_users(null, 100, 'search-student', 'student')
  where user_id = '93000000-0000-4000-8000-000000000012'
), 1, 'admin_list_users matches when both search and role match');

select * from finish();
rollback;
