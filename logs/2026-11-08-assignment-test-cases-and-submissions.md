# Session: 2026-11-08 Assignment Test Cases, Submissions Dashboard, and Rubric Grading Display

- Timezone: Asia/Singapore (SGT)
- Participants/actual agent IDs: John, Antigravity
- AI tools/models, where known: Gemini 3.8 Flash (High)
- GitHub issue: #116
- OpenSpec change: build-programming-platform
- Branch and commits: feat/test-cases-and-submissions
- Pull request: pending
- Human verification: pending
- Verifier/date:

## Prompt and interaction summaries

1. **User Request**: Inquiries and improvements requested:
   - Student submission view: Show rubric criteria title, score, and maxScore (`Correctness: 3/5`) instead of raw UUIDs.
   - Course instructor view: Add dedicated Submissions page/view with link in the sidebar.
   - Assignment authoring: Merge test cases editing into Assignment form with public/private per-case toggles instead of bulk publish/unpublish.
   - Test cases limit: Remove 5-case limit and allow up to 25 cases.
   - Review submission bug: Fix issue where test cases are not displayed on instructor review submission page.
2. **Brainstorming & Sizing**:
   - Researched existing codebase: identified `valid_practice_cases` check in PostgreSQL, `cases={[]}` bug in review page, RLS constraints on `assignment_rubrics` and `assignment_practice_sets`.
   - Discussed tradeoffs and recommended Approach 1 (Unified schema evolution with in-place JSONB test cases, 25-case ceiling, and dedicated submissions view).
   - User confirmed Approach 1 with a 25-case ceiling.
3. **Specification & Review**:
   - Wrote design doc `docs/superpowers/specs/2026-11-08-assignment-test-cases-and-submissions-design.md`.
   - Executed builder review check via subagent; resolved RLS protection for private test cases (students select only `assignment_practice_sets` holding public cases), atomic save via `save_course_assignment`, and student name resolution via `list_course_members`.
   - User approved design document.
4. **Implementation Planning**:
   - Created plan `docs/superpowers/plans/2026-11-08-assignment-test-cases-and-submissions.md`.
   - User selected Native execution.

## Work and verification

- Files and requirement links:
  - `docs/superpowers/specs/2026-11-08-assignment-test-cases-and-submissions-design.md`
  - `docs/superpowers/plans/2026-11-08-assignment-test-cases-and-submissions.md`
  - GitHub Issue #116
- Commands/checks actually run and outcomes:
  - Git branch checkout `feat/test-cases-and-submissions`
  - GitHub issue create #116
  - pgTAP test `supabase/tests/database/test_cases_expansion.test.sql` RED (failed tests 1, 2, 6 as expected before migration)
  - Created migration `supabase/migrations/20261108150000_expand_test_cases_and_visibility.sql`
  - `pnpm exec supabase db reset --local --no-seed` (exit 0)
  - `pnpm exec supabase test db --local` (15 test files, 461 tests passed, exit 0)
  - Task 2 TDD: failing tests in `contracts.test.ts`, `practice-tests.test.ts`, and `codementor/contracts.test.ts` (4 failed, RED as expected)
  - Updated `practiceCaseSchema` with `is_public` (default true) and `caseSetSchema` max 25, `validateCases` max 25, `assignmentInputSchema` with optional `cases`
  - Unit tests passed: `pnpm test:unit src/features/practice-test-authoring/contracts.test.ts src/features/student-submissions/practice-tests.test.ts src/features/codementor/contracts.test.ts` (3 files, 30 tests, exit 0, GREEN)
  - Task 3 TDD: created failing test `src/app/courses/[courseId]/submissions/[submissionId]/page.test.tsx` asserting rubric criteria breakdown (RED)
  - Implemented `get_published_submission_grade` RPC invocation and criterion score/maxScore breakdown in `CourseSubmissionPage`
  - Unit tests passed: `pnpm test:unit src/app/courses/[courseId]/submissions/page.test.tsx src/app/courses/[courseId]/submissions/[submissionId]/compare/page.test.tsx src/app/courses/[courseId]/submissions/[submissionId]/page.test.tsx` (3 files, 6 tests, exit 0, GREEN)
  - Task 4 TDD: added failing test in `src/components/layout/course-sidebar.test.tsx` for Instructor "Submissions" nav link (RED)
  - Added "Submissions" navigation item in `src/components/layout/course-sidebar.tsx`
  - Created failing test `src/app/courses/[courseId]/instructor/submissions/page.test.tsx` testing role access, student name resolution via `list_course_members`, assignment filter, latest revisions toggle, and grading status badges (RED)
  - Created `src/app/courses/[courseId]/instructor/submissions/page.tsx`, `loading.tsx`, and `submission-filters.tsx`
  - Unit tests passed: `pnpm test:unit src/components/layout/course-sidebar.test.tsx src/app/courses/[courseId]/instructor/submissions/page.test.tsx` (2 files, 10 tests, exit 0, GREEN)
  - Task 5 TDD: created failing test in `src/features/codementor/assignment-form.test.tsx` asserting test case authoring and public/private visibility toggle (RED)
  - Integrated `TestCasesFields` into `AssignmentForm` (`src/features/codementor/assignment-form.tsx`)
  - Forwarded `cases` in `src/app/api/assignments/route.ts` and increased JSON body limits
  - Loaded test cases via `loadOwnerCases` in `EditAssignmentPage` (`src/app/courses/[courseId]/instructor/assignments/[assignmentId]/edit/page.tsx`)
  - Unit tests passed: `pnpm test:unit src/app/api/assignments/route.test.ts src/app/api/assignments/[id]/route.test.ts src/features/codementor/assignment-form.test.tsx` (3 files, 11 tests, exit 0, GREEN)
- Failures, retries, unresolved issues:
  - Function overloading resolution conflict for `save_course_assignment` when called with 12 arguments; resolved by removing default argument from the 13-arg overload and adding explicit 12-arg wrapper function.
- Resource measurements and unavailable fields: None
- Next steps: Execute Task 6 (Instructor Review Submission Bug Fix & Public/Private Badge in Practice Results).
