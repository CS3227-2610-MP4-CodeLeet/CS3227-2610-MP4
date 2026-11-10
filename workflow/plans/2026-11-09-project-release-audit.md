# Project release audit and verified defect fixes

**Status:** Implemented and locally verified; final branch CI, PR and hosted checks pending

**Branch:** `fix/129-routing-release-audit`, created from updated `develop`

**OpenSpec:** `build-programming-platform`, task groups 37 and 38
**Issues:** [#129 routing and authenticated browser CI](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/129), [#130 AI usage completion and authorization](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/130)

## Goal

Audit the current repository for demonstrable release blockers, fix confirmed defects with regression coverage, reconcile documentation and tracked tasks only against verified current behavior, and report remaining local, hosted, and human verification gates. This work cannot guarantee a course grade or prove the absence of all defects.

## Confirmed scope

1. **Canonical course routing:** authenticated navigation still points to removed `/student/progress` and `/student/grades` pages. Revision history and role-management flows also contain old destinations. Several authenticated Playwright tests still use removed `/instructor/*` routes. Preserve course authorization, migrate the journeys to canonical `/courses/<courseId>/...` routes, and redirect supported old bookmarks only after verifying the signed-in user's record and course.
2. **Authenticated browser CI:** the existing E2E setup exercises mostly anonymous and preview flows; it does not run its authenticated synthetic journeys against the CI-local Supabase service. Add a distinct Docker-host job, constrain fixture credentials to test setup, remove them from both Next.js web servers, and keep credential-bearing traces/artifacts out of CI uploads.
3. **AI usage authorization:** a signed-in caller can reach the usage-finalization RPC for their own pending request and supply a failure result, releasing quota before the server-side provider request completes. The review service currently ignores some usage-accounting failures. Require server-held reservation proof and fail closed.
4. **Current-role access:** instructor review rows are readable by their requester even after their instructor membership has been removed. Keep student feedback history available under its existing policy while rechecking current course authorization for instructor-only rows.
5. **Course workspace theme control:** the new course-scoped header omitted the light/dark toggle. Restore it at the right edge and keep theme selection functional when `matchMedia` is unavailable.
6. **Final-review findings:** a stale course query can redirect the sidebar away from the path's course; authenticated clients can directly insert fabricated AI reviews or forge cache-hit usage. Prefer the canonical path and confine generated reviews/cache-hit accounting to server-authorized database writes.

## Constraints

- Use only synthetic local users/data. Do not reset an existing database or inspect `.env.local`.
- Never send fixture service credentials to a Next.js server, hosted environment, log, trace, screenshot, or uploaded CI artifact.
- Preserve student history, course membership checks, source/rubric privacy, and browser-only Python/Java execution.
- Keep issue scope and ownership focused; no unrelated dependencies or broad redesigns.
- Record commands and outcomes as run, including failures, retries, skips, and limitations. Human/hosted verification stays pending until performed by its owner.

## Verification plan

- Failing-first unit, route, Playwright and pgTAP regressions for each confirmed defect.
- Targeted authenticated routing/browser journeys with local synthetic Supabase.
- Full unit suite, production build, TypeScript, ESLint, Prettier, strict OpenSpec validation, documentation/scaffold checks, database tests and browser suite where available.
- CI on the final source head before opening/updating the PR; final PR-head checks must pass before handoff.
- Reconcile README, User Guide, Developer Guide, workflow brief, and OpenSpec task state against current merged behavior and actual checks. Do not close unrelated or unverified tasks.

## Remaining release gates to report

At minimum, distinguish a successful local/CI build from hosted SMTP, SoCLaaS key-specific limits, live AI provider behavior, production deployment acceptance, final `master` release, and teammate/personal contribution sign-off. Do not describe these as completed without evidence.
