# Email or username sign-in implementation plan

> For agentic workers: execute inline with executing-plans and TDD, followed by one fresh source/security reviewer. Requester explicitly approved implementation; do not request another execution-method confirmation.

**Goal:** Authenticate by email or case-insensitive unique username and record fresh student acceptance/security evidence.
**Architecture:** Database-owned normalized profile keys and a unique claimed-key index preserve legacy reservations. A server-only metadata client normalizes identifiers, reserves HMAC-keyed attempts and resolves usernames; a publishable-key SSR client authenticates passwords/cookies. Existing profile and signup UI enforce the same name constraints without gaining role authority.
**Stack:** Existing Node 24, Next.js 16.4.3/React, Supabase SSR/Postgres, Zod, Vitest, pgTAP and Playwright; no packages added.
**Spec:** [approved design](2026-11-03-username-sign-in-design.md), active `build-programming-platform`.

## Global constraints

- Preserve unrelated `next-env.d.ts` edit; no courses, hosted writes, real student data, database reset, provider calls or server execution of source.
- Names: trimmed 1–80 characters, no @/NUL/control, database lowercasing. Existing duplicates/ineligible names retain email login and explicit rename/claim workflow.
- Server-only `SUPABASE_SERVER_SECRET_KEY` for narrow metadata RPCs; separate `AUTH_RATE_LIMIT_SECRET` for HMAC. No privileged session creation or exposed email lookup.
- Limit to ten accepted attempts/identifier/minute and sixty globally/minute; database-atomic windows, no plaintext identifier counters, safe errors/Retry-After and no fail-open route.

## Review focus

### 3 November user steering: visible pending actions

The requester explicitly asked to continue and add loading feedback to sign-in,
registration, password recovery and other asynchronous buttons. Implement inline:

- Add a shared pending button with a decorative spinner, `aria-busy`, disabled
  duplicate clicks and an action-specific label, preserving existing styles.
- Keep authentication pending through route transitions; catch thrown signup
  failures. Show a delayed, friendly notice for slow account requests. Do not
  automatically retry mutations or claim the Vercel delay's root cause is known.
- Reuse current busy state for saves, forum posts, reviews, practice runs, test
  publishing and user loading; use `useFormStatus` for Next Form searches and
  comparison. Local toggles retain immediate behavior.
- Verify pending/success/failure paths with deferred requests, a real form-status
  harness and the existing regression suites before recording completion.

- Two concurrent signups or direct profile writes claim the same case variant: one winner, no bypass via user metadata or canonical-column writes.
- Legacy duplicates resolve/rename/delete: last owner must explicitly claim, fully abandoned name becomes available.
- Unknown or accidentally provisioned dummy identity must never create an authenticated session/cookies.
- HMAC keys use database normalization, so case/space changes cannot evade limits.
- Configuration/provider failure, server cookie writes and auth-state refresh preserve role/account privacy and draft cleanup.

## Task 1: Database identity and attempt boundaries

Files: generated `supabase/migrations/20261103030047_username_sign_in.sql`, new `supabase/tests/database/username_sign_in.test.sql`; update conflicting synthetic fixture assumptions only where necessary.
Interfaces: own-profile `username_key` (reservation) and `login_username` (claimed or null), protected from direct client update; private normalizer/trigger, unique claimed-key index; service-only `normalize_login_identifier(text)`, `reserve_login_attempt(text)` -> `{allowed,retry_after}`, `resolve_login_email(text)` -> email/null. Public functions are invoker wrappers around private helpers; explicit grants.

- [x] Add failing-first tests for helpers/claim uniqueness, default accounts, legacy transition, profile RLS/write grants, private RPC grants and atomic quota limits.
- [x] Run local pgTAP red before migration, then implement/apply additively with CLI, without resetting existing data.
- [x] Verify complete database suite and separate parallel-claim probe, advisors/lint; commit schema/spec/evidence milestone.

## Task 2: Sign-in service and UI

Files: `src/features/auth/sign-in-{contracts,service.server}.ts`, `src/lib/supabase/metadata.server.ts`, `src/app/api/auth/sign-in/route.ts`, existing auth form, profile contracts/loader/form/API and tests, `.env.example`.
Interfaces: bounded `{identifier,password}` request; success returns only `{ok:true}`; credential errors generic, service failures 503, limit 429/Retry-After. Unknown username uses stateless dummy Auth request and never sets cookies. Known/email credentials use request-scoped SSR client and verified normal role redirects through existing `/` page.

- [x] Write failing contract/service/route/UI/profile tests, run red and implement the minimum behavior.
- [x] Add profile legacy-message status from own canonical value, race-safe error mapping, and actual Email or username text input. Preserve signup email and password recovery email labels.
- [x] Update affected browser sign-in helpers and synthetic usernames rather than weakening production uniqueness. Run focused units, lint/types/build and commit verified integration.

## Task 3: Fresh acceptance/security evidence and PR

Files: `tests/e2e/username-sign-in.spec.ts`, existing student suites, dated acceptance matrix/log/review, guides, active OpenSpec.

- [x] Exercise actual email/username/case login, duplicate/rename/legacy paths, safe failures/limits/grants, both languages and student draft/history/comparison/grade journeys with synthetic local fixtures.
- [x] Rerun relevant database, unit/coverage, full authenticated browser suite with real Python/Java runtime, app/site build, lint/types/format/spec/scaffold; record exact commit/environment/counts/skips and mocked AI limits.
- [x] Fresh bounded security reviewer; reproduce/fix material findings with tests; update only verified guide behavior and evidence.
- [ ] Push, pass branch CI, create linked PR to develop closing #84, then confirm final-head checks. No coordinator merge/manual deploy.
