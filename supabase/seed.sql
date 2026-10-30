-- Local development fixtures, not a migration or hosted deployment input.
-- db:seed injects a generated password transaction-locally. Native start/reset
-- uses unguessable passwords until db:seed provides a usable local login.
begin;
select pg_advisory_xact_lock(3227, 27);

-- Never promote a pre-existing account that collides with a reserved seed ID/email.
do $seed$
begin
  if exists (
    select 1 from generate_series(1, 13) n
    join auth.users u on u.id = ('c0de0000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid
      or u.email = case when n <= 10 then 'student' || lpad(n::text, 2, '0')
        else 'instructor' || lpad((n - 10)::text, 2, '0') end || '@codeleet.example.test'
    where u.id <> ('c0de0000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid
      or u.email <> case when n <= 10 then 'student' || lpad(n::text, 2, '0')
        else 'instructor' || lpad((n - 10)::text, 2, '0') end || '@codeleet.example.test'
      or u.raw_app_meta_data ->> 'local_seed' is distinct from 'codeleet-v1'
  ) then
    raise exception 'local_seed_identity_conflict';
  end if;
end;
$seed$;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select '00000000-0000-0000-0000-000000000000'::uuid,
  ('c0de0000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  'authenticated', 'authenticated',
  case when n <= 10 then 'student' || lpad(n::text, 2, '0')
    else 'instructor' || lpad((n - 10)::text, 2, '0') end || '@codeleet.example.test',
  extensions.crypt(coalesce(nullif(current_setting('codeleet.seed_password', true), ''), gen_random_uuid()::text), extensions.gen_salt('bf')),
  now(), '{"provider":"email","providers":["email"],"local_seed":"codeleet-v1"}'::jsonb,
  jsonb_build_object('display_name', case when n <= 10 then 'Local Student ' || n else 'Local Instructor ' || (n - 10) end),
  now(), now(), '', '', '', ''
from generate_series(1, 13) n
on conflict (id) do update set encrypted_password = case
  when nullif(current_setting('codeleet.seed_password', true), '') is not null then excluded.encrypted_password
  else auth.users.encrypted_password end;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at)
select id, id, id::text, jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true), 'email', now(), now()
from auth.users where raw_app_meta_data ->> 'local_seed' = 'codeleet-v1'
on conflict (provider_id, provider) do nothing;

-- Signup trigger creates profiles and student roles. Only the trusted local seed
-- provisions the three instructor accounts; user metadata never grants roles.
insert into public.profiles (id, display_name)
select id, raw_user_meta_data ->> 'display_name' from auth.users
where raw_app_meta_data ->> 'local_seed' = 'codeleet-v1'
on conflict (id) do nothing;
insert into public.user_roles (user_id, role)
select id, 'student' from auth.users
where raw_app_meta_data ->> 'local_seed' = 'codeleet-v1'
on conflict (user_id) do nothing;
update public.user_roles set role = 'instructor'
where user_id in (
  'c0de0000-0000-4000-8000-000000000011',
  'c0de0000-0000-4000-8000-000000000012',
  'c0de0000-0000-4000-8000-000000000013'
);

insert into public.assignments (id, instructor_id, title, instructions, language, publication_status, created_at)
select ('c0de1000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  ('c0de0000-0000-4000-8000-' || lpad((11 + (n - 1) % 3)::text, 12, '0'))::uuid,
  '[Local seed] ' || case (n - 1) / 2
    when 0 then 'Sum two integers' when 1 then 'Find the maximum'
    when 2 then 'Even or odd' when 3 then 'Triangular number' else 'Square a number' end
    || case when n % 2 = 1 then ' (Python)' else ' (Java)' end,
  'Synthetic local development assignment. ' || case (n - 1) / 2
    when 0 then 'Read two integers and print their sum.'
    when 1 then 'Read two integers and print the larger value.'
    when 2 then 'Read one integer and print Even or Odd.'
    when 3 then 'Read a nonnegative integer n and print n * (n + 1) / 2 as an integer.'
    else 'Read one integer and print its square.' end
    || ' Use standard input and printed output. No external packages.',
  case when n % 2 = 1 then 'python' else 'java' end,
  case when n <= 8 then 'published' else 'draft' end,
  '2026-10-30T00:00:00Z'::timestamptz + n * interval '1 minute'
from generate_series(1, 10) n
on conflict (id) do nothing;

insert into public.assignment_rubrics (id, assignment_id, criteria)
select ('c0de1100-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  ('c0de1000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  jsonb_build_array(jsonb_build_object('id', 'c0de1200-0000-4000-8000-000000000001',
    'title', 'Correctness', 'description', 'Synthetic private rubric: inspect input handling and the printed result.', 'maxScore', 10))
from generate_series(1, 10) n
on conflict (assignment_id) do nothing;

insert into public.submissions (id, assignment_id, student_id, source, revision, request_id, created_at)
select ('c0de2000-0000-4000-8000-' || lpad((s * 1000 + a * 10 + r)::text, 12, '0'))::uuid,
  ('c0de1000-0000-4000-8000-' || lpad(a::text, 12, '0'))::uuid,
  ('c0de0000-0000-4000-8000-' || lpad(s::text, 12, '0'))::uuid,
  case when a % 2 = 1 then '# Synthetic revision ' || r || E'\n' || case (a - 1) / 2
    when 0 then E'a, b = map(int, input().split())\nprint(a + b)\n'
    when 1 then E'a, b = map(int, input().split())\nprint(max(a, b))\n'
    when 2 then E'n = int(input())\nprint("Even" if n % 2 == 0 else "Odd")\n'
    else E'n = int(input())\nprint(n * (n + 1) // 2)\n' end
  else '// Synthetic revision ' || r || E'\nimport java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner in = new Scanner(System.in);\n        '
    || case (a - 1) / 2
      when 0 then 'System.out.println(in.nextInt() + in.nextInt());'
      when 1 then 'System.out.println(Math.max(in.nextInt(), in.nextInt()));'
      when 2 then 'int n = in.nextInt(); System.out.println(n % 2 == 0 ? "Even" : "Odd");'
      else 'int n = in.nextInt(); System.out.println(n * (n + 1) / 2);' end
    || E'\n    }\n}\n' end,
  r, ('c0de2100-0000-4000-8000-' || lpad((s * 1000 + a * 10 + r)::text, 12, '0'))::uuid,
  '2026-10-30T01:00:00Z'::timestamptz + (a * 10 + r) * interval '1 minute'
from generate_series(1, 9) s cross join generate_series(1, 8) a cross join generate_series(1, 4) r
on conflict do nothing;

insert into public.grades (id, submission_id, instructor_id, scores, feedback, total_score, published_at)
select ('c0de3000-0000-4000-8000-' || lpad((s * 1000 + a * 10 + r)::text, 12, '0'))::uuid,
  ('c0de2000-0000-4000-8000-' || lpad((s * 1000 + a * 10 + r)::text, 12, '0'))::uuid,
  ('c0de0000-0000-4000-8000-' || lpad((11 + (a - 1) % 3)::text, 12, '0'))::uuid,
  jsonb_build_object('c0de1200-0000-4000-8000-000000000001', 8),
  case when r = 4 then 'Synthetic published feedback for local testing.' else 'Synthetic private draft feedback.' end,
  8, case when r = 4 then '2026-10-30T03:00:00Z'::timestamptz else null end
from generate_series(1, 9) s cross join generate_series(1, 8) a cross join generate_series(3, 4) r
on conflict do nothing;
commit;
