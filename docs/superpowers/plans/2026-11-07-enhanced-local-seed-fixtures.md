# Enhanced Local Seed Fixtures Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance `supabase/seed.sql` to provide standard credentials (`123456`), 3 active courses (Python, Java, and polyglot), realistic LeetCode Easy assignments with practice test cases and rubrics, and rich sample activity across all app features.

**Architecture:** Self-contained declarative PostgreSQL SQL script executed via `pnpm db:seed` that generates bcrypt-hashed passwords using `extensions.crypt`, provisions course workspaces, enrolls members, inserts assignments with schema-validated practice test sets, rubrics, submissions, grades, and forum discussions.

**Tech Stack:** PostgreSQL (Supabase local), PL/pgSQL, pgcrypto, pnpm, Node.js.

**Spec:** [`docs/superpowers/specs/2026-11-07-enhanced-local-seed-fixtures-design.md`](file:///c:/Users/John/Documents/GitHub/CS3227-2610-MP4/docs/superpowers/specs/2026-11-07-enhanced-local-seed-fixtures-design.md)

## Global Constraints

- Minimum password length: 6 characters (`123456`), bcrypt hashed via `extensions.crypt('123456', extensions.gen_salt('bf'))`.
- Assignment languages: strictly `'python'` or `'java'`.
- Practice test cases: at most 5 cases per set, validated by `public.valid_practice_cases(cases)` (keys: `id`, `name`, `stdin`, `expected_stdout`).
- Practice case bounds: `name` 1–120 chars, `stdin` <= 4096 bytes, `expected_stdout` <= 8192 bytes.
- Course features: all 5 features (`assessments`, `ai`, `discussions`, `xp`, `leaderboard`) enabled.
- Browser execution: code runs in-browser reading from `stdin` and writing to `stdout` (`Main` class for Java).
- Backward compatibility: keep the archived `Legacy` course intact (`is_legacy = true`).

## Review Focus

- Review 1: Empty or invalid test cases triggering `valid_practice_cases` check failure during seed insertion.
- Review 2: Missing or conflicting foreign key relationships between assignments and courses.
- Review 3: Invalid bcrypt hash format preventing Supabase auth sign-in with password `123456`.
- Review 4: Rubric criteria ID format or score mismatch with `grades` JSON structure.
- Review 5: Course membership missing for students or instructors causing authorization policies to reject course access.

---

### Task 1: Seed Standard Credentials and Admin User Account

**Files:**
- Modify: `supabase/seed.sql:1-118`

**Interfaces:**
- Consumes: `auth.users`, `auth.identities`, `public.user_roles`, `public.profiles`
- Produces: `admin@codeleet.test` (admin), `instructor1@codeleet.test`..`3` (instructors), `student01@codeleet.test`..`12` (students), all with password `123456`.

- [ ] **Step 1: Update `supabase/seed.sql` with hashed passwords in `seed_accounts`**
  Generate `encrypted_password` using `extensions.crypt('123456', extensions.gen_salt('bf'))` for all seeded accounts in `auth.users`.
  Ensure `admin@codeleet.test` is provisioned with UUID `91000000-0000-4000-8000-000000000016` and has role `'admin'` in `public.user_roles`.

- [ ] **Step 2: Run seed script to verify auth insertion**
  Run: `pnpm exec supabase db query --local --file supabase/seed.sql`
  Expected: Successful execution without SQL errors.

- [ ] **Step 3: Verify password hash and role assignments in database**
  Run: `pnpm exec supabase db query --local --query "select u.email, r.role, length(u.encrypted_password) > 0 as has_pass from auth.users u join public.user_roles r on r.user_id = u.id where u.email in ('admin@codeleet.test', 'instructor1@codeleet.test', 'student01@codeleet.test')"`
  Expected: All accounts show `has_pass = true`, with roles `'admin'`, `'instructor'`, and `'student'`.

---

### Task 2: Seed 3 Active Course Workspaces, Features, and Memberships

**Files:**
- Modify: `supabase/seed.sql`

**Interfaces:**
- Consumes: `public.courses`, `public.course_features`, `public.course_memberships`
- Produces: 3 active courses (`CS101`, `CS102`, `CS201`) with enabled features and enrolled students/instructors.

- [ ] **Step 1: Define course records and feature mappings in `supabase/seed.sql`**
  Insert 3 active courses:
  - `96000000-0000-4000-8000-000000000001`: "CS101: Introduction to Python Programming" (owner Instructor 1)
  - `96000000-0000-4000-8000-000000000002`: "CS102: Data Structures in Java" (owner Instructor 2)
  - `96000000-0000-4000-8000-000000000003`: "CS201: Algorithms & Problem Solving" (owner Instructor 3)
  Insert `course_features` for all 3 courses enabling `'assessments'`, `'ai'`, `'discussions'`, `'xp'`, and `'leaderboard'`.
  Insert `course_memberships` enrolling all 12 students and 3 instructors in all 3 courses.

- [ ] **Step 2: Run seed query and verify courses and memberships**
  Run: `pnpm exec supabase db query --local --query "select c.title, c.lifecycle, count(m.user_id) as members from public.courses c left join public.course_memberships m on m.course_id = c.id group by c.id, c.title, c.lifecycle order by c.title"`
  Expected: 3 active courses each with 15 members (12 students + 3 instructors) plus the archived Legacy course.

---

### Task 3: Seed Realistic LeetCode Easy Assignments, Practice Test Sets, and Rubrics

**Files:**
- Modify: `supabase/seed.sql`

**Interfaces:**
- Consumes: `public.assignments`, `public.assignment_rubrics`, `public.assignment_practice_sets`, `public.assignment_practice_drafts`
- Produces: 9 fleshed-out LeetCode assignments across the 3 courses with test sets and rubrics.

- [ ] **Step 1: Write assignment definitions with structured instructions**
  In `supabase/seed.sql`, seed:
  - Course 1 (Python):
    1. `92000000-0000-4000-8000-000000000001`: "Two Sum" (Python)
    2. `92000000-0000-4000-8000-000000000002`: "Valid Palindrome" (Python)
    3. `92000000-0000-4000-8000-000000000003`: "Best Time to Buy and Sell Stock" (Python)
  - Course 2 (Java):
    4. `92000000-0000-4000-8000-000000000004`: "Valid Parentheses" (Java)
    5. `92000000-0000-4000-8000-000000000005`: "Roman to Integer" (Java)
    6. `92000000-0000-4000-8000-000000000006`: "Binary Search" (Java)
  - Course 3 (Polyglot):
    7. `92000000-0000-4000-8000-000000000007`: "Palindrome Number" (Python)
    8. `92000000-0000-4000-8000-000000000008`: "Fizz Buzz" (Java)
    9. `92000000-0000-4000-8000-000000000009`: "Contains Duplicate" (Python)

- [ ] **Step 2: Seed realistic rubrics and practice test sets**
  For each assignment, seed:
  - Multi-criterion criteria in `public.assignment_rubrics` (Correctness 5 pts, Edge Cases 5 pts, Code Quality / Efficiency 5 pts).
  - 3–4 test cases in `public.assignment_practice_sets` and `public.assignment_practice_drafts` with exact stdin and expected stdout adhering to `public.valid_practice_cases`.

- [ ] **Step 3: Run seed and verify practice tests and rubrics validation**
  Run: `pnpm exec supabase db query --local --query "select a.title, a.language, c.title as course, jsonb_array_length(p.cases) as test_cases, jsonb_array_length(r.criteria) as rubric_criteria from public.assignments a join public.courses c on c.id = a.course_id join public.assignment_practice_sets p on p.assignment_id = a.id join public.assignment_rubrics r on r.assignment_id = a.id order by a.id"`
  Expected: 9 rows returned with 3-4 test cases and valid rubric criteria.

---

### Task 4: Seed Student Submissions, Grades, Leaderboard XP, and Course Discussions

**Files:**
- Modify: `supabase/seed.sql`

**Interfaces:**
- Consumes: `public.submissions`, `public.grades`, `public.forum_threads`, `public.forum_replies`
- Produces: Sample student submissions, instructor evaluations, XP records, and forum activity.

- [ ] **Step 1: Insert working code submissions and revisions in `supabase/seed.sql`**
  Seed student submissions for assignments using realistic Python and Java code reading stdin and printing stdout. Include multi-revision submissions (revision 1 vs revision 2).

- [ ] **Step 2: Insert grades with rubric scores and constructive feedback**
  Insert grades in `public.grades` linking to rubric criteria IDs, awarding XP to students for the leaderboard.

- [ ] **Step 3: Insert course-scoped forum discussions and replies**
  Insert relevant forum threads and replies in `public.forum_threads` and `public.forum_replies` for each of the 3 courses.

- [ ] **Step 4: Verify submissions, grades, and forum threads in database**
  Run: `pnpm exec supabase db query --local --query "select (select count(*) from public.submissions) as submissions, (select count(*) from public.grades) as grades, (select count(*) from public.forum_threads) as threads, (select count(*) from public.forum_replies) as replies"`
  Expected: Counts > 0 for all activity tables.

---

### Task 5: End-to-End Verification and Documentation

**Files:**
- Modify: `supabase/README.md`

- [ ] **Step 1: Execute full database reset and seed**
  Run: `pnpm db:seed`
  Expected: Clean reset and successful execution of `supabase/seed.sql`.

- [ ] **Step 2: Run database tests to verify constraints and RLS policies**
  Run: `pnpm db:test`
  Expected: pgTAP tests pass.

- [ ] **Step 3: Run application unit and integration tests**
  Run: `pnpm test:unit`
  Expected: All unit tests pass with zero regressions.

- [ ] **Step 4: Update `supabase/README.md`**
  Document the standard login password (`123456`), the admin account (`admin@codeleet.test`), the 3 active courses, and sample problem fixtures.

