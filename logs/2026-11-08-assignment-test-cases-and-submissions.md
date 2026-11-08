# Session: 2026-11-08 Assignment Test Cases, Submissions Dashboard, and Rubric Grading Display

- Timezone: Asia/Singapore (SGT)
- Participants/actual agent IDs: John, Antigravity
- AI tools/models, where known: Gemini 3.8 Flash (High)
- GitHub issue: #116
- OpenSpec change: build-programming-platform
- Branch and commits: feat/test-cases-and-submissions
- Pull request: #118
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
  - Task 6 TDD: created failing tests in `practice-results.test.tsx` (asserting `[Public]` / `[Private]` badges and total count) and `instructor/submissions/[submissionId]/page.test.tsx` (asserting test cases loaded from `loadOwnerCases` and passed to `PracticeRunner`) (RED)
  - Updated `CaseHeading` and `CaseSummary` in `src/features/student-submissions/practice-results.tsx` to display Public and Private badges
  - Fixed `cases={[]}` bug in `src/app/courses/[courseId]/instructor/submissions/[submissionId]/page.tsx` by querying `loadOwnerCases(supabase, submission.assignment_id)` and passing cases to `SubmissionCodeRunner`
  - Unit tests passed: `pnpm test:unit src/app/courses/[courseId]/instructor/submissions/[submissionId]/page.test.tsx src/features/student-submissions/practice-results.test.tsx` (2 files, 6 tests, exit 0, GREEN)
  - Task 7: Redirected standalone practice tests URL to assignment edit page; updated instructor assignment list links to point directly to dedicated Submissions dashboard; verified test suites:
    - `src/app/courses/[courseId]/instructor/assignments/[assignmentId]/practice-tests/page.test.tsx` (PASS)
    - `pnpm exec supabase test db --local` (15 files, 461 tests, ALL PASS)
    - `pnpm typecheck` (exit 0)
    - `pnpm lint` (exit 0, 0 errors, 0 warnings)
    - `pnpm test:unit` (162 test files, 823 tests, ALL PASS)
  - PR #118 Review Comments & CI Resolution:
    - Fixed Prettier code style via `pnpm format` across 10 files to resolve the `application` CI check (`pnpm format:check`).
    - Comment 1 (4505462153): Updated `save_practice_tests` to filter out private cases (`(elem->>'is_public')::boolean is not false`) when inserting into `assignment_practice_sets` on publish.
    - Comment 2 (4505462157): Removed `.catch(() => null)` from `loadOwnerCases` in `edit/page.tsx` so failures throw cleanly and do not overwrite authored test cases with an empty array.
    - Comment 3 (4505462158): Added `rubric_snapshot` column to `public.grades`, updated `save_grade` to snapshot rubric criteria upon publication, and updated `get_published_submission_grade` to use the snapshot and preserve all scored keys.
    - Comment 4 (4505462161): Queried `assignment_rubrics(criteria)` in instructor submissions dashboard and updated `GradeBadge` to show actual rubric maximum points rather than `max_xp`.
    - Comment 5 (4505462164): Validated `currentAssignmentId` against course `assignmentMap` in instructor submissions dashboard, falling back safely to `'all'` on invalid or cross-course IDs.
    - Verified all 15 database pgTAP test files (463 tests, ALL PASS).
    - Verified `pnpm typecheck`, `pnpm lint`, and `pnpm format:check` (ALL PASS).
    - Removed redundant "+ New assignment" button from the course instructor sidebar (`course-sidebar.tsx`), keeping sidebar strictly navigational while preserving the primary "New assignment" action on the instructor Assignments page. Verified `course-sidebar.test.tsx` (7 tests, ALL PASS).
  - Second Review Comments Resolution:
    - Comment A (4505714437): Selected `rubric_snapshot` on submissions query in instructor dashboard and calculated grade denominator from the historical snapshot when published.
    - Comment B (4505714439): Removed `.catch(() => null)` from `loadOwnerCases` in instructor review submission page to surface query/parse failures rather than rendering zero test cases.
    - Comment C (4505714442): Checked `assignmentsResult.error` in instructor submissions dashboard and threw on failure rather than rendering an empty dashboard.
    - Verified all unit tests, format, lint, and typecheck (ALL PASS).
    - Pushed commit `84872a4` to `feat/test-cases-and-submissions`.
    - Posted in-thread replies to comments 4505714437, 4505714439, and 4505714442 via GitHub API and resolved all 8 review threads on PR #118.
    - Verified CI runs for commit `84872a4`:
      - `database`: PASS (2m 12s, ID 128691540115)
      - `application`: PASS (4m 38s, ID 128691540219 - format, lint, typecheck, AI security eval, unit tests, build, Chromium browser tests)
      - `coverage-report`: PASS (10s, ID 128692571077)
      - `scaffold`: PASS (24s, run 42467894291)
      - `Vercel Preview`: PASS (Deployment completed)
    - CodeQL Root Cause & Fix:
      - Root cause: GitHub dynamic Default Setup used `codeql-action/init@v4` targeting CodeQL bundle 2.27.4. Because `ubuntu-latest` has CodeQL 2.27.3 preinstalled, the runner deleted 2.27.3 and attempted to download 2.27.4 from `https://github.com/github/codeql-action/releases/download/...`, which repeatedly failed with `HTTP 504 Gateway Time-out` on the runner.
      - Fix: Added `.github/workflows/codeql.yml` leveraging `github/codeql-action/init@v3` (which matches the runner toolcache's pre-installed 2.27.3 bundle, completely bypassing release CDN downloads), and disabled the duplicate dynamic default setup via GitHub API.
- Failures, retries, unresolved issues:
  - Function overloading resolution conflict for `save_course_assignment` when called with 12 arguments; resolved by removing default argument from the 13-arg overload and adding explicit 12-arg wrapper function.
  - Initial `application` CI check failed due to formatting; fixed via `pnpm prettier --write .`.
  - Initial PR comments and replies had mangled backticks from PowerShell string interpolation; fixed by using `--input <file>` via GitHub CLI and resolved all threads.
  - CodeQL dynamic default setup hit 504 Gateway Time-out downloading CodeQL 2.27.4 bundle; fixed by configuring `.github/workflows/codeql.yml` with `@v3` using pre-cached runner toolcache.
- Resource measurements and unavailable fields: None
- Next steps: Await human verification and teammate review on PR #118 for merge into `develop`.
