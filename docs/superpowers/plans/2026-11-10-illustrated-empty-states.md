# Illustrated Empty States Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace missing or icon-only zero-data views with consistent illustrated empty states throughout the application.

**Architecture:** Add a shared React component with locally drawn SVG variants, compact and standard layouts, semantic copy, and optional caller-supplied actions. Keep data access and action authorization in existing views; replace only their zero-data rendering.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind, lucide-react already present, Vitest.

**Spec:** [Illustrated Empty States design](../specs/2026-11-10-illustrated-empty-states-design.md); issue #134; active OpenSpec change `build-programming-platform`.

## Global Constraints

- Preserve existing course membership, role, publication, ownership, and feature-gate checks.
- Keep empty results distinct from loading, error, not-found, and unavailable states.
- Keep product UI copy concise and focused on the user's task.
- Use local SVG and existing styles; introduce no asset or runtime dependency.
- Preserve browser-only Python/Java execution and all existing product boundaries.
- Preserve the unrelated `next-env.d.ts` edit.

## Review Focus

- Filtered results versus genuinely empty data: filtered states keep clear-filter actions and do not claim the underlying collection is empty; test assignment, submission, grade, and admin-user filtered states.
- Screen-reader and keyboard access: SVG is decorative, heading is semantic, actions are keyboard reachable; test accessible name and optional action behavior.
- Small embedded views: compact illustrations do not overwhelm progress cards, forum replies, or submission history; test compact sizing.
- Role and lifecycle actions: the illustration cannot expose instructor/student actions to the wrong role or archived workspace; preserve existing caller gating and assert current action availability.
- Loading/failure handling: an in-flight admin search or failed query never renders an empty illustration; existing error tests distinguish loading, failures, and successful empty data.

---

### Task 1: Shared illustrated empty-state component

**Files:**
- Create: `src/components/ui/illustrated-empty-state.tsx`
- Test: `src/components/ui/illustrated-empty-state.test.tsx`

**Interfaces:**
- Produces: `IllustratedEmptyState` accepting `title: string`, `description: string`, `illustration: 'collection' | 'discussion' | 'code' | 'progress'`, optional `size: 'compact' | 'standard'`, optional `headingLevel: 2 | 3 | 4`, and optional `action: ReactNode`.

- [x] **Step 1: Write failing tests** named `renders accessible copy and a decorative selected illustration`, `supports a keyboard-accessible optional action`, and `uses compact layout when requested`. Assert visible title/description, SVG `aria-hidden="true"` plus illustration marker, action presence/absence, and compact class.
- [x] **Step 2: Run the component test and confirm it fails** because the component does not exist.
- [x] **Step 3: Implement the component** with semantic HTML and local inline SVG shapes for the four illustration kinds. The SVG is decorative; the title and description provide the accessible message. Default to standard size.
- [x] **Step 4: Run the component test and confirm it passes.**
- [x] **Step 5: Commit** as `feat: add illustrated empty state component` (`dc0e5ce`).

### Task 2: Directories, assignment lists, discussions, and histories

**Files:**
- Modify: `src/features/course-workspaces/course-directory.tsx`, `src/features/admin-users/user-directory.tsx`, `src/features/course-workspaces/course-people.tsx`
- Modify: `src/features/course-workspaces/course-access.tsx` for the zero-recipient ownership-transfer view
- Modify: `src/features/student-assignments/components.tsx`, `src/features/student-lists/filter-controls.tsx`, `src/features/student-grades/grades-list.tsx`, `src/features/student-submissions/history-list.tsx`
- Modify: `src/app/courses/[courseId]/assignments/page.tsx`, `src/app/courses/[courseId]/assignments/[assignmentId]/page.tsx`, `src/app/student/assignments/[assignmentId]/page.tsx`, `src/app/courses/[courseId]/assignments/[assignmentId]/submissions/page.tsx`, `src/app/courses/[courseId]/submissions/page.tsx`
- Modify: `src/app/courses/[courseId]/forums/page.tsx`, `src/app/courses/[courseId]/forums/[threadId]/page.tsx`
- Tests: `src/features/course-workspaces/course-directory.test.tsx`, `src/features/course-workspaces/course-access.test.tsx`, `src/features/course-workspaces/course-people.test.tsx`, `src/features/admin-users/user-directory.test.tsx`, `src/features/student-assignments/components.test.tsx`, `src/features/student-grades/grades-list.test.tsx`, `src/features/student-submissions/history-list.test.tsx`, `src/app/courses/[courseId]/assignments/page.test.tsx`, `src/app/courses/[courseId]/assignments/[assignmentId]/page.test.tsx`, `src/app/courses/[courseId]/assignments/[assignmentId]/submissions/page.test.tsx`, `src/app/courses/[courseId]/submissions/page.test.tsx`, and `src/app/courses/[courseId]/forums/page.test.tsx`; create focused thread-replies and legacy student assignment-detail tests if none exist.

**Interfaces:** Consumes `IllustratedEmptyState` from Task 1; all actions remain supplied by existing views.

- [x] **Step 1: Add failing assertions** in the listed view tests for the shared illustration marker and preserved text/action in: no courses, no matching admin users, no course members, no pending invitations, no assignments, filtered no matches, no student revisions, no instructor submissions, no forum discussions, no replies, and no eligible ownership-transfer recipient. Assert the admin search's pending state is shown without an empty illustration. Add/extend a regression proving query failures still use the existing error path.
- [x] **Step 2: Run the focused view tests and confirm the missing illustration assertions fail.**
- [x] **Step 3: Replace text-only or icon-only data-empty renderers** with `IllustratedEmptyState`; use compact size for embedded history/replies and preserve links, filter controls, and role/lifecycle gating.
- [x] **Step 4: Run the focused view tests and confirm empty, filtered, non-empty, and error cases pass (14 files, 54 tests).**
- [x] **Step 5: Commit** as `feat: illustrate empty directories and discussions` (`fa7b75d`).

### Task 3: Activity summaries, metrics, and practice views

**Files:**
- Modify: `src/features/student-progress/components.tsx`, `src/features/assignment-xp/components.tsx`, `src/features/leaderboard/components.tsx`, `src/features/student-submissions/practice-results.tsx`, `src/features/practice-test-authoring/editor.tsx`
- Modify: `src/app/courses/[courseId]/ai-usage/page.tsx`, `src/app/courses/[courseId]/context-comparison/page.tsx`
- Tests: `src/features/student-progress/components.test.tsx`, `src/features/assignment-xp/components.test.tsx`, `src/features/leaderboard/components.test.tsx`, `src/features/student-submissions/practice-results.test.tsx`, `src/features/practice-test-authoring/editor.test.tsx`, `src/app/courses/[courseId]/ai-usage/page.test.tsx`, and `src/app/courses/[courseId]/context-comparison/page.test.tsx`.

**Interfaces:** Consumes the shared component from Task 1; use `progress` for activity/metrics, `discussion` for AI/context activity, and `code` for practice/submission data.

- [x] **Step 1: Add failing assertions** for no progress assignments/deadlines/submissions/grades, no XP awards, no leaderboard rows (including an empty later page), no recent AI reviews, no comparison submissions, and no authored or published practice cases. Assert each stays distinct from unavailable/error states.
- [x] **Step 2: Run the focused tests and confirm the illustrated-state assertions fail.**
- [x] **Step 3: Replace text-only empty content** with the shared component using compact layout for progress panels, and standard layout for page sections. Keep zero-valued summary cards, paging, and all existing navigation intact.
- [x] **Step 4: Run all focused tests and confirm empty, non-empty, and unavailable cases pass (7 files, 27 tests).**
- [x] **Step 5: Commit** as `feat: illustrate empty activity and practice views` (`ad353e2`).

### Task 4: OpenSpec, full audit, and evidence

**Files:**
- Modify: `openspec/changes/build-programming-platform/specs/engineering-and-delivery/spec.md`
- Modify: `openspec/changes/build-programming-platform/tasks.md`
- Create/update: `logs/2026-11-10-illustrated-empty-states.md` from `logs/SessionTemplate.md`

- [x] **Step 1: Add the OpenSpec requirement and task** covering accessible illustrations for successful empty collections and filtered results, while preserving error/loading distinctions and per-view actions.
- [x] **Step 2: Repeat the empty-state source audit** (`rg` across `src/app` and `src/features`) and record each remaining intentional empty presentation with its reason; do not mark tasks complete for out-of-scope editor/runtime output.
- [x] **Step 3: Run applicable checks:** focused unit tests, `pnpm test:unit`, `pnpm lint`, `pnpm typecheck`, scoped Prettier check, `pnpm exec openspec validate build-programming-platform --strict`, and `git diff --check`. Record actual results and limitations in the dated log.
- [x] **Step 4: Update the OpenSpec task only after its checks pass; leave teammate review pending.**
- [x] **Step 5: Commit** the verified documentation/evidence as `docs: record illustrated empty state coverage` (`d5e18df`).
- [ ] **Step 6: Wait for branch CI, then push and create a PR to `develop`** linking issue #134, the OpenSpec change, and dated log; verify final-head checks and leave human review pending.
