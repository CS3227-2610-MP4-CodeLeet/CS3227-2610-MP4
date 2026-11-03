# Course Workspaces Implementation Plan

> For agentic workers: use the executing-plans skill. Work in focused verified commits on feat/85-course-workspaces. No specialist agents are authorized.

**Goal:** Make courses independent workspaces with per-course roles, email invitations, student join codes, feature controls, safe archival and a faithful legacy archive.

**Architecture:** Separate platform administration from course membership. Course membership governs all course data and feature access through server routes, RPCs and RLS. Build the course foundation and backfill one archived owner-unassigned Legacy course first, then migrate assignments/AI, forums, and XP/leaderboards in stages.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 6.0.3, Supabase Auth/Postgres/RLS, Zod 4.6.7, Vitest 5.0.5, Playwright 1.64.1, pnpm 12.15.0.

**Spec:** openspec/changes/build-programming-platform/specs/course-workspaces/spec.md plus amendments to accounts-and-access, assignments-and-grading, role-aware-ai and community-and-xp.

## Global Constraints

- Users can have different roles in different courses. Course roles are student/instructor; platform admin remains separate.
- Owner and instructors can add instructors and add/remove students. Only owner can remove instructors, transfer ownership, or archive.
- Email invitation or student join code grants membership only after sign-in and server verification of the user's verified email. Join codes are student-only, hashed, rate-limited and rotatable.
- Legacy is archived and owner-unassigned until platform admin assigns an instructor owner. Preserve attribution and existing access; do not invent class boundaries or widen instructor access.
- Assignments, submissions, grades, rubrics, AI, forums, XP and leaderboard access is course-scoped.
- Feature switches enforce routes/data access and preserve records when disabled.
- Archive is read-only. Permanent deletion is owner-only, atomic, confirmed and only for courses with no other members or activity.
- Python and Java execution remain browser-only. No uploads, badges, remote execution, AI tools or model grade publication.
- User Guide updates require verified behavior. Human review remains pending until a teammate reviews.

## Review Focus

- Forged/stale course IDs and direct API/RPC/Data API calls cannot cross course boundaries.
- A person can be a student in one course and instructor in another without a global role granting access.
- Unverified/mismatched emails, expired/revoked/replayed invitations, rotated codes and duplicate acceptance grant no membership.
- Legacy migration preserves per-record attribution/access and leaves the owner pending.
- Concurrent activity cannot race empty-course deletion or ownership transfer; archived data remains readable but immutable.

### Task 1: Schema, authorization and legacy backfill

**Files:** CLI-generated Supabase migration; supabase/tests/database/course_workspaces.test.sql; supabase/seed.sql.

- [ ] Write pgTAP assertions first for roles, memberships, owner transfer/removal, verified invitations/codes, feature and archive gates, deletion races, legacy owner pending, legacy data attribution/access, and cross-course denial.
- [ ] Run focused tests to observe the intended failures.
- [ ] Generate the migration with pnpm exec supabase migration new course_workspaces; never invent its timestamp.
- [ ] Add courses, memberships, feature settings, invitation records, hashed join codes and atomic lifecycle/ownership operations with RLS/RPC checks.
- [ ] Backfill all current content into one archived Legacy course; preserve assignment authorship, forum author data, grades, AI history, XP basis and existing access.
- [ ] Verify focused and existing database suites; commit the foundation.

### Task 2: Invitations, join codes and course APIs

**Files:** src/features/courses/contracts.ts and server modules/tests; src/app/api/courses/; src/app/auth/callback/route.ts and tests; local Supabase Auth configuration as needed.

- [x] Add failing tests for create/list/update, per-role member management, email invite acceptance, verified-email match, join-code rotate/revoke, ownership transfer, archive and empty-only deletion.
- [x] Implement bounded same-origin server routes authorized by verified identity and current course membership; never trust client actor/role/email verification.
- [x] Use Supabase Auth email sign-in links for existing and new addresses; keep invitations pending until the verified account accepts. Avoid account enumeration and log no email/token content.
- [x] Test local delivery and verified callback acceptance in Supabase's local SMTP inbox; hosted SMTP remains an unverified deployment prerequisite.
- [x] Commit the verified API/enrollment stage (`2de0305`).

### Task 3: Course discovery and navigation

**Files:** src/app/courses/; src/features/courses/; src/app/page.tsx; src/app/profile/page.tsx; instructor/student/forum layouts; tests/e2e/course-workspaces.spec.ts.

- [x] Add failing tests for multiple courses, different roles by course, empty/no-course states, archived course and member management.
- [x] Implement course list/create/detail/settings, member management, invite state and join-code entry; invitation acceptance is covered by Task 2.
- [ ] Replace global student/instructor access assumptions with selected-course membership; keep platform admin separate.
- [ ] Verify stale course context fails safely and responsive navigation; commit.

### Task 4: Assignments, grading and AI

**Files:** src/app/api/assignments/, src/app/api/student/assignments/, src/app/api/submissions/, src/app/api/grades/, src/app/api/ai/; related instructor/student pages; src/features/codementor/, student assignment/submission/grade, deadline and practice-test modules; database policies/tests.

- [x] Add failing tests for enrolled student access, course instructor grading, private rubric/grade isolation and cross-course denial.
- [x] Carry course context through assignment CRUD/publication, submissions, grades, practice tests, deadlines, AI authorization/cache and history.
- [x] Verify both Python and Java remain browser-only; commit.

### Task 5: Forums, XP and leaderboard

**Files:** src/features/forums/, assignment-xp/, leaderboard/; src/app/forums/, leaderboard/, student/xp/, api/forums/, api/leaderboard/, api/student/xp/; related migrations/tests.

- [ ] Add failing database/service tests for per-course forum access, XP totals and ranks, plus direct cross-course denial.
- [ ] Scope threads by course and replies via thread; scope XP/leaderboard reads through assignment/course. Preserve legacy access and prevent duplicate XP backfill.
- [ ] Verify and commit this stage.

### Task 6: Feature settings and lifecycle UX

**Files:** src/features/courses/, src/app/courses/, feature layouts/routes/APIs/RPCs; tests/e2e/course-workspaces.spec.ts.

- [ ] Add failing tests that disabled features deny direct actions while preserving records.
- [ ] Expose switches for shipped features only: assessments, AI, discussions, XP and leaderboard.
- [ ] Implement owner-only archive and confirmatory empty-course deletion; verify archived read-only behavior and lifecycle races.
- [ ] Verify and commit this stage.

### Task 7: Closeout

**Files:** docs/UserGuide.md only for verified behavior; OpenSpec tasks; logs/2026-11-03-course-workspaces.md; E2E tests.

- [ ] Run focused unit/database/browser checks per stage, then applicable lint, types, format, build, strict OpenSpec and scaffold checks.
- [ ] Verify multiple isolated courses, mixed roles, email/code enrollment, ownership transfer, feature gates, archive/delete and legacy access.
- [ ] Record exact commit, commands, skips, hosted SMTP/acceptance limits and absence of independent review.
- [ ] Update only verified guide behavior. Push after applicable CI passes; create/update a PR to develop linking issue #85, OpenSpec, plan and log.
