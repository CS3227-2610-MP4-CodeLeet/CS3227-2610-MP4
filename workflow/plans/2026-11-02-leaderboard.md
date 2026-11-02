# Leaderboard implementation plan

> **For agentic workers:** Use the repository executing-plans skill inline, then one fresh bounded branch review. Do not delegate implementation without further authorization.

**Goal:** Signed-in students/instructors see trusted XP rankings, with shared ranks and private own position.

**Architecture:** A private, role-checked security-definer read projection aggregates existing awards in one SQL statement; public invoker RPC/API expose only validated bounded DTOs. Server-rendered pages reuse existing student/instructor shells and exact XP formatting. No persisted ranking cache or new dependencies.

**Tech stack:** Node 24.22.1, pinned pnpm 12.15.0, Next/React/TypeScript, Supabase/PostgreSQL, Vitest/pgTAP/Playwright.

**Spec:** [Approved design](2026-11-02-leaderboard-design.md), issue #80, OpenSpec build-programming-platform task group 28/task5.2. Requester approved shared ranks and full design on 2 November. XP PR #79 merged into develop a42179d; planning-only conflicts were resolved retaining both changes.

## Global constraints and review focus

- Shared competition ranks 1,1,3; positive-XP current students only; username/XP/rank, never raw IDs/emails/private records.
- 25 rows/page, page1–10000; exact decimal strings for XP/rank; case-insensitive username then private UUID provides stable within-tie ordering.
- One snapshot for page and own rank; zero-XP own summary is unranked, instructors/admins have null own summary.
- Keep profile/award RLS and all write paths unchanged. Empty search path and member checks on every privileged entry; no anonymous/unprovisioned access.
- Test ties crossing pages, duplicate/markup names, exact totals, own position off-page, role changes and correction/withdrawal effects. Read failures must not become fabricated empty data.
- Scope fixtures to explicit synthetic IDs; no reset, real data, provider calls or manual deployment. Separate source-free projection tests from actual UI/role tests.

## Task 1: Read projection and security

Files: `supabase/migrations/20261102071000_leaderboard.sql`, `supabase/tests/database/leaderboard.test.sql`.

- [x] Write pgTAP tests for missing RPC, rank ties across 25-row pages, deterministic duplicate names, exact aggregate totals, zero/own/instructor summaries and role/profile/award isolation. Run and observe failure before migration.
- [x] Add `leaderboard_private.read_page(p_page integer)` with explicit role check, fixed search path and one CTE aggregate/rank/page/own statement; expose `public.get_leaderboard(p_page integer default1)` invoker wrapper. Revoke PUBLIC/anon access and allow authenticated only the narrow read function/schema usage. No new table grants or mutations.
- [x] Apply additive local migration without reset; run complete DB suite and verify grants/direct peer reads and XP recalculation remain correct. Commit verified milestone.

## Task 2: Validated API and page

Files: `src/features/leaderboard/{contracts,queries.server,components}.{ts,tsx}` and tests; `src/app/api/leaderboard/route.ts` and test; `src/app/leaderboard/{layout,page,loading,error}.tsx`; student workspace/instructor navigation and tests.

- [x] Failing-first tests: strict projection rejects hidden fields/invalid ranks, API rejects identity/XP selectors and duplicate pages, all member roles accepted, safe503 distinct from empty. DOM tests verify exact large totals, shared ranks, own summary, empty/off-page states and safe text.
- [x] Implement `leaderboardSchema`, `loadLeaderboard(client,page)`, GET-only private-no-store API and protected server page. Reuse verified member guard and existing shells, exact formatter and query/page parser; no client polling/cache. Add working nav/breadcrumb to both roles; keep implementation out of product copy.
- [x] Run focused units/types/lint and relevant existing navigation suites; commit verified API/UI milestone.

## Task 3: Browser evidence, documentation and closeout

Files: `tests/e2e/helpers/leaderboard-fixtures.ts`, `tests/e2e/leaderboard.spec.ts`, existing exact-navigation assertions, guides/brief/site status, log and scoped review evidence.

- [x] Seed bounded local synthetic users/assignments and publish grades through authorized RPCs; verify shared ranks, own row, owner view, correction/max-XP/withdrawal changes, stable paging, safe names and mobile/theme. Cleanup only fixture IDs.
- [x] Request fresh bounded source/security review per repository skill; fix concrete findings and rerun justified checks. Record exact review scope and actual participants without inventing independent suite runs.
- [x] Complete full unit coverage, DB, production/runtime/site build, relevant full browser suite, lint/format/types, scaffold and strict OpenSpec. Update current guides and sanitized chronological log with failures/skips and hosted limitations.
- [ ] Push verified commits, pass branch CI, create linked PR to develop (Closes #80), finish task records and verify final-head CI. Do not merge or apply hosted migrations.
