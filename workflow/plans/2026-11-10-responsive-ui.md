# Responsive UI Audit and Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` for task-by-task inline implementation. Steps use checkbox syntax for tracking.

**Goal:** Audit every current application route family at narrow phone, phone, tablet, and desktop widths, and fix verified responsive usability defects without changing product behavior.

**Architecture:** Keep existing Next.js App Router, React, Tailwind, and feature components. Add responsive requirements and tasks to the active OpenSpec change, then use the existing Playwright configuration and local synthetic fixtures to reproduce and guard layout defects. Make focused component changes only where the route/viewport review identifies a concrete problem.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, Tailwind CSS 4.3.3, Playwright 1.64.1, pnpm 12.15.0.

**Spec:** [Design](2026-11-10-responsive-ui-design.md); delta spec to be added at `openspec/changes/build-programming-platform/specs/responsive-ui/spec.md`.

## Global Constraints

- Keep application code in `src/`, workflow artifacts in `workflow/`, and OpenSpec artifacts in `openspec/`.
- Preserve the project requirement that Python execution and Java compilation/execution happen entirely in the browser; never execute submitted code in Next.js/Node or add a remote execution service.
- Keep private rubrics and keys server-side; do not grant models tools or grade-publication authority.
- No file uploads or badges; keep forums to threads/replies and XP to auditable server-controlled awards.
- Preserve existing authentication, role checks, course membership, privacy, grade, AI, and submission behavior.
- Keep product UI copy concise and focused on the user’s task.
- Keep test fixtures synthetic and local; do not place credentials, real student data, or private prompts in logs, screenshots, or artifacts.
- Verify the installed Next.js version against `node_modules/next/dist/docs/` before changing Next APIs.
- Stage only issue #146 files and leave unrelated changes untouched.

## Review Focus

1. At 320 CSS px, account controls and long labels must remain visible and operable rather than clipping or creating page overflow. Pin this in the shared-header browser journey.
2. Long course, assignment, username, email, and URL-like text must wrap, truncate with an accessible name, or scroll inside its own region. Pin the longest relevant content in shell/list browser checks.
3. Code and tabular data may need horizontal navigation, but that scrolling must remain within the code/table region. Pin document overflow and region scroll separately.
4. Validation, unavailable, loading, and empty-state content must remain distinguishable and readable when it wraps at narrow widths. Include representative long messages and empty views in route checks.
5. Mobile controls must remain keyboard reachable, visibly focused, and usable at touch sizes in both light and dark themes. Exercise the menu and representative forms at narrow widths.

---

### Task 1: Add responsive UI requirements and review matrix

**Files:**
- Modify: `openspec/changes/build-programming-platform/proposal.md`
- Create: `openspec/changes/build-programming-platform/specs/responsive-ui/spec.md`
- Modify: `openspec/changes/build-programming-platform/tasks.md`
- Create: `workflow/evidence/2026-11-10-responsive-ui-audit.md`

**Interfaces:**
- Consumes: Issue #146, the approved design, existing course/assignment responsive requirements, and the actual App Router page inventory.
- Produces: A responsive-ui delta requirement, task group 46, and a route-family inventory that records viewport/state evidence and disposition.

- [x] **Step 1: Map every current UI route family and fixture-accessible state**

  Inventory every `src/app/**/page.tsx`, layout, loading/error/not-found route, and shared page component. Group dynamic routes by course/member role and record which local synthetic fixture reaches each route. Include auth/public pages, app header/course directory/profile/admin, course workspace, instructor forms, student lists/editor/runner, discussions, grades/progress/XP, comparison, and loading/empty/error states. The later browser matrix must visit every route that the existing synthetic fixture contracts can reach; mark each unreachable route with its concrete authentication/data prerequisite.

- [x] **Step 2: Add the OpenSpec delta requirement and task group 46**

  Define supported responsive behavior at 320, 375, 768, 1024, and 1440 CSS px; require no unintended document-level horizontal overflow, usable bounded code/data scrolling, readable wrapping, visible/reachable controls, and preserved keyboard/theme behavior. Add verification, logging, and PR tasks without duplicating completed issue #140 requirements.

- [x] **Step 3: Record the initial route/viewport review**

  Create the audit matrix with each page family, role, viewport, state/content shape, browser evidence, identified issue or pass, and follow-up owner/task. Keep browser-unavailable evidence separate from source inspection.

- [x] **Step 4: Validate the OpenSpec update**

  Run: `pnpm spec:validate`

  Expected: the active change and its new responsive-ui delta validate successfully.

### Task 2: Guard shared application navigation at small widths

**Files:**
- Test: `tests/e2e/responsive-ui.spec.ts`
- Create: `tests/e2e/helpers/responsive-layout.ts`
- Test: existing route-specific authenticated browser specs as needed
- Modify: `src/components/layout/app-header.tsx`
- Modify as needed: `src/components/layout/app-header.test.tsx`
- Modify audit: `workflow/evidence/2026-11-10-responsive-ui-audit.md`

**Interfaces:**
- Consumes: Task 1 route/viewport matrix and existing authenticated Playwright fixtures.
- Produces: A responsive header whose destinations/account controls remain discoverable and operable; `expectNoDocumentOverflow(page: Page): Promise<void>` in `tests/e2e/helpers/responsive-layout.ts`, reused by Tasks 3–4.

- [x] **Step 1: Add failing geometry and access checks for the shared header**

  Cover student/instructor header and admin header roles at 320, 375, 768, 1024, and 1440 CSS px. Assert visible destinations, keyboard/touch operation, and `document.documentElement.scrollWidth <= document.documentElement.clientWidth`.

- [x] **Step 2: Run the focused browser checks to confirm the current failure**

  Run: `pnpm exec playwright test tests/e2e/responsive-ui.spec.ts --project=chromium`

  Expected: Fail only on reproduced header overflow, clipping, or control reachability; fixture/setup failures are investigated separately.

- [x] **Step 3: Make the smallest responsive header change**

  Preserve the same destinations and account actions. At narrow widths, use a layout that fits the available space and retains accessible labels and keyboard behavior; do not hide a destination without an available, operable way to reach it.

- [x] **Step 4: Re-run the focused header and existing account/navigation checks**

  Run: `pnpm exec playwright test tests/e2e/responsive-ui.spec.ts tests/e2e/account-controls.spec.ts --project=chromium`

  Expected: Targeted checks pass at all listed widths, existing account actions remain unchanged, and the route audit records results.

- [ ] **Step 5: Commit the verified shared-navigation milestone**

  Stage only the owned test/component/audit files and commit with a Conventional Commit message such as `fix(ui): keep shared navigation usable on mobile`.

### Task 3: Review course and student workspace shells, forms, and data views

**Files:**
- Test: `tests/e2e/responsive-ui.spec.ts`
- Reuse: `tests/e2e/helpers/responsive-layout.ts`
- Modify only if reproduced: `src/components/layout/course-breadcrumbs.tsx`, `src/components/layout/course-workspace-shell.tsx`, `src/components/layout/course-sidebar.tsx`, `src/features/student-assignments/workspace-shell.tsx`, and affected route/feature components.
- Modify audit: `workflow/evidence/2026-11-10-responsive-ui-audit.md`

**Interfaces:**
- Consumes: Task 1 inventory, Task 2 shared geometry checks, `courseWorkspaceFixture`, and current issue #140 mobile drawer behavior.
- Produces: Route-specific responsive fixes and browser checks; no changes to authorization or route contracts.

- [x] **Step 1: Add failing checks for representative course/student pages and long content**

  At every agreed width, visit the authenticated route templates reachable from local synthetic fixtures, including student and instructor course pages, data lists, forms, history, and legacy redirects. Include long forum title/body content and an empty course list, check a 320px dark-theme view, and record the exact fixture/state gaps. The final browser evidence identifies loading/error/unavailable/not-found variants as not systematically exercised.

- [x] **Step 2: Run the focused checks and reproduce each reported layout defect**

  Run: `pnpm exec playwright test tests/e2e/responsive-ui.spec.ts --project=chromium`

  Expected: Fail only on a reproducible page overflow, clipped/overlapping control, unusable target, or content-order/readability defect.

- [x] **Step 3: Fix confirmed shell/form/list defects in their owning component**

  Keep existing route destinations, page content, accessible names, theme behavior, and feature gating. Use contained horizontal scrolling only for content whose structure is inherently wide.

- [x] **Step 4: Verify fixes and existing mobile course navigation behavior**

  Run: `pnpm exec playwright test tests/e2e/responsive-ui.spec.ts tests/e2e/course-workspaces.spec.ts --project=chromium`

  Expected: All exercised widths have no unintended document overflow; course drawer keyboard behavior from #140 still passes; audit rows capture exact outcomes.

- [x] **Step 5: Commit the verified workspace/data-view milestone**

  Source milestone committed as `9f79938`. Final independent review found no Critical or Important issues after its route assertion and keyboard-scroll findings were addressed in follow-up test changes.

### Task 4: Review editor, runner, comparison, and wide-content regions

**Files:**
- Test: `tests/e2e/responsive-ui.spec.ts`
- Test: `tests/e2e/responsive-assignment-preview.spec.ts`
- Reuse: `tests/e2e/helpers/responsive-layout.ts`
- Modify only if reproduced: `src/features/student-submissions/code-editor.tsx`, `src/app/globals.css`, `src/features/student-submissions/practice-runner.tsx`, `src/features/student-submissions/revision-comparison.tsx`, and affected tables.
- Modify audit: `workflow/evidence/2026-11-10-responsive-ui-audit.md`

**Interfaces:**
- Consumes: Task 1 content cases and Tasks 2–3 geometry assertions.
- Produces: Bounded, touch/keyboard-operable wide-content regions with preserved browser-only Python/Java behavior and readable status/results.

- [x] **Step 1: Add failing content-width and scroll-region checks**

  Exercise long code lines, source line numbers, Python and Java workspaces, comparison diffs, and representative wide tables at 320, 375, and 768 px. Assert that only the intended region scrolls and that source, output, controls, and line-number synchronization remain visible/operable. The assignment-preview browser project is a separate Next server/project in Playwright configuration, so put those journeys in `responsive-assignment-preview.spec.ts`.

- [x] **Step 2: Run focused checks to reproduce each editor/data-region issue**

  Run: `pnpm exec playwright test tests/e2e/responsive-assignment-preview.spec.ts tests/e2e/assignment-preview.spec.ts --project=student-preview`

  Expected: Fail only for reproduced geometry/interaction regressions; runtime asset skips remain explicitly reported and are not treated as execution evidence.

- [x] **Step 3: Apply minimal local layout fixes**

  Keep code execution inside existing browser worker/frame boundaries. Retain all meaningful source/data and distinguish intended horizontal region scrolling from document overflow.

- [x] **Step 4: Re-run editor, runner, comparison, and responsive journeys**

  Run: `pnpm exec playwright test tests/e2e/responsive-assignment-preview.spec.ts tests/e2e/assignment-preview.spec.ts --project=student-preview` and `pnpm exec playwright test tests/e2e/responsive-ui.spec.ts tests/e2e/compare-revisions.spec.ts --project=chromium`

  Expected: Responsive checks pass, code remains intact, intended code/data scrolling works, and no page-level overflow appears.

- [x] **Step 5: Commit the verified editor/data-region milestone**

  Source milestone committed as `9f79938`. Final independent review found no Critical or Important issues after its route assertion and keyboard-scroll findings were addressed in follow-up test changes.

### Task 5: Complete cross-route verification and evidence

**Files:**
- Modify: `workflow/evidence/2026-11-10-responsive-ui-audit.md`
- Modify: `openspec/changes/build-programming-platform/tasks.md`
- Create: `logs/2026-11-10-responsive-ui.md`
- Modify: `docs/UserGuide.md` only if verified current behavior materially changes.

**Interfaces:**
- Consumes: Completed route inventory and focused browser/unit results from Tasks 1–4.
- Produces: Verified audit disposition, OpenSpec progress, and a sanitized chronological session summary with human verification still pending.

- [x] **Step 1: Run changed behavior tests and the complete required checks**

  Run: `pnpm test:unit`, `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `pnpm exec openspec validate --all --strict`, `pnpm check:scaffold`, `pnpm build`, applicable Playwright routes at all target widths, and `git diff --check`.

  Expected: Record exact pass/fail/skip counts and exit codes; investigate every failure before marking the OpenSpec tasks complete.

- [x] **Step 2: Re-check every inventory row against actual evidence**

  Mark each route/state row pass, fixed, or not verified. Keep any no-browser, no-fixture, auth, or runtime prerequisite limitation explicit; do not infer that an unvisited route passed from a shared component check.

- [x] **Step 3: Complete the dated session summary and OpenSpec task records**

  Use `logs/SessionTemplate.md`; record issue #146, OpenSpec change, branch and commits, actual participants/handoffs, checks, retries, limitations, and next owner. Keep human review pending.

- [x] **Step 4: Review the final change scope and whitespace**

  Run: `git status --short --branch`, `git diff --stat`, and `git diff --check`.

  Expected: Only issue #146-owned source, tests, specs, evidence, and log files are included; the two experiment JSON files changed by the baseline test were restored and remain untouched. Final review followups modify only the four responsive Playwright specs.

- [x] **Step 5: Commit the verified evidence milestone**

  Test followups were committed as `efab3e0`; evidence and log are committed. Merges of #147/#149/#151 exposed and resolved task-number collisions by moving issue #146 from group 43 through 45 to group 46. PR #152 is open; the old head's Vercel Preview failed, but its logs could not be retrieved because no Vercel credentials or browser session were available. The next updated-head branch and PR checks remain pending. Teammate review remains pending.

## Execution Decision

Implement inline in this worktree. The repository requires explicit user/task authorization before specialist delegation, and this task did not request delegated implementation. A separate review may be requested after implementation as an independent gate.
