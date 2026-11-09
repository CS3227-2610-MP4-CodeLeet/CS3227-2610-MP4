# Course Administration and Route Standardization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean up and standardize course navigation by extracting a dedicated "Manage Users" page (`/manage-users`), introducing a Coursemology-inspired "Administration" section in the sidebar, unifying `/assignments` and `/submissions` into role-aware canonical routes while completely deleting `/instructor`, adding instructor assignment preview, and upgrading the Context Comparison view to showcase Context Engineering.

**Architecture:** Next.js App Router Server Components inspect course membership role (`course_memberships.role`) on canonical resource routes (`/assignments`, `/submissions`) to dynamically render instructor management views versus student execution views. User administration (join codes and roster) moves to a dedicated `/manage-users` route grouped under an "Administration" sidebar section, and the obsolete `src/app/courses/[courseId]/instructor` route directory is completely removed.

**Tech Stack:** Next.js 15 (App Router Server & Client Components), TypeScript, Tailwind CSS, Supabase PostgreSQL, Vitest, React Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-08-course-administration-and-routing-standardization-design.md`

## Global Constraints
- Browser-only code execution must be preserved; no remote execution services or Node.js runtime code evaluation.
- All code files must remain strictly in `src/`.
- No `/instructor` path segment in any URLs; complete deletion of `src/app/courses/[courseId]/instructor`.
- Student join code block must be rendered above the People block on `/manage-users`.
- Role verification must always be enforced on the server via `requireMember()` or `getVerifiedUserRole()`.
- Zero test regressions across unit and integration test suites.

## Review Focus
1. **Student authorization on administrative routes**: A student navigating directly to `/courses/[courseId]/manage-users` or `/courses/[courseId]/context-comparison` must receive a `notFound()` 404 response.
2. **Preview Mode submission restriction**: An instructor previewing an assignment at `/courses/[courseId]/assignments/[assignmentId]` must have code execution enabled in the browser runner, but the "Submit revision" button must be disabled with a notice, and student revision history must not be polluted.
3. **Draft assignment visibility during instructor preview**: An instructor must be able to preview an unpublished draft assignment that they own, whereas a student accessing the same URL receives a 404.
4. **Draft practice test case loading**: An instructor previewing an assignment must be able to load test cases even if the assignment is not yet published.
5. **Sidebar active state matching**: Sidebar active links must correctly highlight `/assignments`, `/manage-users`, and `/context-comparison` without colliding with child routes or stale paths.

---

### Task 1: Dedicated Manage Users Page & Course Overview Cleanup

**Files:**
- Create: `src/app/courses/[courseId]/manage-users/page.tsx`
- Create: `src/app/courses/[courseId]/manage-users/loading.tsx`
- Create: `src/app/courses/[courseId]/manage-users/page.test.tsx`
- Modify: `src/features/course-workspaces/course-workspace.tsx`
- Modify: `src/app/courses/[courseId]/page.test.tsx`

**Interfaces:**
- Consumes: `CoursePeople` (`src/features/course-workspaces/course-people.tsx`), `CourseAccess` / `JoinCodeManagement` (`src/features/course-workspaces/course-access.tsx`), `getVerifiedUserRole` (`src/lib/auth/verified-user.ts`).
- Produces: Server component at `/courses/[courseId]/manage-users` displaying `JoinCodeManagement` at top and `CoursePeople` below.

- [ ] **Step 1: Write the failing tests for `/manage-users`**

Create `src/app/courses/[courseId]/manage-users/page.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ManageUsersPage from './page';

vi.mock('@/lib/auth/verified-user', () => ({
  getVerifiedUserRole: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
  redirect: vi.fn(),
}));

describe('ManageUsersPage', () => {
  it('renders student join code above people for instructors', async () => {
    // Assert Join Code header appears before People header in DOM
  });

  it('triggers notFound when a student visits manage-users', async () => {
    // Assert notFound is called
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/app/courses/\\[courseId\\]/manage-users/page.test.tsx`
Expected: FAIL with "Cannot find module './page'"

- [ ] **Step 3: Implement `/manage-users` page and clean up `course-workspace.tsx`**

1. Create `src/app/courses/[courseId]/manage-users/page.tsx`:
   - Enforce instructor role verification via `getVerifiedUserRole()` and course membership.
   - Set breadcrumb: `BreadcrumbSetter title="Manage Users"`.
   - Render header: `Manage Users`.
   - Render `JoinCodeManagement` block at the top.
   - Render `CoursePeople` block below.
2. Create `src/app/courses/[courseId]/manage-users/loading.tsx` with skeleton loader.
3. In `src/features/course-workspaces/course-workspace.tsx`:
   - Remove `CoursePeople` and `JoinCodeManagement` from `ManagementPanels`.
   - Keep `CourseDetails`, `CourseFeatures`, `OwnershipTransfer`, and `CourseLifecycle`.
   - Add a quick administrative link or summary pointing to `Manage Users`.
4. Update `src/app/courses/[courseId]/page.test.tsx` to match the trimmed overview layout.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test src/app/courses/\\[courseId\\]/manage-users/page.test.tsx src/app/courses/\\[courseId\\]/page.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/courses/\[courseId\]/manage-users src/features/course-workspaces/course-workspace.tsx src/app/courses/\[courseId\]/page.test.tsx
git commit -m "feat(courses): add dedicated manage-users page and clean up course overview"
```

---

### Task 2: Sidebar Administration Section & Breadcrumbs

**Files:**
- Modify: `src/components/layout/course-sidebar.tsx`
- Modify: `src/components/layout/course-sidebar-icons.tsx`
- Modify: `src/components/layout/course-sidebar-nav.ts`
- Modify: `src/components/layout/course-breadcrumbs.tsx`
- Modify: `src/components/layout/course-sidebar.test.tsx`
- Modify: `src/components/layout/course-sidebar-nav.test.ts`

**Interfaces:**
- Consumes: `CourseSidebarProps`, `role: 'student' | 'instructor'`.
- Produces: `CourseSidebar` rendering an "Administration" group for instructors containing "Manage Users" and "Context comparison".

- [ ] **Step 1: Write failing tests for Administration section in sidebar**

Update `src/components/layout/course-sidebar.test.tsx`:
```tsx
it('renders Administration section with Manage Users and Context comparison for instructors', () => {
  render(<CourseSidebar {...defaultProps} role="instructor" />);
  expect(screen.getByText('Administration')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /manage users/i })).toHaveAttribute(
    'href',
    '/courses/course-123/manage-users',
  );
  expect(screen.getByRole('link', { name: /context comparison/i })).toHaveAttribute(
    'href',
    '/courses/course-123/context-comparison',
  );
});

it('does not render Administration section for students', () => {
  render(<CourseSidebar {...defaultProps} role="student" />);
  expect(screen.queryByText('Administration')).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /manage users/i })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/components/layout/course-sidebar.test.tsx`
Expected: FAIL with missing 'Administration' or 'Manage Users'.

- [ ] **Step 3: Implement Administration grouping and icons in `CourseSidebar`**

1. In `src/components/layout/course-sidebar-icons.tsx`, add `UserGearIcon` (user with settings cog icon).
2. In `src/components/layout/course-sidebar.tsx`:
   - Define `AdminNavItem` type.
   - For `role === 'instructor'`, render a distinct "Administration" group header and nav items:
     - Manage Users (`/courses/${courseId}/manage-users`) with `UserGearIcon`.
     - Context comparison (`/courses/${courseId}/context-comparison`) with `ArrowsRightLeftIcon` (when AI feature is enabled).
   - Ensure collapsed rail mode handles the admin group with clean visual separation and proper tooltips.
3. In `src/components/layout/course-sidebar-nav.ts`, update `isNavItemActive` to handle `/manage-users` and `/context-comparison`.
4. In `src/components/layout/course-breadcrumbs.tsx`, map `'manage-users'` to `'Manage Users'` and `'context-comparison'` to `'Context Comparison'`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test src/components/layout/course-sidebar.test.tsx src/components/layout/course-sidebar-nav.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/course-sidebar.tsx src/components/layout/course-sidebar-icons.tsx src/components/layout/course-sidebar-nav.ts src/components/layout/course-breadcrumbs.tsx src/components/layout/course-sidebar.test.tsx src/components/layout/course-sidebar-nav.test.ts
git commit -m "feat(sidebar): add administration section with manage users and context comparison"
```

---

### Task 3: Unify `/assignments` and Migrate Instructor Assignment Child Routes

**Files:**
- Modify: `src/app/courses/[courseId]/assignments/page.tsx`
- Modify: `src/app/courses/[courseId]/assignments/page.test.tsx`
- Move & Modify: `src/app/courses/[courseId]/instructor/assignments/new` → `src/app/courses/[courseId]/assignments/new`
- Move & Modify: `src/app/courses/[courseId]/instructor/assignments/[assignmentId]/edit` → `src/app/courses/[courseId]/assignments/[assignmentId]/edit`
- Move & Modify: `src/app/courses/[courseId]/instructor/assignments/[assignmentId]/practice-tests` → `src/app/courses/[courseId]/assignments/[assignmentId]/practice-tests`
- Move & Modify: `src/app/courses/[courseId]/instructor/assignments/[assignmentId]/submissions` → `src/app/courses/[courseId]/assignments/[assignmentId]/submissions`
- Delete: `src/app/courses/[courseId]/instructor/page.tsx` and `page.test.tsx`

**Interfaces:**
- Consumes: `readCourseAccess`, `role: 'student' | 'instructor'`.
- Produces: `/courses/[courseId]/assignments` rendering instructor view (+ New assignment, Edit, Submissions, Preview) for instructors, and student view for students.

- [ ] **Step 1: Write failing tests for role-aware `/courses/[courseId]/assignments`**

Update `src/app/courses/[courseId]/assignments/page.test.tsx`:
```tsx
it('renders instructor management view with New assignment and Preview buttons for instructors', async () => {
  // Mock instructor access
  // Assert "New assignment" button exists
  // Assert each assignment has "Preview", "Edit", and "Submissions" links
  // Assert no "← Course workspace" link exists
});

it('renders student assignment list with due dates and solve links for students', async () => {
  // Mock student access
  // Assert student view renders
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/app/courses/\\[courseId\\]/assignments/page.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement role-aware `/assignments` and move child authoring routes**

1. In `src/app/courses/[courseId]/assignments/page.tsx`:
   - Inspect user course role using `readCourseAccess`.
   - If `role === 'instructor'`: render the instructor assignments management view (formerly in `instructor/page.tsx`), adding the `Preview` link (`/courses/${courseId}/assignments/${assignment.id}`) alongside `Edit` and `Submissions`.
   - Remove the `← Course workspace` link entirely.
   - If `role === 'student'`: render student assignments list.
2. Move instructor child routes to canonical locations:
   - `src/app/courses/[courseId]/instructor/assignments/new/` → `src/app/courses/[courseId]/assignments/new/`
   - `src/app/courses/[courseId]/instructor/assignments/[assignmentId]/edit/` → `src/app/courses/[courseId]/assignments/[assignmentId]/edit/`
   - `src/app/courses/[courseId]/instructor/assignments/[assignmentId]/practice-tests/` → `src/app/courses/[courseId]/assignments/[assignmentId]/practice-tests/`
   - `src/app/courses/[courseId]/instructor/assignments/[assignmentId]/submissions/` → `src/app/courses/[courseId]/assignments/[assignmentId]/submissions/`
3. Update internal links in those pages (e.g. back links pointing to `/courses/${courseId}/assignments` instead of `/courses/${courseId}/instructor`).
4. Delete `src/app/courses/[courseId]/instructor/page.tsx`, `page.test.tsx`, and `loading.tsx`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test src/app/courses/\\[courseId\\]/assignments/`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/courses/\[courseId\]/assignments
git rm -r src/app/courses/\[courseId\]/instructor/assignments src/app/courses/\[courseId\]/instructor/page.tsx src/app/courses/\[courseId\]/instructor/page.test.tsx src/app/courses/\[courseId\]/instructor/loading.tsx
git commit -m "feat(assignments): unify assignments route by role and migrate authoring sub-routes"
```

---

### Task 4: Instructor Student-Perspective Preview on `/assignments/[assignmentId]`

**Files:**
- Modify: `src/app/courses/[courseId]/assignments/[assignmentId]/page.tsx`
- Modify: `src/features/codementor/submission-form.tsx`
- Modify: `src/features/practice-test-authoring/queries.server.ts` or `src/app/api/student/assignments/[assignmentId]/test-cases/route.ts`
- Modify: `src/app/courses/[courseId]/assignments/[assignmentId]/page.test.tsx`

**Interfaces:**
- Consumes: `courseId`, `assignmentId`, `user.id`.
- Produces: Preview Mode on `/courses/[courseId]/assignments/[assignmentId]` when viewed by instructor, supporting draft assignments, active browser runner, disabled submit button, and hidden student history.

- [ ] **Step 1: Write failing tests for instructor preview on `/assignments/[assignmentId]`**

Update `src/app/courses/[courseId]/assignments/[assignmentId]/page.test.tsx`:
```tsx
it('renders preview mode banner and disables submissions when viewed by an instructor', async () => {
  // Mock instructor role
  // Render page
  expect(screen.getByText(/preview mode/i)).toBeInTheDocument();
  expect(screen.queryByText(/your revisions/i)).not.toBeInTheDocument();
});

it('allows instructors to preview draft assignments owned by their course', async () => {
  // Mock draft assignment and instructor role
  // Verify page loads without notFound()
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/app/courses/\\[courseId\\]/assignments/\\[assignmentId\\]/page.test.tsx`
Expected: FAIL with notFound() for instructor or missing preview banner.

- [ ] **Step 3: Implement Instructor Preview Mode**

1. In `src/app/courses/[courseId]/assignments/[assignmentId]/page.tsx`:
   - Update access assertion to permit both `student` and `instructor` roles.
   - For instructors, allow querying assignments with any `publication_status` (both `published` and `draft`).
   - If `role === 'instructor'`:
     - Render an alert banner at the top:
       `Preview Mode: You are viewing this assignment from the student's perspective. Code execution in the browser runner is active for testing.`
     - Pass `previewMode={true}` to `SubmissionForm`.
     - Omit `SubmissionHistory`.
2. In `src/features/codementor/submission-form.tsx`:
   - When `previewMode` is true, disable the "Submit revision" button and show a badge/notice: `"Submission disabled in preview mode"`.
   - Keep the browser runner ("Run code" / test cases) active.
3. In `src/app/api/student/assignments/[assignmentId]/test-cases/route.ts` (or access query):
   - Allow instructors of the course to fetch practice test cases for their owned assignments (including drafts) during preview.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test src/app/courses/\\[courseId\\]/assignments/\\[assignmentId\\]/page.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/courses/\[courseId\]/assignments/\[assignmentId\] src/features/codementor/submission-form.tsx src/app/api/student/assignments/\[assignmentId\]/test-cases
git commit -m "feat(assignments): add instructor student-perspective preview mode"
```

---

### Task 5: Role-Aware Submissions Routing & Deletion of `/instructor/submissions`

**Files:**
- Modify: `src/app/courses/[courseId]/submissions/page.tsx`
- Modify: `src/app/courses/[courseId]/submissions/[submissionId]/page.tsx`
- Modify: `src/app/courses/[courseId]/submissions/page.test.tsx`
- Delete: `src/app/courses/[courseId]/instructor/submissions/` directory

**Interfaces:**
- Consumes: `role: 'student' | 'instructor'`.
- Produces: `/courses/[courseId]/submissions` rendering instructor grading table for instructors and personal history for students; `/courses/[courseId]/submissions/[submissionId]` rendering grading view for instructors and submission review for students.

- [ ] **Step 1: Write failing tests for role-aware `/submissions`**

Update `src/app/courses/[courseId]/submissions/page.test.tsx`:
```tsx
it('renders course submissions review dashboard for instructors', async () => {
  // Mock instructor access
  // Assert submission filters and review table render
});

it('renders student submission history for students', async () => {
  // Mock student access
  // Assert personal submissions list renders
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/app/courses/\\[courseId\\]/submissions/page.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement role-aware submissions and clean up `/instructor/submissions`**

1. In `src/app/courses/[courseId]/submissions/page.tsx`:
   - Check course role:
     - If `role === 'instructor'`: render the instructor submissions dashboard (previously in `instructor/submissions/page.tsx`), with `SubmissionFilters` and review table.
     - If `role === 'student'`: render student submission history.
2. In `src/app/courses/[courseId]/submissions/[submissionId]/page.tsx`:
   - If `role === 'instructor'`: render the instructor grading and rubric evaluation page (previously in `instructor/submissions/[submissionId]/page.tsx`).
   - If `role === 'student'`: render the student submission view.
3. Delete `src/app/courses/[courseId]/instructor/submissions/` directory entirely.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test src/app/courses/\\[courseId\\]/submissions/`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/courses/\[courseId\]/submissions
git rm -r src/app/courses/\[courseId\]/instructor/submissions
git commit -m "feat(submissions): unify submissions routing by role and delete instructor/submissions"
```

---

### Task 6: Context Comparison View Upgrade & Route Migration

**Files:**
- Move & Modify: `src/app/courses/[courseId]/instructor/ai-context/` → `src/app/courses/[courseId]/context-comparison/`
- Modify: `src/features/codementor/context-comparison.tsx`
- Modify: `src/features/codementor/context-comparison.test.tsx`
- Modify: `src/app/courses/[courseId]/context-comparison/page.test.tsx`

**Interfaces:**
- Consumes: `submissionId`, `ContextComparison` component.
- Produces: `/courses/[courseId]/context-comparison` with clear educational callouts for Context Engineering, token savings percentages, and rubric fidelity.

- [ ] **Step 1: Write failing tests for enhanced Context Comparison**

Update `src/features/codementor/context-comparison.test.tsx`:
```tsx
it('displays context strategy descriptions and token reduction metrics', async () => {
  // Render ContextComparison after successful compare
  expect(screen.getByText(/Focused Context \(Optimized\)/i)).toBeInTheDocument();
  expect(screen.getByText(/Broader Context \(Baseline\)/i)).toBeInTheDocument();
  expect(screen.getByText(/token reduction/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/features/codementor/context-comparison.test.tsx`
Expected: FAIL with missing strategy description or token reduction callout.

- [ ] **Step 3: Move route and enhance Context Comparison copy and metrics**

1. Move `src/app/courses/[courseId]/instructor/ai-context/` to `src/app/courses/[courseId]/context-comparison/`.
2. In `src/app/courses/[courseId]/context-comparison/page.tsx`:
   - Set breadcrumb: `BreadcrumbSetter title="Context Comparison"`.
   - Update heading and educational banner:
     - Header: `AI Context Comparison`
     - Subtitle: `Context Engineering & Resource-Aware Evaluation`
     - Educational explanation:
       `This tool benchmarks prompt efficiency and grading fidelity between two authorized context strategies: a focused, prompt-engineered context versus an uncurated baseline with peripheral metadata. Token counts measure resource savings; rubric suggestions are advisory.`
   - Remove stale `Back to assignments` link that referenced `/instructor`.
3. In `src/features/codementor/context-comparison.tsx`:
   - Label Condition A: `Focused Context (Optimized)`:
     `Curated prompt containing strictly assignment instructions, private rubric criteria, and student code.`
   - Label Condition B: `Broader Context (Baseline)`:
     `Includes peripheral metadata (creation timestamps, publication statuses, revision numbers) to demonstrate prompt bloat.`
   - Add a summary badge when comparing results:
     `Token Reduction: X% fewer tokens used by focused strategy`
   - Explicit callout: `Advisory suggestions only — grades require explicit instructor publication.`

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test src/app/courses/\\[courseId\\]/context-comparison/ src/features/codementor/context-comparison.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/courses/\[courseId\]/context-comparison src/features/codementor/context-comparison.tsx src/features/codementor/context-comparison.test.tsx
git rm -r src/app/courses/\[courseId\]/instructor/ai-context
git commit -m "feat(ai): migrate context comparison to canonical route and enhance educational copy"
```

---

### Task 7: Complete `/instructor` Deletion & Full Suite Verification

**Files:**
- Delete: Any remaining files in `src/app/courses/[courseId]/instructor`
- Modify: Any lingering test assertions or imports referencing `/instructor`

**Interfaces:**
- Consumes: Complete repository.
- Produces: Clean codebase without any `/instructor` routes, all tests green, lint clean.

- [ ] **Step 1: Check for any remaining files under `src/app/courses/[courseId]/instructor`**

Run: `Get-ChildItem -Recurse -LiteralPath "src/app/courses/[courseId]/instructor"`
Delete the entire `src/app/courses/[courseId]/instructor` folder once all contents are verified migrated.

- [ ] **Step 2: Search for lingering `/instructor` links in source and test files**

Run: `Get-ChildItem -Path src -Recurse -File | Select-String -Pattern "/courses/.*/instructor"`
Update any lingering references to use the canonical `/assignments`, `/submissions`, `/manage-users`, or `/context-comparison` paths.

- [ ] **Step 3: Run full automated test suite**

Run: `pnpm test`
Expected: All tests pass with zero regressions.

- [ ] **Step 4: Run type checking and linting**

Run: `pnpm typecheck`
Expected: Clean with 0 errors.
Run: `pnpm lint`
Expected: Clean with 0 errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor(courses): remove all legacy instructor routes and finalize route standardization"
```
