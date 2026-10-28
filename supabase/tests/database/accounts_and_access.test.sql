begin;

select plan(9);

insert into auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) values
  (
    '10000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'student-one@example.test',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Student One","role":"instructor"}',
    now(),
    now()
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'student-two@example.test',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Student Two"}',
    now(),
    now()
  );

select is(
  (select role from public.user_roles where user_id = '10000000-0000-4000-8000-000000000001'),
  'student',
  'signup ignores a forged instructor role'
);

select is(
  (select display_name from public.profiles where id = '10000000-0000-4000-8000-000000000001'),
  'Student One',
  'signup copies only the display name into the profile'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);

select is((select count(*)::integer from public.profiles), 1, 'a student can see only their own profile');
select is((select count(*)::integer from public.user_roles), 1, 'a student can see only their own role');
select is(has_column_privilege('authenticated', 'public.profiles', 'display_name', 'UPDATE'), true, 'a student can update their display name');
select is(has_column_privilege('authenticated', 'public.profiles', 'created_at', 'UPDATE'), false, 'a student cannot update profile metadata');
select is(has_table_privilege('authenticated', 'public.user_roles', 'INSERT'), false, 'a student cannot assign roles');
select is(has_table_privilege('authenticated', 'public.user_roles', 'UPDATE'), false, 'a student cannot change roles');

update public.profiles set display_name = 'Updated Name' where id = auth.uid();
select is((select display_name from public.profiles where id = auth.uid()), 'Updated Name', 'a student can update their own display name');

select * from finish();
rollback;
