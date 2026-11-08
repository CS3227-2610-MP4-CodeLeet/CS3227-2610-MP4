# Assignment Test Cases, Instructor Submissions View, and Rubric Grading UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify assignment test case authoring with per-case public/private toggles and a 25-case limit into the assignment form, add a dedicated instructor submissions dashboard and sidebar navigation, enhance student published grade reports with human-readable rubric criteria scores (e.g. `Correctness: 3/5`), and fix test runner execution on the instructor submission review page.

**Architecture:** A new database migration raises the test case ceiling from 5 to 25 in `valid_practice_cases` and updates `save_course_assignment` to atomically persist test cases, separating public cases into `assignment_practice_sets` and all authored cases into `assignment_practice_drafts`. Zod schemas and `AssignmentForm` are updated to support public/private test case editing directly in assignment creation and editing. A dedicated `/courses/[courseId]/instructor/submissions` view is created with assignment filtering and student display name resolution, while student submission views use a secure RPC to display criterion titles and maximum scores.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, PostgreSQL (Supabase), Zod, Tailwind CSS, Lucide icons, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-08-assignment-test-cases-and-submissions-design.md`

## Global Constraints

- Test cases ceiling is strictly 25 (raised from 5).
- Browser-only Python (Pyodide) and Java execution must be preserved; no remote execution services.
- Students must never be able to access private test cases or unpublished rubrics via API or database RLS.
- Assignments, rubrics, and test cases must be saved together atomically via database RPC.
- Submissions dashboard must default to each student's latest submission revision with a toggle to view all revisions.
- Zero regression policy across unit, integration, and e2e test suites.

## Review Focus

1. **Private Test Case RLS Security:** A student queries `assignment_practice_sets` or `/api/student/assignments/[id]/test-cases` -> Only test cases where `is_public === true` are returned; private test cases are completely omitted.
2. **Atomic Persistence with 0 or 25 Test Cases:** Saving an assignment with 0 test cases or up to 25 test cases succeeds without error, and saving 26 test cases is rejected with a 400 Bad Request.
3. **Student Grade Breakdown Security:** A student viewing their published grade sees criteria titles and `score / maxScore` (e.g. `Correctness: 3/5`), but a student viewing an uncompleted or ungraded assignment cannot access the rubric criteria.
4. **Submissions Dashboard Revision Filtering:** In `/courses/[courseId]/instructor/submissions`, when a student submits revision 1 and revision 2, the default view lists only revision 2 as "Needs review", without duplicate rows for revision 1 unless "All revisions" is toggled.
5. **Review Submission Test Runner Execution:** On `/courses/[courseId]/instructor/submissions/[submissionId]`, both public and private test cases are displayed with badges, and clicking "Run all tests" executes the suite against the student's submission.

---

### Task 1: Database Migration for 25 Test Cases, Visibility, and Atomic Saves

**Files:**
- Create: `supabase/migrations/20261108150000_expand_test_cases_and_visibility.sql`
- Create: `supabase/tests/database/test_cases_expansion.test.sql`

**Interfaces:**
- Produces:
  - `public.valid_practice_cases(p_cases jsonb) RETURNS boolean`: Validates up to 25 cases, accepting keys `id`, `name`, `stdin`, `expected_stdout`, and optional boolean `is_public`.
  - `public.save_course_assignment(...)`: Accepts `p_cases jsonb default null`, saves all cases to `assignment_practice_drafts`, and writes filtered public cases (`is_public = true`) to `assignment_practice_sets` when publishing.
  - `public.get_published_submission_grade(p_submission_id uuid)`: Security definer RPC returning `{ total_score, feedback, published_at, criteria: [...] }`.

- [ ] **Step 1: Write database test asserting 25 cases allowed and 26 rejected**

```sql
-- supabase/tests/database/test_cases_expansion.test.sql
begin;
select plan(5);

-- 25 cases accepted
select ok(public.valid_practice_cases((
  select jsonb_agg(jsonb_build_object(
    'id', gen_random_uuid(),
    'name', 'Case ' || i,
    'stdin', '',
    'expected_stdout', '',
    'is_public', i % 2 = 0
  )) from generate_series(1, 25) i
)), '25 test cases with is_public boolean are accepted');

-- 26 cases rejected
select ok(not public.valid_practice_cases((
  select jsonb_agg(jsonb_build_object(
    'id', gen_random_uuid(),
    'name', 'Case ' || i,
    'stdin', '',
    'expected_stdout', ''
  )) from generate_series(1, 26) i
)), '26 test cases are rejected');

-- is_public non-boolean rejected
select ok(not public.valid_practice_cases(jsonb_build_array(
  jsonb_build_object('id', gen_random_uuid(), 'name', 'Bad', 'stdin', '', 'expected_stdout', '', 'is_public', 'yes')
)), 'Non-boolean is_public is rejected');

select * from finish();
rollback;
```

- [ ] **Step 2: Create migration `supabase/migrations/20261108150000_expand_test_cases_and_visibility.sql`**

Update `valid_practice_cases` to check `jsonb_array_length(p_cases) > 25`, validate optional `is_public` boolean, update `save_course_assignment`, and add `get_published_submission_grade`.

- [ ] **Step 3: Run migration tests to verify they pass**

Run: `pnpm exec supabase test db supabase/tests/database/test_cases_expansion.test.sql`
Expected: 5/5 assertions pass.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20261108150000_expand_test_cases_and_visibility.sql supabase/tests/database/test_cases_expansion.test.sql
git commit -m "feat(db): expand test case ceiling to 25 and add is_public visibility"
```

---

### Task 2: Update Zod Contracts, Client Validation, and Tests

**Files:**
- Modify: `src/features/practice-test-authoring/contracts.ts`
- Modify: `src/features/practice-test-authoring/contracts.test.ts`
- Modify: `src/features/student-submissions/practice-tests.ts`
- Modify: `src/features/student-submissions/practice-tests.test.ts`
- Modify: `src/features/codementor/contracts.ts`

**Interfaces:**
- Consumes: Zod
- Produces:
  - `practiceCaseSchema`: extends with `is_public: z.boolean().default(true)`
  - `caseSetSchema`: `.max(25)`
  - `validateCases(cases)`: validates `cases.length <= 25`
  - `assignmentInputSchema`: includes optional `cases: caseSetSchema`

- [ ] **Step 1: Write failing test in `contracts.test.ts` and `practice-tests.test.ts`**

Assert that a set of 25 cases with `is_public: true` / `false` is accepted by `caseSetSchema` and `validateCases`, and 26 cases throw validation errors.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/features/practice-test-authoring/contracts.test.ts`
Expected: FAIL on 25-case limit.

- [ ] **Step 3: Update `contracts.ts`, `practice-tests.ts`, and `codementor/contracts.ts`**

Update schemas to allow up to 25 cases with `is_public: boolean`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/features/practice-test-authoring/contracts.test.ts src/features/student-submissions/practice-tests.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/practice-test-authoring/contracts.ts src/features/practice-test-authoring/contracts.test.ts src/features/student-submissions/practice-tests.ts src/features/student-submissions/practice-tests.test.ts src/features/codementor/contracts.ts
git commit -m "feat(contracts): support 25 test cases and is_public flag"
```

---

### Task 3: Student Published Grade Breakdown (Criteria Titles & Max Scores)

**Files:**
- Modify: `src/app/courses/[courseId]/submissions/[submissionId]/page.tsx`
- Modify: `src/app/courses/[courseId]/submissions/[submissionId]/page.test.tsx`

**Interfaces:**
- Consumes: `get_published_submission_grade` RPC or server-side grade resolution
- Produces: Formatted criterion breakdown `{ title, score, maxScore, description }`

- [ ] **Step 1: Write failing test in `page.test.tsx`**

Test that a submission with a published grade displays "Correctness: 5 / 10" rather than the raw criterion UUID.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/app/courses/[courseId]/submissions/[submissionId]/page.test.tsx`
Expected: FAIL (displays raw UUID).

- [ ] **Step 3: Implement published rubric breakdown rendering**

In `CourseSubmissionPage`, load published grade with criteria details via `get_published_submission_grade(submissionId)` or join. Render formatted cards displaying criterion title, score, maxScore, and feedback.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/app/courses/[courseId]/submissions/[submissionId]/page.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/courses/[courseId]/submissions/[submissionId]/page.tsx src/app/courses/[courseId]/submissions/[submissionId]/page.test.tsx
git commit -m "feat(submissions): display rubric criteria titles and max scores on student grade view"
```

---

### Task 4: Instructor Submissions Dashboard and Sidebar Link

**Files:**
- Modify: `src/components/layout/course-sidebar.tsx`
- Modify: `src/components/layout/course-sidebar.test.tsx`
- Create: `src/app/courses/[courseId]/instructor/submissions/page.tsx`
- Create: `src/app/courses/[courseId]/instructor/submissions/page.test.tsx`

**Interfaces:**
- Consumes: `requireMember()`, `readCourseAccess()`, `list_course_members()`, `submissions` table, `grades` table
- Produces:
  - Sidebar link to `/courses/[courseId]/instructor/submissions`
  - Submissions dashboard with assignment filtering, "Latest revisions only" toggle, student name resolution, and "Review" buttons.

- [ ] **Step 1: Write failing test for sidebar link in `course-sidebar.test.tsx`**

Verify that `CourseSidebar` renders "Submissions" link pointing to `/courses/course-123/instructor/submissions` when user is an instructor.

- [ ] **Step 2: Update `course-sidebar.tsx` to add "Submissions" nav item**

In `getInstructorNavItems`, add the `Submissions` item with `ClockIcon` or `ClipboardIcon`.

- [ ] **Step 3: Create `src/app/courses/[courseId]/instructor/submissions/page.tsx` and test**

Write test verifying:
1. Lists course submissions with assignment title, student name (resolved from `list_course_members`), revision, and status.
2. Assignment filter dropdown filters rows.
3. Review button links to `/courses/[courseId]/instructor/submissions/[submissionId]`.

Implement the server component in `page.tsx`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run src/components/layout/course-sidebar.test.tsx src/app/courses/[courseId]/instructor/submissions/page.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/course-sidebar.tsx src/components/layout/course-sidebar.test.tsx src/app/courses/[courseId]/instructor/submissions/page.tsx src/app/courses/[courseId]/instructor/submissions/page.test.tsx
git commit -m "feat(instructor): add dedicated course submissions page and sidebar navigation"
```

---

### Task 5: Unified Test Case Authoring in `AssignmentForm`

**Files:**
- Modify: `src/features/codementor/assignment-form.tsx`
- Modify: `src/features/codementor/assignment-form.test.tsx`
- Modify: `src/app/courses/[courseId]/instructor/assignments/[assignmentId]/edit/page.tsx`
- Modify: `src/app/api/assignments/route.ts`
- Modify: `src/app/api/assignments/[id]/route.ts`

**Interfaces:**
- Consumes: `AuthoredCase`, `save_course_assignment`
- Produces: Integrated test case editor within `AssignmentForm` with name, stdin, expected stdout, and public/private toggle.

- [ ] **Step 1: Write failing test in `assignment-form.test.tsx`**

Verify that adding a test case, toggling it to private (`is_public = false`), and submitting includes the test case array in the payload sent to `/api/assignments`.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/features/codementor/assignment-form.test.tsx`
Expected: FAIL (no test cases section in form).

- [ ] **Step 3: Implement test case authoring in `assignment-form.tsx`**

1. Add `cases: AuthoredCase[]` state (up to 25 cases).
2. Render test case cards with Name, Public/Private switch, Stdin, Expected Stdout, and Delete button.
3. Update `EditAssignmentPage` to load initial cases from `loadOwnerCases` and pass to `AssignmentForm`.
4. Update API routes to forward `cases` to `save_course_assignment`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/features/codementor/assignment-form.test.tsx src/app/api/assignments/route.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/codementor/assignment-form.tsx src/features/codementor/assignment-form.test.tsx src/app/courses/[courseId]/instructor/assignments/[assignmentId]/edit/page.tsx src/app/api/assignments/route.ts src/app/api/assignments/[id]/route.ts
git commit -m "feat(assignments): embed test case authoring with public/private toggle into assignment form"
```

---

### Task 6: Fix Instructor Review Submission Test Runner

**Files:**
- Modify: `src/app/courses/[courseId]/instructor/submissions/[submissionId]/page.tsx`
- Modify: `src/app/courses/[courseId]/instructor/submissions/[submissionId]/page.test.tsx`
- Modify: `src/features/student-submissions/practice-results.tsx`

**Interfaces:**
- Consumes: `loadOwnerCases(supabase, assignment_id)`
- Produces: Test runner on review page with both public and private test cases, labeled with `[Public]` and `[Private]` badges.

- [ ] **Step 1: Write failing test in `instructor/submissions/[submissionId]/page.test.tsx`**

Verify that the review page loads the assignment test cases and renders them with public/private status badges instead of "No published test cases".

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/app/courses/[courseId]/instructor/submissions/[submissionId]/page.test.tsx`
Expected: FAIL (passes `cases={[]}`).

- [ ] **Step 3: Implement test case loading and runner in review page**

1. Call `loadOwnerCases(supabase, submission.assignment_id)` in `CourseInstructorSubmissionPage`.
2. Pass the loaded test cases to `SubmissionCodeRunner`.
3. Update `practice-results.tsx` to render `[Public]` / `[Private]` badge next to each test case name.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/app/courses/[courseId]/instructor/submissions/[submissionId]/page.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/courses/[courseId]/instructor/submissions/[submissionId]/page.tsx src/app/courses/[courseId]/instructor/submissions/[submissionId]/page.test.tsx src/features/student-submissions/practice-results.tsx
git commit -m "fix(review): load and run public and private test cases on instructor review page"
```

---

### Task 7: Full Suite Verification & Route Cleanups

**Files:**
- Modify: `src/app/courses/[courseId]/instructor/assignments/[assignmentId]/practice-tests/page.tsx` (redirect or link to edit page)
- Verify: Full test suite

- [ ] **Step 1: Redirect standalone `/practice-tests` page to edit page**

Update `practice-tests/page.tsx` to redirect or link directly to `/courses/${courseId}/instructor/assignments/${assignmentId}/edit#test-cases`.

- [ ] **Step 2: Run full test and typecheck suite**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: Zero errors, zero regressions.

- [ ] **Step 3: Commit**

```bash
git add src/app/courses/[courseId]/instructor/assignments/[assignmentId]/practice-tests/page.tsx
git commit -m "chore: redirect standalone practice-tests page to assignment edit form"
```
