-- Synthetic local development fixtures only. Never run against a hosted project.

with seed_accounts as (
  select
    format('91000000-0000-4000-8000-%s', lpad(account_number::text, 12, '0'))::uuid as id,
    format('student%s@codeleet.test', lpad(account_number::text, 2, '0')) as email,
    format('Student %s', lpad(account_number::text, 2, '0')) as display_name
  from generate_series(1, 12) as student_accounts(account_number)
  union all
  select
    format('91000000-0000-4000-8000-%s', lpad((account_number + 12)::text, 12, '0'))::uuid,
    format('instructor%s@codeleet.test', account_number),
    format('Instructor %s', account_number)
  from generate_series(1, 3) as instructor_accounts(account_number)
)
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
)
select
  id,
  'authenticated',
  'authenticated',
  email,
  '',
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('display_name', display_name),
  now(),
  now()
from seed_accounts
on conflict (id) do nothing;

with seed_accounts as (
  select
    format('91000000-0000-4000-8000-%s', lpad(account_number::text, 12, '0'))::uuid as id,
    format('student%s@codeleet.test', lpad(account_number::text, 2, '0')) as email
  from generate_series(1, 12) as student_accounts(account_number)
  union all
  select
    format('91000000-0000-4000-8000-%s', lpad((account_number + 12)::text, 12, '0'))::uuid,
    format('instructor%s@codeleet.test', account_number)
  from generate_series(1, 3) as instructor_accounts(account_number)
)
insert into auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  created_at,
  updated_at
)
select
  id::text,
  id,
  jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true),
  'email',
  now(),
  now()
from seed_accounts
on conflict (provider_id, provider) do nothing;

-- Public signup remains student-only; trusted local seed data provisions instructors.
update public.user_roles
set role = 'instructor'
where user_id in (
  select format('91000000-0000-4000-8000-%s', lpad((account_number + 12)::text, 12, '0'))::uuid
  from generate_series(1, 3) as instructor_accounts(account_number)
);

insert into public.assignments (
  id,
  instructor_id,
  title,
  instructions,
  language,
  publication_status
)
select
  format('92000000-0000-4000-8000-%s', lpad(assignment_number::text, 12, '0'))::uuid,
  format(
    '91000000-0000-4000-8000-%s',
    lpad((12 + ((assignment_number - 1) % 3) + 1)::text, 12, '0')
  )::uuid,
  format('Practice %s: %s', lpad(assignment_number::text, 2, '0'),
    case when assignment_number % 2 = 0 then 'Java' else 'Python' end),
  format('Synthetic local assignment %s. Write a small program that reads input and prints the requested result.', assignment_number),
  case when assignment_number % 2 = 0 then 'java' else 'python' end,
  case when assignment_number <= 10 then 'published' else 'draft' end
from generate_series(1, 12) as assignments(assignment_number)
on conflict (id) do nothing;

insert into public.assignment_rubrics (assignment_id, criteria)
select
  format('92000000-0000-4000-8000-%s', lpad(assignment_number::text, 12, '0'))::uuid,
  '[
    {"id":"93000000-0000-4000-8000-000000000001","title":"Correctness","description":"Produces the required result for valid input.","maxScore":5},
    {"id":"93000000-0000-4000-8000-000000000002","title":"Edge cases","description":"Handles boundary and representative cases.","maxScore":5}
  ]'::jsonb
from generate_series(1, 12) as assignments(assignment_number)
on conflict (assignment_id) do nothing;

insert into public.submissions (
  id,
  assignment_id,
  student_id,
  source,
  revision,
  request_id
)
select
  format('94000000-0000-4000-8000-%s', lpad(submission_number::text, 12, '0'))::uuid,
  a.id,
  format('91000000-0000-4000-8000-%s', lpad(student_number::text, 12, '0'))::uuid,
  case
    when a.language = 'java' then format(
      'public class Main { public static void main(String[] args) { System.out.println("student-%s-assignment-%s"); } }',
      lpad(student_number::text, 2, '0'), lpad(assignment_number::text, 2, '0')
    )
    else format(
      'print("student-%s-assignment-%s")',
      lpad(student_number::text, 2, '0'), lpad(assignment_number::text, 2, '0')
    )
  end,
  1,
  format('95000000-0000-4000-8000-%s', lpad(submission_number::text, 12, '0'))::uuid
from generate_series(1, 12) as students(student_number)
cross join generate_series(1, 2) as submission_indices(submission_index)
cross join lateral (
  select ((student_number - 1) * 2 + submission_index) % 10 + 1 as assignment_number,
    (student_number - 1) * 2 + submission_index as submission_number
) as fixture
join public.assignments a
  on a.id = format('92000000-0000-4000-8000-%s', lpad(assignment_number::text, 12, '0'))::uuid
on conflict (id) do nothing;

insert into public.grades (
  submission_id,
  instructor_id,
  scores,
  feedback,
  total_score,
  published_at
)
select
  s.id,
  a.instructor_id,
  '{"93000000-0000-4000-8000-000000000001":5,"93000000-0000-4000-8000-000000000002":3}'::jsonb,
  format('Synthetic local feedback for student %s.', lpad(student_number::text, 2, '0')),
  8,
  case when student_number <= 8 then now() else null end
from generate_series(1, 12) as students(student_number)
join public.submissions s
  on s.id = format(
    '94000000-0000-4000-8000-%s',
    lpad(((student_number - 1) * 2 + 1)::text, 12, '0')
  )::uuid
join public.assignments a on a.id = s.assignment_id
on conflict (submission_id) do nothing;
