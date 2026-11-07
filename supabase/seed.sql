-- Synthetic local development fixtures only. Never run against a hosted project.

do $seed$
begin
-- 1. SEED ACCOUNTS & AUTHENTICATION
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
  union all
  select
    '91000000-0000-4000-8000-000000000016'::uuid,
    'admin@codeleet.test',
    'Admin'
)
insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  confirmation_token,
  recovery_token,
  email_change,
  email_change_token_current,
  email_change_token_new,
  phone_change,
  phone_change_token,
  reauthentication_token,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
select
  id,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  email,
  extensions.crypt('123456', extensions.gen_salt('bf')),
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('display_name', display_name),
  now(),
  now()
from seed_accounts
on conflict (id) do update
set instance_id = excluded.instance_id,
  encrypted_password = excluded.encrypted_password,
  confirmation_token = excluded.confirmation_token,
  recovery_token = excluded.recovery_token,
  email_change = excluded.email_change,
  email_change_token_current = excluded.email_change_token_current,
  email_change_token_new = excluded.email_change_token_new,
  phone_change = excluded.phone_change,
  phone_change_token = excluded.phone_change_token,
  reauthentication_token = excluded.reauthentication_token;

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
  union all
  select '91000000-0000-4000-8000-000000000016'::uuid, 'admin@codeleet.test'
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

-- Public signup remains student-only; trusted local seed data provisions instructors and admin.
update public.user_roles
set role = 'instructor'
where user_id in (
  select format('91000000-0000-4000-8000-%s', lpad((account_number + 12)::text, 12, '0'))::uuid
  from generate_series(1, 3) as instructor_accounts(account_number)
);

update public.user_roles
set role = 'admin'
where user_id = '91000000-0000-4000-8000-000000000016';

-- 2. COURSES, FEATURES & MEMBERSHIPS
-- Insert 3 active courses (Python, Java, Polyglot)
insert into public.courses (id, owner_id, created_by, title, description, lifecycle, is_legacy)
values
  (
    '96000000-0000-4000-8000-000000000001'::uuid,
    '91000000-0000-4000-8000-000000000013'::uuid,
    '91000000-0000-4000-8000-000000000013'::uuid,
    'CS101: Introduction to Python Programming',
    'Master fundamental computer science concepts, data structures, and algorithmic thinking using Python.',
    'active',
    false
  ),
  (
    '96000000-0000-4000-8000-000000000002'::uuid,
    '91000000-0000-4000-8000-000000000014'::uuid,
    '91000000-0000-4000-8000-000000000014'::uuid,
    'CS102: Data Structures in Java',
    'Comprehensive study of abstract data types, object-oriented design, and algorithms implemented in Java.',
    'active',
    false
  ),
  (
    '96000000-0000-4000-8000-000000000003'::uuid,
    '91000000-0000-4000-8000-000000000015'::uuid,
    '91000000-0000-4000-8000-000000000015'::uuid,
    'CS201: Algorithms & Problem Solving',
    'Advanced problem solving and interview preparation exploring solutions across both Python and Java paradigms.',
    'active',
    false
  )
on conflict (id) do update
set title = excluded.title,
  description = excluded.description,
  lifecycle = excluded.lifecycle,
  owner_id = excluded.owner_id;

-- Enable all 5 course features across all active courses and Legacy
insert into public.course_features(course_id, feature, enabled)
select c.id, f.feature, true
from public.courses c
cross join (values('assessments'),('ai'),('discussions'),('xp'),('leaderboard')) f(feature)
on conflict do nothing;

-- Enroll students and instructors into all courses
insert into public.course_memberships(course_id, user_id, role)
select c.id, r.user_id, r.role
from public.courses c
cross join public.user_roles r
where r.role in ('student', 'instructor')
on conflict (course_id, user_id) do nothing;

-- 3. REALISTIC LEETCODE EASY ASSIGNMENTS
insert into public.assignments (
  id,
  instructor_id,
  title,
  instructions,
  language,
  publication_status,
  due_at,
  course_id,
  max_xp
)
values
  -- Course 1: Python Only
  (
    '92000000-0000-4000-8000-000000000001'::uuid,
    '91000000-0000-4000-8000-000000000013'::uuid,
    'Two Sum',
    E'Given a list of integers on the first line and a target integer on the second line, find the zero-based indices of the two numbers that add up to the target.\n\n### Input Format\n- Line 1: Space-separated integers representing `nums`\n- Line 2: A single integer `target`\n\n### Output Format\n- Print the two zero-based indices separated by a space in ascending order (e.g. `0 1`).\n\n### Constraints\n- 2 <= nums.length <= 10^4\n- Exactly one valid solution exists.\n\n### Example\nInput:\n2 7 11 15\n9\nOutput:\n0 1',
    'python',
    'published',
    clock_timestamp() + interval '7 days',
    '96000000-0000-4000-8000-000000000001'::uuid,
    20
  ),
  (
    '92000000-0000-4000-8000-000000000002'::uuid,
    '91000000-0000-4000-8000-000000000013'::uuid,
    'Valid Palindrome',
    E'A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.\n\nGiven a string `s`, print `true` if it is a palindrome, or `false` otherwise.\n\n### Input Format\n- A single line of text.\n\n### Output Format\n- `true` or `false`\n\n### Example 1\nInput:\nA man, a plan, a canal: Panama\nOutput:\ntrue\n\n### Example 2\nInput:\nrace a car\nOutput:\nfalse',
    'python',
    'published',
    clock_timestamp() + interval '14 days',
    '96000000-0000-4000-8000-000000000001'::uuid,
    15
  ),
  (
    '92000000-0000-4000-8000-000000000003'::uuid,
    '91000000-0000-4000-8000-000000000013'::uuid,
    'Best Time to Buy and Sell Stock',
    E'You are given an array of stock prices where `prices[i]` is the price on day `i`. You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell.\n\nPrint the maximum profit achievable. If no profit can be achieved, print `0`.\n\n### Input Format\n- Space-separated integers representing daily prices.\n\n### Output Format\n- A single integer representing maximum profit.\n\n### Example 1\nInput:\n7 1 5 3 6 4\nOutput:\n5',
    'python',
    'published',
    clock_timestamp() - interval '2 days',
    '96000000-0000-4000-8000-000000000001'::uuid,
    15
  ),
  -- Course 2: Java Only
  (
    '92000000-0000-4000-8000-000000000004'::uuid,
    '91000000-0000-4000-8000-000000000014'::uuid,
    'Valid Parentheses',
    E'Write a Java program in a single `Main` class that reads a string `s` containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', and determines if the input string is valid.\n\nAn input string is valid if brackets close in the correct order with matching pairs.\n\n### Input Format\n- A single line containing string `s`.\n\n### Output Format\n- `true` or `false`\n\n### Example 1\nInput:\n()[]{}\nOutput:\ntrue\n\n### Example 2\nInput:\n(]\nOutput:\nfalse',
    'java',
    'published',
    clock_timestamp() + interval '5 days',
    '96000000-0000-4000-8000-000000000002'::uuid,
    15
  ),
  (
    '92000000-0000-4000-8000-000000000005'::uuid,
    '91000000-0000-4000-8000-000000000014'::uuid,
    'Roman to Integer',
    E'Roman numerals are represented by: I (1), V (5), X (10), L (50), C (100), D (500), M (1000).\n\nWrite a Java program in a single `Main` class that reads a Roman numeral string and prints its integer value.\n\nSubtractive rules apply (IV = 4, IX = 9, XL = 40, XC = 90, CD = 400, CM = 900).\n\n### Input Format\n- A single line containing Roman numeral string.\n\n### Output Format\n- An integer value.\n\n### Example\nInput:\nMCMXCIV\nOutput:\n1994',
    'java',
    'published',
    clock_timestamp() + interval '10 days',
    '96000000-0000-4000-8000-000000000002'::uuid,
    15
  ),
  (
    '92000000-0000-4000-8000-000000000006'::uuid,
    '91000000-0000-4000-8000-000000000014'::uuid,
    'Binary Search',
    E'Write a Java program in a single `Main` class that reads a sorted array of integers and a target value, and prints the index of the target using Binary Search in O(log n) time. If absent, print `-1`.\n\n### Input Format\n- Line 1: Space-separated sorted integers representing `nums`\n- Line 2: An integer `target`\n\n### Output Format\n- Target index or `-1`\n\n### Example\nInput:\n-1 0 3 5 9 12\n9\nOutput:\n4',
    'java',
    'draft',
    null,
    '96000000-0000-4000-8000-000000000002'::uuid,
    15
  ),
  -- Course 3: Polyglot (Both Python and Java)
  (
    '92000000-0000-4000-8000-000000000007'::uuid,
    '91000000-0000-4000-8000-000000000015'::uuid,
    'Palindrome Number',
    E'Given an integer `x`, print `true` if `x` is a palindrome, and `false` otherwise.\n\nAn integer is a palindrome when it reads the same backward as forward. Negative numbers are never palindromes.\n\n### Input Format\n- A single integer `x`.\n\n### Output Format\n- `true` or `false`\n\n### Example 1\nInput:\n121\nOutput:\ntrue\n\n### Example 2\nInput:\n-121\nOutput:\nfalse',
    'python',
    'published',
    clock_timestamp() + interval '8 days',
    '96000000-0000-4000-8000-000000000003'::uuid,
    15
  ),
  (
    '92000000-0000-4000-8000-000000000008'::uuid,
    '91000000-0000-4000-8000-000000000015'::uuid,
    'Fizz Buzz',
    E'Write a Java program in a single `Main` class that reads an integer `n` and prints numbers from 1 to `n`, each on a new line.\n- If divisible by 3 and 5, print `FizzBuzz`\n- If divisible by 3, print `Fizz`\n- If divisible by 5, print `Buzz`\n- Otherwise, print the number.\n\n### Input Format\n- A single integer `n`.\n\n### Output Format\n- `n` lines of output.\n\n### Example\nInput:\n5\nOutput:\n1\n2\nFizz\n4\nBuzz',
    'java',
    'published',
    clock_timestamp() + interval '12 days',
    '96000000-0000-4000-8000-000000000003'::uuid,
    15
  ),
  (
    '92000000-0000-4000-8000-000000000009'::uuid,
    '91000000-0000-4000-8000-000000000015'::uuid,
    'Contains Duplicate',
    E'Given an array of space-separated integers, print `true` if any value appears at least twice in the array, and print `false` if every element is distinct.\n\n### Input Format\n- Space-separated integers on a single line.\n\n### Output Format\n- `true` or `false`\n\n### Example 1\nInput:\n1 2 3 1\nOutput:\ntrue\n\n### Example 2\nInput:\n1 2 3 4\nOutput:\nfalse',
    'python',
    'published',
    null,
    '96000000-0000-4000-8000-000000000003'::uuid,
    15
  ),
  -- Legacy Assignments
  (
    '92000000-0000-4000-8000-000000000010'::uuid,
    '91000000-0000-4000-8000-000000000013'::uuid,
    'Legacy: Fibonacci Numbers',
    E'Given integer n, print the n-th Fibonacci number where F(0)=0, F(1)=1.',
    'python',
    'published',
    null,
    (select id from public.courses where is_legacy),
    10
  ),
  (
    '92000000-0000-4000-8000-000000000011'::uuid,
    '91000000-0000-4000-8000-000000000014'::uuid,
    'Legacy: Reverse Words in String',
    E'Given a string of words, reverse the order of words.',
    'java',
    'published',
    null,
    (select id from public.courses where is_legacy),
    10
  ),
  (
    '92000000-0000-4000-8000-000000000012'::uuid,
    '91000000-0000-4000-8000-000000000015'::uuid,
    'Legacy: Factorial Calculation',
    E'Draft assignment for factorial calculation.',
    'python',
    'draft',
    null,
    (select id from public.courses where is_legacy),
    10
  )
on conflict (id) do update
set title = excluded.title,
  instructions = excluded.instructions,
  language = excluded.language,
  publication_status = excluded.publication_status,
  due_at = excluded.due_at,
  course_id = excluded.course_id,
  max_xp = excluded.max_xp;

-- 4. RUBRICS
insert into public.assignment_rubrics (assignment_id, criteria)
values
  -- Two Sum
  (
    '92000000-0000-4000-8000-000000000001'::uuid,
    '[
      {"id":"93000000-0000-4000-8000-000000000001","title":"Correctness","description":"Produces correct indices for valid inputs.","maxScore":5},
      {"id":"93000000-0000-4000-8000-000000000002","title":"Edge cases","description":"Handles negative values and duplicate numbers.","maxScore":5},
      {"id":"93000000-0000-4000-8000-000000000003","title":"Time Complexity","description":"O(n) linear solution using hash map.","maxScore":5},
      {"id":"93000000-0000-4000-8000-000000000004","title":"Code Style","description":"Clean, idiomatic and well-structured code.","maxScore":5}
    ]'::jsonb
  ),
  -- Valid Palindrome
  (
    '92000000-0000-4000-8000-000000000002'::uuid,
    '[
      {"id":"93000000-0000-4000-8000-000000000005","title":"Correctness","description":"Accurately filters characters and checks palindrome.","maxScore":5},
      {"id":"93000000-0000-4000-8000-000000000006","title":"Edge cases","description":"Handles empty strings, spaces-only, and mixed casing.","maxScore":5},
      {"id":"93000000-0000-4000-8000-000000000007","title":"Code Quality","description":"Concise, two-pointer or filtered traversal.","maxScore":5}
    ]'::jsonb
  ),
  -- Best Time to Buy and Sell Stock
  (
    '92000000-0000-4000-8000-000000000003'::uuid,
    '[
      {"id":"93000000-0000-4000-8000-000000000008","title":"Correctness","description":"Computes maximum profit with buy day preceding sell day.","maxScore":5},
      {"id":"93000000-0000-4000-8000-000000000009","title":"Time Complexity","description":"O(n) single-pass without nested loops.","maxScore":5},
      {"id":"93000000-0000-4000-8000-000000000010","title":"Edge cases","description":"Returns 0 for strictly descending price sequences.","maxScore":5}
    ]'::jsonb
  ),
  -- Valid Parentheses
  (
    '92000000-0000-4000-8000-000000000004'::uuid,
    '[
      {"id":"93000000-0000-4000-8000-000000000011","title":"Correctness","description":"Correctly validates bracket pairing and ordering.","maxScore":5},
      {"id":"93000000-0000-4000-8000-000000000012","title":"Edge cases","description":"Handles odd lengths and unmatched open brackets.","maxScore":5},
      {"id":"93000000-0000-4000-8000-000000000013","title":"Data Structure","description":"Uses stack / deque cleanly in Java.","maxScore":5}
    ]'::jsonb
  ),
  -- Roman to Integer
  (
    '92000000-0000-4000-8000-000000000005'::uuid,
    '[
      {"id":"93000000-0000-4000-8000-000000000014","title":"Correctness","description":"Converts standard symbols to exact values.","maxScore":5},
      {"id":"93000000-0000-4000-8000-000000000015","title":"Subtractive Pairs","description":"Handles IV, IX, XL, XC, CD, CM correctly.","maxScore":5},
      {"id":"93000000-0000-4000-8000-000000000016","title":"Code Organization","description":"Readable switch or lookup design.","maxScore":5}
    ]'::jsonb
  ),
  -- Binary Search
  (
    '92000000-0000-4000-8000-000000000006'::uuid,
    '[
      {"id":"93000000-0000-4000-8000-000000000017","title":"Correctness","description":"Finds element index or returns -1.","maxScore":5},
      {"id":"93000000-0000-4000-8000-000000000018","title":"Complexity","description":"O(log n) logarithmic time complexity.","maxScore":5},
      {"id":"93000000-0000-4000-8000-000000000019","title":"Midpoint Calculation","description":"Prevents integer overflow during midpoint search.","maxScore":5}
    ]'::jsonb
  ),
  -- Palindrome Number
  (
    '92000000-0000-4000-8000-000000000007'::uuid,
    '[
      {"id":"93000000-0000-4000-8000-000000000020","title":"Correctness","description":"Accurately detects numeric palindromes.","maxScore":5},
      {"id":"93000000-0000-4000-8000-000000000021","title":"Edge cases","description":"Handles negatives and numbers ending in zero.","maxScore":5},
      {"id":"93000000-0000-4000-8000-000000000022","title":"Code Simplicity","description":"Concise, readable Python code.","maxScore":5}
    ]'::jsonb
  ),
  -- Fizz Buzz
  (
    '92000000-0000-4000-8000-000000000008'::uuid,
    '[
      {"id":"93000000-0000-4000-8000-000000000023","title":"Correctness","description":"Correct text for multiples of 3, 5, and 15.","maxScore":5},
      {"id":"93000000-0000-4000-8000-000000000024","title":"Ordering of Conditions","description":"Validates divisibility by 15 before 3 or 5.","maxScore":5},
      {"id":"93000000-0000-4000-8000-000000000025","title":"Formatting","description":"Matches exact line-by-line output format.","maxScore":5}
    ]'::jsonb
  ),
  -- Contains Duplicate
  (
    '92000000-0000-4000-8000-000000000009'::uuid,
    '[
      {"id":"93000000-0000-4000-8000-000000000026","title":"Correctness","description":"Detects duplicates in integer arrays.","maxScore":5},
      {"id":"93000000-0000-4000-8000-000000000027","title":"Efficiency","description":"O(n) set/hash lookup.","maxScore":5},
      {"id":"93000000-0000-4000-8000-000000000028","title":"Clean Code","description":"Idiomatic Python set usage.","maxScore":5}
    ]'::jsonb
  ),
  -- Legacy Assignments Rubrics
  (
    '92000000-0000-4000-8000-000000000010'::uuid,
    '[
      {"id":"93000000-0000-4000-8000-000000000029","title":"Correctness","description":"Computes Fibonacci accurately.","maxScore":5},
      {"id":"93000000-0000-4000-8000-000000000030","title":"Base Cases","description":"Handles 0 and 1 cleanly.","maxScore":5}
    ]'::jsonb
  ),
  (
    '92000000-0000-4000-8000-000000000011'::uuid,
    '[
      {"id":"93000000-0000-4000-8000-000000000031","title":"Correctness","description":"Reverses word order.","maxScore":5},
      {"id":"93000000-0000-4000-8000-000000000032","title":"Spacing","description":"Trims excess whitespace.","maxScore":5}
    ]'::jsonb
  ),
  (
    '92000000-0000-4000-8000-000000000012'::uuid,
    '[
      {"id":"93000000-0000-4000-8000-000000000033","title":"Correctness","description":"Calculates factorial correctly.","maxScore":5},
      {"id":"93000000-0000-4000-8000-000000000034","title":"Boundary","description":"Handles 0! = 1.","maxScore":5}
    ]'::jsonb
  )
on conflict (assignment_id) do update
set criteria = excluded.criteria;

-- 5. PRACTICE TEST CASES (adhering strictly to valid_practice_cases: max 5 cases, exactly 4 keys: id, name, stdin, expected_stdout)
insert into public.assignment_practice_sets (assignment_id, cases, published_revision, published_at)
values
  -- Two Sum
  (
    '92000000-0000-4000-8000-000000000001'::uuid,
    '[
      {"id":"81000000-0000-4000-8000-000000000001","name":"Standard pair","stdin":"2 7 11 15\n9\n","expected_stdout":"0 1\n"},
      {"id":"81000000-0000-4000-8000-000000000002","name":"Non-adjacent elements","stdin":"3 2 4\n6\n","expected_stdout":"1 2\n"},
      {"id":"81000000-0000-4000-8000-000000000003","name":"Duplicate values","stdin":"3 3\n6\n","expected_stdout":"0 1\n"}
    ]'::jsonb,
    1,
    now()
  ),
  -- Valid Palindrome
  (
    '92000000-0000-4000-8000-000000000002'::uuid,
    '[
      {"id":"81000000-0000-4000-8000-000000000004","name":"Sentence with punctuation","stdin":"A man, a plan, a canal: Panama\n","expected_stdout":"true\n"},
      {"id":"81000000-0000-4000-8000-000000000005","name":"Non-palindrome","stdin":"race a car\n","expected_stdout":"false\n"},
      {"id":"81000000-0000-4000-8000-000000000006","name":"Single space","stdin":" \n","expected_stdout":"true\n"}
    ]'::jsonb,
    1,
    now()
  ),
  -- Best Time to Buy and Sell Stock
  (
    '92000000-0000-4000-8000-000000000003'::uuid,
    '[
      {"id":"81000000-0000-4000-8000-000000000007","name":"Standard peak","stdin":"7 1 5 3 6 4\n","expected_stdout":"5\n"},
      {"id":"81000000-0000-4000-8000-000000000008","name":"Decreasing prices","stdin":"7 6 4 3 1\n","expected_stdout":"0\n"},
      {"id":"81000000-0000-4000-8000-000000000009","name":"Two days","stdin":"2 4\n","expected_stdout":"2\n"}
    ]'::jsonb,
    1,
    now()
  ),
  -- Valid Parentheses
  (
    '92000000-0000-4000-8000-000000000004'::uuid,
    '[
      {"id":"81000000-0000-4000-8000-000000000010","name":"Multiple brackets","stdin":"()[]{}\n","expected_stdout":"true\n"},
      {"id":"81000000-0000-4000-8000-000000000011","name":"Mismatched closing","stdin":"(]\n","expected_stdout":"false\n"},
      {"id":"81000000-0000-4000-8000-000000000012","name":"Nested brackets","stdin":"{[]}\n","expected_stdout":"true\n"},
      {"id":"81000000-0000-4000-8000-000000000013","name":"Incomplete open","stdin":"(\n","expected_stdout":"false\n"}
    ]'::jsonb,
    1,
    now()
  ),
  -- Roman to Integer
  (
    '92000000-0000-4000-8000-000000000005'::uuid,
    '[
      {"id":"81000000-0000-4000-8000-000000000014","name":"Simple numeral","stdin":"III\n","expected_stdout":"3\n"},
      {"id":"81000000-0000-4000-8000-000000000015","name":"Additive numeral","stdin":"LVIII\n","expected_stdout":"58\n"},
      {"id":"81000000-0000-4000-8000-000000000016","name":"Subtractive numeral","stdin":"MCMXCIV\n","expected_stdout":"1994\n"}
    ]'::jsonb,
    1,
    now()
  ),
  -- Binary Search
  (
    '92000000-0000-4000-8000-000000000006'::uuid,
    '[
      {"id":"81000000-0000-4000-8000-000000000017","name":"Target found","stdin":"-1 0 3 5 9 12\n9\n","expected_stdout":"4\n"},
      {"id":"81000000-0000-4000-8000-000000000018","name":"Target absent","stdin":"-1 0 3 5 9 12\n2\n","expected_stdout":"-1\n"}
    ]'::jsonb,
    1,
    now()
  ),
  -- Palindrome Number
  (
    '92000000-0000-4000-8000-000000000007'::uuid,
    '[
      {"id":"81000000-0000-4000-8000-000000000019","name":"Positive palindrome","stdin":"121\n","expected_stdout":"true\n"},
      {"id":"81000000-0000-4000-8000-000000000020","name":"Negative integer","stdin":"-121\n","expected_stdout":"false\n"},
      {"id":"81000000-0000-4000-8000-000000000021","name":"Trailing zero","stdin":"10\n","expected_stdout":"false\n"}
    ]'::jsonb,
    1,
    now()
  ),
  -- Fizz Buzz
  (
    '92000000-0000-4000-8000-000000000008'::uuid,
    '[
      {"id":"81000000-0000-4000-8000-000000000022","name":"Small count","stdin":"3\n","expected_stdout":"1\n2\nFizz\n"},
      {"id":"81000000-0000-4000-8000-000000000023","name":"Up to 5","stdin":"5\n","expected_stdout":"1\n2\nFizz\n4\nBuzz\n"},
      {"id":"81000000-0000-4000-8000-000000000024","name":"Up to 15","stdin":"15\n","expected_stdout":"1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz\n"}
    ]'::jsonb,
    1,
    now()
  ),
  -- Contains Duplicate
  (
    '92000000-0000-4000-8000-000000000009'::uuid,
    '[
      {"id":"81000000-0000-4000-8000-000000000025","name":"Has duplicate","stdin":"1 2 3 1\n","expected_stdout":"true\n"},
      {"id":"81000000-0000-4000-8000-000000000026","name":"All distinct","stdin":"1 2 3 4\n","expected_stdout":"false\n"}
    ]'::jsonb,
    1,
    now()
  )
on conflict (assignment_id) do update
set cases = excluded.cases,
  published_revision = excluded.published_revision,
  published_at = excluded.published_at;

-- Populate practice drafts matching practice sets
insert into public.assignment_practice_drafts (assignment_id, cases, version, updated_at)
select assignment_id, cases, published_revision, now()
from public.assignment_practice_sets
on conflict (assignment_id) do update
set cases = excluded.cases,
  version = excluded.version,
  updated_at = excluded.updated_at;

-- 6. STUDENT SUBMISSIONS WITH REALISTIC WORKING SOURCE
insert into public.submissions (
  id,
  assignment_id,
  student_id,
  source,
  revision,
  request_id
)
values
  -- Student 1: Two Sum (Rev 1: basic, Rev 2: optimal hash map)
  (
    '94000000-0000-4000-8000-000000000001'::uuid,
    '92000000-0000-4000-8000-000000000001'::uuid,
    '91000000-0000-4000-8000-000000000001'::uuid,
    E'import sys\nlines = sys.stdin.read().strip().split(\'\\n\')\nnums = [int(x) for x in lines[0].split()]\ntarget = int(lines[1])\nfor i in range(len(nums)):\n    for j in range(i + 1, len(nums)):\n        if nums[i] + nums[j] == target:\n            print(f"{i} {j}")\n            sys.exit(0)',
    1,
    '95000000-0000-4000-8000-000000000001'::uuid
  ),
  (
    '94000000-0000-4000-8000-000000000002'::uuid,
    '92000000-0000-4000-8000-000000000001'::uuid,
    '91000000-0000-4000-8000-000000000001'::uuid,
    E'import sys\nlines = sys.stdin.read().strip().split(\'\\n\')\nnums = [int(x) for x in lines[0].split()]\ntarget = int(lines[1])\nseen = {}\nfor i, num in enumerate(nums):\n    diff = target - num\n    if diff in seen:\n        print(f"{seen[diff]} {i}")\n        break\n    seen[num] = i',
    2,
    '95000000-0000-4000-8000-000000000002'::uuid
  ),
  -- Student 2: Valid Palindrome
  (
    '94000000-0000-4000-8000-000000000003'::uuid,
    '92000000-0000-4000-8000-000000000002'::uuid,
    '91000000-0000-4000-8000-000000000002'::uuid,
    E'import sys\nline = sys.stdin.readline().rstrip(\'\\r\\n\')\nfiltered = [c.lower() for c in line if c.isalnum()]\nprint("true" if filtered == filtered[::-1] else "false")',
    1,
    '95000000-0000-4000-8000-000000000003'::uuid
  ),
  -- Student 3: Best Time to Buy and Sell Stock
  (
    '94000000-0000-4000-8000-000000000004'::uuid,
    '92000000-0000-4000-8000-000000000003'::uuid,
    '91000000-0000-4000-8000-000000000003'::uuid,
    E'import sys\nline = sys.stdin.read().strip()\nif not line:\n    print(0)\nelse:\n    prices = [int(x) for x in line.split()]\n    min_price, max_profit = float(\'inf\'), 0\n    for p in prices:\n        if p < min_price:\n            min_price = p\n        elif p - min_price > max_profit:\n            max_profit = p - min_price\n    print(max_profit)',
    1,
    '95000000-0000-4000-8000-000000000004'::uuid
  ),
  -- Student 4: Valid Parentheses (Java)
  (
    '94000000-0000-4000-8000-000000000005'::uuid,
    '92000000-0000-4000-8000-000000000004'::uuid,
    '91000000-0000-4000-8000-000000000004'::uuid,
    E'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner s = new Scanner(System.in);\n        if (!s.hasNextLine()) { System.out.println("true"); return; }\n        String str = s.nextLine().trim();\n        Deque<Character> stack = new ArrayDeque<>();\n        boolean valid = true;\n        for (char c : str.toCharArray()) {\n            if (c == \'(\' || c == \'{\' || c == \'[\') stack.push(c);\n            else {\n                if (stack.isEmpty()) { valid = false; break; }\n                char top = stack.pop();\n                if ((c == \')\' && top != \'(\') || (c == \'}\' && top != \'{\') || (c == \']\' && top != \'[\')) { valid = false; break; }\n            }\n        }\n        if (!stack.isEmpty()) valid = false;\n        System.out.println(valid ? "true" : "false");\n    }\n}',
    1,
    '95000000-0000-4000-8000-000000000005'::uuid
  ),
  -- Student 5: Roman to Integer (Java)
  (
    '94000000-0000-4000-8000-000000000006'::uuid,
    '92000000-0000-4000-8000-000000000005'::uuid,
    '91000000-0000-4000-8000-000000000005'::uuid,
    E'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner s = new Scanner(System.in);\n        if (!s.hasNextLine()) { System.out.println("0"); return; }\n        String r = s.nextLine().trim();\n        Map<Character, Integer> vals = new HashMap<>();\n        vals.put(\'I\', 1); vals.put(\'V\', 5); vals.put(\'X\', 10);\n        vals.put(\'L\', 50); vals.put(\'C\', 100); vals.put(\'D\', 500); vals.put(\'M\', 1000);\n        int total = 0;\n        for (int i = 0; i < r.length(); i++) {\n            int current = vals.getOrDefault(r.charAt(i), 0);\n            int next = (i + 1 < r.length()) ? vals.getOrDefault(r.charAt(i + 1), 0) : 0;\n            if (current < next) total -= current;\n            else total += current;\n        }\n        System.out.println(total);\n    }\n}',
    1,
    '95000000-0000-4000-8000-000000000006'::uuid
  ),
  -- Student 6: Palindrome Number (Python)
  (
    '94000000-0000-4000-8000-000000000007'::uuid,
    '92000000-0000-4000-8000-000000000007'::uuid,
    '91000000-0000-4000-8000-000000000006'::uuid,
    E'import sys\nval = sys.stdin.read().strip()\nif not val:\n    print("false")\nelif val.startswith("-"):\n    print("false")\nelse:\n    print("true" if val == val[::-1] else "false")',
    1,
    '95000000-0000-4000-8000-000000000007'::uuid
  ),
  -- Student 7: Fizz Buzz (Java)
  (
    '94000000-0000-4000-8000-000000000008'::uuid,
    '92000000-0000-4000-8000-000000000008'::uuid,
    '91000000-0000-4000-8000-000000000007'::uuid,
    E'import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner s = new Scanner(System.in);\n        if (!s.hasNextInt()) return;\n        int n = s.nextInt();\n        for (int i = 1; i <= n; i++) {\n            if (i % 15 == 0) System.out.println("FizzBuzz");\n            else if (i % 3 == 0) System.out.println("Fizz");\n            else if (i % 5 == 0) System.out.println("Buzz");\n            else System.out.println(i);\n        }\n    }\n}',
    1,
    '95000000-0000-4000-8000-000000000008'::uuid
  ),
  -- Student 8: Contains Duplicate (Python)
  (
    '94000000-0000-4000-8000-000000000009'::uuid,
    '92000000-0000-4000-8000-000000000009'::uuid,
    '91000000-0000-4000-8000-000000000008'::uuid,
    E'import sys\nline = sys.stdin.read().strip()\nif not line:\n    print("false")\nelse:\n    nums = line.split()\n    print("true" if len(nums) != len(set(nums)) else "false")',
    1,
    '95000000-0000-4000-8000-000000000009'::uuid
  )
on conflict (id) do nothing;

-- 7. GRADES & EVALUATIONS
insert into public.grades (
  id,
  submission_id,
  instructor_id,
  scores,
  feedback,
  total_score,
  published_at
)
values
  -- Grade for Student 1 Two Sum (rev 2)
  (
    '98000000-0000-4000-8000-000000000001'::uuid,
    '94000000-0000-4000-8000-000000000002'::uuid,
    '91000000-0000-4000-8000-000000000013'::uuid,
    '{"93000000-0000-4000-8000-000000000001":5,"93000000-0000-4000-8000-000000000002":5,"93000000-0000-4000-8000-000000000003":5,"93000000-0000-4000-8000-000000000004":5}'::jsonb,
    'Excellent upgrade in Revision 2! Switching from nested loops to a single-pass hash map reduced time complexity to O(n). Outstanding work.',
    20,
    now()
  ),
  -- Grade for Student 2 Valid Palindrome
  (
    '98000000-0000-4000-8000-000000000002'::uuid,
    '94000000-0000-4000-8000-000000000003'::uuid,
    '91000000-0000-4000-8000-000000000013'::uuid,
    '{"93000000-0000-4000-8000-000000000005":5,"93000000-0000-4000-8000-000000000006":5,"93000000-0000-4000-8000-000000000007":5}'::jsonb,
    'Very clean list comprehension and slice reversal. Handled all edge cases including mixed punctuation and spaces.',
    15,
    now()
  ),
  -- Grade for Student 4 Valid Parentheses
  (
    '98000000-0000-4000-8000-000000000004'::uuid,
    '94000000-0000-4000-8000-000000000005'::uuid,
    '91000000-0000-4000-8000-000000000014'::uuid,
    '{"93000000-0000-4000-8000-000000000011":5,"93000000-0000-4000-8000-000000000012":5,"93000000-0000-4000-8000-000000000013":5}'::jsonb,
    'Great choice using ArrayDeque as a stack in Java. All brackets correctly matched and edge cases covered.',
    15,
    now()
  ),
  -- Grade for Student 5 Roman to Integer
  (
    '98000000-0000-4000-8000-000000000005'::uuid,
    '94000000-0000-4000-8000-000000000006'::uuid,
    '91000000-0000-4000-8000-000000000014'::uuid,
    '{"93000000-0000-4000-8000-000000000014":5,"93000000-0000-4000-8000-000000000015":5,"93000000-0000-4000-8000-000000000016":4}'::jsonb,
    'Subtractive lookup handles cases accurately. Consider using switch statement or int array for slightly faster lookup than HashMap.',
    14,
    now()
  ),
  -- Grade for Student 7 Fizz Buzz
  (
    '98000000-0000-4000-8000-000000000007'::uuid,
    '94000000-0000-4000-8000-000000000008'::uuid,
    '91000000-0000-4000-8000-000000000015'::uuid,
    '{"93000000-0000-4000-8000-000000000023":5,"93000000-0000-4000-8000-000000000024":5,"93000000-0000-4000-8000-000000000025":5}'::jsonb,
    'Flawless FizzBuzz implementation. Condition ordering is exact.',
    15,
    now()
  ),
  -- Grade for Student 8 Contains Duplicate
  (
    '98000000-0000-4000-8000-000000000008'::uuid,
    '94000000-0000-4000-8000-000000000009'::uuid,
    '91000000-0000-4000-8000-000000000015'::uuid,
    '{"93000000-0000-4000-8000-000000000026":5,"93000000-0000-4000-8000-000000000027":5,"93000000-0000-4000-8000-000000000028":5}'::jsonb,
    'Optimal Pythonic solution using set comparisons. O(n) runtime achieved.',
    15,
    now()
  )
on conflict (submission_id) do nothing;

-- 8. XP AWARDS & LEADERBOARD INITIALIZATION
-- Insert grade basis for published grades
insert into xp_private.grade_basis (grade_id, grade_version, score, maximum_score)
values
  ('98000000-0000-4000-8000-000000000001'::uuid, 1, 20, 20),
  ('98000000-0000-4000-8000-000000000002'::uuid, 1, 15, 15),
  ('98000000-0000-4000-8000-000000000004'::uuid, 1, 15, 15),
  ('98000000-0000-4000-8000-000000000005'::uuid, 1, 14, 15),
  ('98000000-0000-4000-8000-000000000007'::uuid, 1, 15, 15),
  ('98000000-0000-4000-8000-000000000008'::uuid, 1, 15, 15)
on conflict (grade_id) do nothing;

-- Populate xp_awards matching the published grades
insert into public.xp_awards (student_id, assignment_id, amount, grade_id, grade_version, updated_at)
values
  ('91000000-0000-4000-8000-000000000001'::uuid, '92000000-0000-4000-8000-000000000001'::uuid, 20, '98000000-0000-4000-8000-000000000001'::uuid, 1, now()),
  ('91000000-0000-4000-8000-000000000002'::uuid, '92000000-0000-4000-8000-000000000002'::uuid, 15, '98000000-0000-4000-8000-000000000002'::uuid, 1, now()),
  ('91000000-0000-4000-8000-000000000004'::uuid, '92000000-0000-4000-8000-000000000004'::uuid, 15, '98000000-0000-4000-8000-000000000004'::uuid, 1, now()),
  ('91000000-0000-4000-8000-000000000005'::uuid, '92000000-0000-4000-8000-000000000005'::uuid, 14, '98000000-0000-4000-8000-000000000005'::uuid, 1, now()),
  ('91000000-0000-4000-8000-000000000007'::uuid, '92000000-0000-4000-8000-000000000008'::uuid, 15, '98000000-0000-4000-8000-000000000007'::uuid, 1, now()),
  ('91000000-0000-4000-8000-000000000008'::uuid, '92000000-0000-4000-8000-000000000009'::uuid, 15, '98000000-0000-4000-8000-000000000008'::uuid, 1, now())
on conflict (student_id, assignment_id) do update
set amount = excluded.amount,
  grade_id = excluded.grade_id,
  grade_version = excluded.grade_version;

-- 9. FORUM DISCUSSIONS & REPLIES
insert into public.forum_threads (id, author_id, author_name, author_role, title, body, request_id, course_id)
values
  -- Python Course Threads
  (
    '97000000-0000-4000-8000-000000000001'::uuid,
    '91000000-0000-4000-8000-000000000013'::uuid,
    'Instructor 1',
    'instructor',
    'Welcome to CS101: Python Programming!',
    'Welcome everyone! Use this forum to ask questions about Python syntax, algorithmic complexities, and test cases. Remember not to share full solutions before deadlines.',
    '97000000-0000-4000-8000-000000000001'::uuid,
    '96000000-0000-4000-8000-000000000001'::uuid
  ),
  (
    '97000000-0000-4000-8000-000000000002'::uuid,
    '91000000-0000-4000-8000-000000000001'::uuid,
    'Student 01',
    'student',
    'Two Sum: Handling negative numbers in dictionary lookups',
    'Does Python dictionary lookup handle negative keys in constant time O(1)? Any edge cases with large negative numbers to watch out for?',
    '97000000-0000-4000-8000-000000000002'::uuid,
    '96000000-0000-4000-8000-000000000001'::uuid
  ),
  -- Java Course Threads
  (
    '97000000-0000-4000-8000-000000000003'::uuid,
    '91000000-0000-4000-8000-000000000014'::uuid,
    'Instructor 2',
    'instructor',
    'Welcome to CS102: Java Data Structures',
    'Welcome to Java Data Structures! Please test your programs using standard `Main` class reading from `System.in`. ArrayDeque is recommended over Stack.',
    '97000000-0000-4000-8000-000000000003'::uuid,
    '96000000-0000-4000-8000-000000000002'::uuid
  ),
  (
    '97000000-0000-4000-8000-000000000004'::uuid,
    '91000000-0000-4000-8000-000000000004'::uuid,
    'Student 04',
    'student',
    'Why ArrayDeque instead of java.util.Stack?',
    'I noticed the instructor recommended ArrayDeque instead of Stack for Valid Parentheses. Is that because Vector synchronisation overhead?',
    '97000000-0000-4000-8000-000000000004'::uuid,
    '96000000-0000-4000-8000-000000000002'::uuid
  ),
  -- Polyglot Course Threads
  (
    '97000000-0000-4000-8000-000000000005'::uuid,
    '91000000-0000-4000-8000-000000000015'::uuid,
    'Instructor 3',
    'instructor',
    'Welcome to CS201: Cross-Language Problem Solving',
    'In this course we solve problems in both Python and Java. Compare performance, memory layouts, and syntax ergonomics between the two.',
    '97000000-0000-4000-8000-000000000005'::uuid,
    '96000000-0000-4000-8000-000000000003'::uuid
  )
on conflict (id) do nothing;

insert into public.forum_replies (id, thread_id, author_id, author_name, author_role, body, request_id)
values
  (
    '97000001-0000-4000-8000-000000000001'::uuid,
    '97000000-0000-4000-8000-000000000002'::uuid,
    '91000000-0000-4000-8000-000000000013'::uuid,
    'Instructor 1',
    'instructor',
    'Yes! Python ints have arbitrary precision and their hash function works cleanly with negative integers, giving O(1) average lookup.',
    '97000001-0000-4000-8000-000000000001'::uuid
  ),
  (
    '97000001-0000-4000-8000-000000000002'::uuid,
    '97000000-0000-4000-8000-000000000004'::uuid,
    '91000000-0000-4000-8000-000000000014'::uuid,
    'Instructor 2',
    'instructor',
    'Spot on! `java.util.Stack` extends `Vector`, meaning every method is synchronized and thread-locked. `ArrayDeque` is unsynchronized and significantly faster.',
    '97000001-0000-4000-8000-000000000002'::uuid
  )
on conflict (id) do nothing;

end
$seed$;
