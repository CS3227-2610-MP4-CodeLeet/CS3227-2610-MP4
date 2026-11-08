# Assignment Test Cases, Instructor Submissions View, and Rubric Grading UX Design

- **Date**: 2026-11-08
- **Author**: John (Pair Programming with Antigravity)
- **Status**: Pending Human Approval
- **Topic**: Merging test case authoring with public/private toggles into assignments, expanding test case limit to 25, adding dedicated instructor submissions view and sidebar navigation, enhancing student grade rubric breakdown, and fixing instructor submission review test runner.

---

## 1. Intent and Why

CodeLeet currently has several usability and structural pain points around assignment management, submission grading, and test case execution:

1. **Confusing Student Grade Presentation**: When an instructor publishes a grade, the student view displays raw criterion database UUIDs alongside numeric scores (e.g. `93000000-0000-4000-8000-000000000026: 5`) instead of human-readable criteria titles and maximum scores (`Correctness: 3/5`).
2. **Fragmented Instructor Submissions Navigation**: Instructors must navigate to the Assignments list and click into each assignment individually to see student submissions. There is no top-level "Submissions" link in the instructor sidebar or consolidated submissions dashboard across the course.
3. **Disjointed Test Case Authoring**: Test cases are managed on an isolated page (`/practice-tests`) separate from the assignment edit page, using a clunky bulk publish/unpublish workflow. Instructors cannot easily configure sample vs. hidden test cases.
4. **Overly Restrictive 5-Case Limit**: Test cases are capped at 5 in database constraints and Zod contracts, which is insufficient for meaningful automated edge case verification.
5. **Instructor Review Submission Bug**: In the instructor "Review submission" page, `PracticeRunner` is passed `cases={[]}` hardcoded and test cases are never queried from the database, displaying "No published test cases" and preventing instructors from verifying student submissions against the test suite.

This design unifies test case authoring into the main assignment workflow, introduces per-test public/private visibility, adds a central instructor submissions dashboard, enriches student grade reports, and fixes submission review test execution.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
- **Student Rubric Breakdown**: Display criteria title, score, and max score (e.g., `Correctness: 3/5`) in the student submission view for published grades, preserving rubric privacy for unpublished assignments/grades.
- **Dedicated Instructor Submissions View**:
  - Route: `/courses/[courseId]/instructor/submissions`.
  - Sidebar: Add a `Submissions` navigation item in `CourseSidebar` for instructors.
  - Features: Assignment filter dropdown ("All assignments" + specific assignments), submission list with student info, revision number, submission time, late status badges, and grading status (`Graded: X/Y` vs `Needs review`), with direct "Review" links.
- **Unified Test Case Authoring with Public/Private Toggles**:
  - Integrate test case management directly into `AssignmentForm` (`new` and `edit`).
  - Add an `is_public` toggle (or switch/checkbox) per test case:
    - **Public**: Visible to students in the course to test their code in the browser runner before submitting.
    - **Private**: Hidden from students, reserved for instructor evaluation.
  - Remove separate "publish/unpublish tests" step; test cases are saved and published in sync with the assignment.
- **Expand Test Case Ceiling to 25**:
  - Update database validation (`public.valid_practice_cases`), Zod contracts, and UI to allow up to 25 test cases.
- **Fix Review Submission Runner**:
  - Query assignment test cases (both public and private) on the instructor submission review page.
  - Pass all cases to `PracticeRunner` with visual badges distinguishing `[Public]` and `[Private]` cases, allowing instructors to execute all cases against the student's submission.

### Non-Goals
- Remote or server-side code execution (browser-only Python/Pyodide and Java execution remains strictly enforced).
- AI autograding or automated publishing of grades without instructor intervention.
- Uncapped / infinite test cases beyond 25.

### Anti-Goals
- Do not expose private test cases or unpublished rubrics to student API endpoints or client bundles.
- Do not disrupt existing assignments or erase historical test cases.
- Do not require instructors to make multiple separate network requests or page visits to save an assignment and its test suite.

---

## 3. Approaches Considered

### Approach 1: Unified Assignment & Test Suite with In-Place Schema Evolution (Selected)
- **Concept**:
  - Add `is_public: boolean` (default `true`) to the test case schema.
  - Update `public.valid_practice_cases` in PostgreSQL to allow up to 25 items and permit `is_public`.
  - Embed test case fields into `AssignmentForm`, saving cases alongside rubric criteria and metadata.
  - Filter `is_public = true` cases for student queries (`loadPublicCases`); return all cases for instructor queries.
  - Add `/courses/[courseId]/instructor/submissions` with assignment filtering and update `CourseSidebar`.
  - Securely map published rubric criteria in the student submission view.
- **Trade-offs**: Cohesive, minimal schema churn, backwards-compatible, eliminates disjoint authoring states.

### Approach 2: Relational Normalization (New `assignment_test_cases` table) (Rejected)
- **Concept**: Deconstruct test cases from JSONB into a separate normalized table `assignment_test_cases(id, assignment_id, name, stdin, expected_stdout, is_public)`.
- **Trade-offs**: Over-engineers a simple list representation, requires multi-table transactional migrations, breaks existing RPCs, and introduces multiple database roundtrips for every assignment load.

---

## 4. Detailed Specification

### 4.1. Database Migration: `valid_practice_cases` & Storage Architecture
Create migration `supabase/migrations/20261108150000_expand_test_cases_and_visibility.sql`:
1. **Update `public.valid_practice_cases(p_cases jsonb)`**:
   - Change `if jsonb_array_length(p_cases) > 5 then return false; end if;` to `> 25`.
   - Update object key count and property validation to accept optional `is_public` (boolean):
     - Keys allowed: `id`, `name`, `stdin`, `expected_stdout`, and optional `is_public`.
     - Count of keys must be 4 (without `is_public`) or 5 (with `is_public`).
     - If `is_public` is present, `jsonb_typeof(item->'is_public') = 'boolean'`.
2. **Atomic Assignment & Test Case Persistence (`save_course_assignment`)**:
   - Update `public.save_course_assignment` to accept `p_cases jsonb default null`.
   - Inside the transaction:
     - Validates test cases using `valid_practice_cases(p_cases)`.
     - Persists all authored test cases (both public and private) to `assignment_practice_drafts`.
     - When the assignment is published (`p_publication_status = 'published'`), filters `p_cases` to extract only cases where `coalesce((case->>'is_public')::boolean, true) = true`, and writes them to `assignment_practice_sets`.
     - *Security guarantee*: Students only have `SELECT` on `assignment_practice_sets`, which contains strictly public cases. Private test cases never enter `assignment_practice_sets`, preventing any client-side RLS data leak.
3. **Student Rubric Criteria Breakdown RPC**:
   - Provide `public.get_published_submission_grade(p_submission_id uuid)`:
     - Validates caller is the submission owner (`student_id = auth.uid()`) and the grade is published (`published_at is not null`).
     - Returns `total_score`, `feedback`, `published_at`, and `criteria`: array of `{ id, title, description, maxScore, score }` joining `assignment_rubrics.criteria` with `grades.scores`.

### 4.2. Zod Contracts & Schemas
In `src/features/practice-test-authoring/contracts.ts`:
- Update `practiceCaseSchema`:
  ```ts
  export const practiceCaseSchema = z
    .object({
      id: z.uuid(),
      name: z.string().trim().min(1).max(120),
      stdin: literal(4096),
      expected_stdout: literal(8192),
      is_public: z.boolean().default(true),
    })
    .strict();
  ```
- Update `caseSetSchema`:
  - Increase `.max(5)` to `.max(25)`.
- In `src/features/student-submissions/practice-tests.ts`:
  - Update `validatePracticeCases` limit from `cases.length > 5` to `cases.length > 25`.

### 4.3. Unified Assignment Form (`AssignmentForm`)
In `src/features/codementor/assignment-form.tsx`:
- Add test case state and UI section:
  - Each test case card features:
    - Test Case Name input
    - Public / Private switch or toggle with helper text ("Public cases are visible to students for practice; private cases are hidden for instructor review")
    - Stdin textarea (up to 4,096 bytes)
    - Expected Stdout textarea (up to 8,192 bytes)
    - Remove button (with confirmation if populated)
  - "Add test case" button, disabled when test case count reaches 25.
- Update `AssignmentForm` payload:
  - Submit `cases: AuthoredCase[]` alongside `rubric: Criterion[]`.
  - In `src/app/api/assignments/route.ts` and `[id]/route.ts`, pass `cases` to `save_course_assignment`.
- Deprecate or redirect `/courses/[courseId]/instructor/assignments/[assignmentId]/practice-tests` directly to the edit page with an anchor (`#test-cases`).

### 4.4. Student Submission Grade View
In `src/app/courses/[courseId]/submissions/[submissionId]/page.tsx`:
- Use `get_published_submission_grade` to resolve criteria titles and max scores securely.
- Replace the raw UUID loop:
  ```tsx
  {grade.criteria.map((c) => (
    <div key={c.id} className="flex justify-between items-center py-1 border-b last:border-0">
      <span className="font-medium text-sm">{c.title}</span>
      <span className="text-sm font-semibold">{c.score} / {c.maxScore}</span>
    </div>
  ))}
  ```
- Render a clear summary card with total score, feedback, and criterion breakdown.

### 4.5. Instructor Submissions Dashboard & Sidebar
1. **Sidebar Navigation**:
   - In `src/components/layout/course-sidebar.tsx`:
     - In `getInstructorNavItems`, add:
       ```ts
       {
         label: 'Submissions',
         href: `/courses/${courseId}/instructor/submissions`,
         enabled: hasAssessments,
         icon: () => <ClockIcon />,
       }
       ```
2. **Submissions Page**:
   - `src/app/courses/[courseId]/instructor/submissions/page.tsx`:
     - Loads course submissions joined with assignments and grades.
     - Resolves student display names in memory using existing `list_course_members(courseId)` RPC, avoiding any RLS bypass or profile leakage.
     - Filter bar: Dropdown to filter by assignment (all assignments vs. specific assignment).
     - Filter toggle: "Latest revisions only" (default) vs "All revisions", avoiding clutter from superseded drafts.
     - Table / cards:
       - Assignment title
       - Student display name / username
       - Revision number
       - Submitted at time + Late status badge
       - Grade status badge:
         - `Graded: <score>/<max>` (Green)
         - `Needs review` / `Ungraded` (Amber)
       - Action: "Review" link to `/courses/[courseId]/instructor/submissions/[submissionId]`.

### 4.6. Fix Instructor Review Submission Test Runner
In `src/app/courses/[courseId]/instructor/submissions/[submissionId]/page.tsx`:
- Fetch assignment test cases using `loadOwnerCases(supabase, submission.assignment_id)`.
- Pass the loaded cases to `SubmissionCodeRunner`:
  - Differentiate cases with a badge: `[Public]` vs `[Private]`.
  - Allow the instructor to click "Run all tests" to execute the entire suite against the student's submission in the browser runner.

---

## 5. Verification & Testing Plan

1. **Database & Migrations**:
   - Run `pnpm supabase db reset` or apply migration locally.
   - Verify `valid_practice_cases` accepts up to 25 cases with/without `is_public`.
   - Verify `valid_practice_cases` rejects 26 cases or malformed keys.
2. **Contracts & Unit Tests**:
   - Update `src/features/practice-test-authoring/contracts.test.ts` to test 25 cases and `is_public` boolean.
   - Update `src/features/student-submissions/practice-tests.test.ts` for the 25-case limit.
3. **Component & Integration Tests**:
   - `assignment-form.test.tsx`: Test adding/removing test cases, toggling public/private, and submitting payload.
   - `course-sidebar.test.tsx`: Verify the new "Submissions" link renders for instructors and highlights when active.
   - Student submission page test: Verify criteria titles and maxScores render cleanly instead of UUIDs.
   - Instructor submissions page test: Verify course-wide submissions display, filtering by assignment works, and review links route correctly.
   - Review submission page test: Verify test cases are loaded and passed to `PracticeRunner`.
4. **End-to-End / Regression**:
   - Run `pnpm lint`, `pnpm typecheck`, and `pnpm test`.
   - Verify zero regressions across the test suite.
