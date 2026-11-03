# Student progress implementation plan

Execute inline using the executing-plans and test-driven-development skills. The requester approved implementation; no further plan-selection pause is needed. One bounded independent review follows implementation.

**Goal:** A private student overview that makes outstanding work and recent progress easy to find.
**Architecture:** Dynamic server page with parallel independent section loaders using the verified student's existing Supabase client. Exact assignment counts and anti-joined upcoming assignments use existing RLS; recent metadata is bounded to five rows. Reuse authoritative XP and existing workspace styling.
**Tech stack:** Node 24, Next.js App Router, React, Supabase/PostgREST, Zod, Vitest and Playwright; no new dependency or migration.
**Spec:** [Approved design](2026-11-03-student-progress-design.md), OpenSpec `build-programming-platform` / assignments-and-grading, task group 32, [issue #89](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/89).

## Global constraints

- Browser-only execution remains unchanged; no AI calls or XP writes.
- Own metadata only, published grades only, no source/rubric/feedback queries for overview.
- Exact counts across all visible published assignments; multiple revisions count once, overdue is a subset of outstanding.
- At the exact deadline an outstanding assignment is still due; only earlier deadlines are overdue. All displayed times use SGT.
- Failures show unavailable/retry, never fabricated zero. Preserve unrelated edits and keep the documentation-site PR separate.

## Review focus

- Duplicate revisions and more than 1,000 visible assignments must not inflate/truncate counts (task 1).
- Own filters on embedded joins must not let a peer's revision hide outstanding work (tasks 1 and 3).
- Withdrawn assignments must leave current totals; historical metadata uses existing unavailable-title semantics (tasks 1 and 3).
- Null/malformed/thrown backend responses must not wipe healthy sections or leak diagnostic details (tasks 1 and 2).
- Mobile navigation, theme, keyboard links and HTML-shaped titles remain usable and safe (tasks 2 and 3).

## Task 1: Exact own progress data

Files: `src/features/student-progress/assignments.server.ts`, `activity.server.ts`, `contracts.ts`, corresponding unit tests.
Interfaces: `loadAssignmentProgress(client, studentId, now)` returns `{total,submitted,outstanding,overdue}` or null; `loadUpcomingAssignments(client,studentId,now)` returns at most five visible outstanding assignments or null. `loadRecentSubmissions` and `loadRecentGrades` return five scoped metadata rows or null. No caller-controlled identity from search parameters.

- [x] Write and run failing HTTP-client tests for exact HEAD counts, own filtered anti-joins, due boundaries, deterministic five-row activity, safe projections and backend failures.
- [x] Implement loaders and response validation, using exact counts rather than paginated list lengths. Reject inconsistent counts rather than showing impossible progress during concurrent changes.
- [x] Verify queries against local synthetic records under real RLS, including duplicate revisions and assignments above the REST row limit; no reset or migration.
- [x] Run focused unit tests and commit verified data milestone.

## Task 2: Private dashboard page and navigation

Files: `src/features/student-progress/components.tsx`, `retry-button.tsx`, tests; `src/app/student/progress/{page,layout,loading,error}.tsx` and page tests; existing workspace shell and its tests.
Interfaces: server page calls `requireRole('student')`, captures one now, and starts five independently handled loaders concurrently. `ProgressOverview` consumes nullable section values; no query parameter can change identity. Retry refreshes the page using a visible pending state.

- [x] Write/run failing component/page tests for totals/zero/empty/error, each independent failure, private user selection, and safe title/link rendering.
- [x] Implement restrained cards, a labelled native progress indicator, future deadlines and five recent own activity rows with View all links; add My progress to authenticated navigation only.
- [x] Add loading/error/retry UI with visible pending state and existing theme classes, retaining Assignments landing behavior.
- [x] Run focused and full unit/type/lint/format checks; commit verified UI milestone.

## Task 3: Acceptance, documentation and review

Files: `tests/e2e/student-progress.spec.ts`, optional feature-specific fixture helper; guides, dated summary and OpenSpec artifacts.

- [x] Verify real synthetic student/peer/instructor/signed-out paths, exact total beyond row limit, late/hidden/publication states, recent ordering, responsive/theme/navigation behavior and no source/rubric/private-grade leakage.
- [x] Update User Guide only for verified behavior and Developer Guide with module/data/testing details. Record real checks, failed attempts and limitations; human review pending.
- [x] Run applicable coverage/build/browser/database/site/scaffold/spec checks and a bounded independent read-only whole-branch review; fix material findings.
- [ ] Commit/push, wait branch CI, create issue-linked PR to develop, and verify all final-head checks. Do not merge or claim deployment.

## Execution ledger

- Pre-flight: task 2 consumes task 1's nullable summaries and lists; task 3 verifies real identity/query semantics for both. Shared interfaces match this design.
- Ruling: work in the existing dedicated feature branch; do not create a second worktree or modify the unrelated generated-file edit.
- Ruling: exact counts are independent reads, not a transaction snapshot; reject impossible count combinations and provide retry. Current published visibility is the total's scope.
