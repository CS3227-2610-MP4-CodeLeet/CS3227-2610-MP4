# Student acceptance and security evidence — 3 November 2026

Issue [#84](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/84); branch `feat/username-sign-in`, baseline merged develop `0aca647`. This is the acceptance record for the approved user request, initially prepared during sign-in design. Fresh local execution is recorded below, including a corrected test-only failure. Hosted/live-AI checks remain unverified; mocked responses are not provider-security proof.

## Execution identity

- Application source: username integration `6184c4d` plus the loading-feedback continuation on `feat/username-sign-in`. Final commit and CI links are recorded on the PR; prior source/test corrections are preserved below.
- Environment: local Supabase plus production-build Next.js on port 3100 and isolated fixture dev server on 3101; hosted run pending
- Tools: Node 24.22.1, project pnpm 12.15.0, Playwright 1.64.1, actual Chromium 156.0.8078.4
- Participants: coordinator Codex; independent design/source review and human verification separately recorded in the session log
- Accounts/data: synthetic only; no credentials, cookies, real student source, private prompts or service keys in this record

## Acceptance matrix

| Journey / boundary                                                          | Existing evidence to reuse and extend                                                                                                  | Fresh result                                                                             |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Email and unique username sign-in; case variants; sign-out                  | Existing auth/account browser tests plus new username tests after design approval                                                      | Passed: real local email/case-varied username sessions, both roles                       |
| Duplicate signup/profile races, legacy names, immediate rename behavior     | New transactional pgTAP and auth/profile API/browser cases                                                                             | Passed: database, real browser and actual two-transaction claim probe                    |
| Private username lookup and login request limits                            | New grant/role, same-origin, bounded-body, HMAC/counter, safe error and missing-config tests                                           | Passed: unit/database and local API/browser; provider 429/5xx classification mocked      |
| Published assignments, own source and fixed language                        | `tests/e2e/java-assignments.spec.ts`, `my-submissions.spec.ts`                                                                         | Passed: authenticated local browser                                                      |
| Real Python/Java compilation/execution with stdin                           | Java assignment journeys with `RUN_AUTHENTICATED_RUNTIME_TESTS=1`; standalone lab checks remain separately opt-in                      | Passed: real local runtime; standalone lab opt-ins skipped                               |
| Refresh/tab-close recovery, account/tab isolation and sign-out cleanup      | `tests/e2e/draft-autosave.spec.ts`, `unsaved-code.spec.ts`                                                                             | Passed: local browser, including actual two-tab account switch regression                |
| Submit/retry/in-flight edits, immutable own history                         | `continue-editing.spec.ts`, `my-submissions.spec.ts`, unit source-bound retry tests                                                    | Passed: local browser and unit                                                           |
| Compare own revisions and reject peer/mismatched selections                 | `tests/e2e/compare-revisions.spec.ts`, comparison route/query tests                                                                    | Passed: local browser/query/route                                                        |
| Own published grades only; hidden drafts and peer records                   | `tests/e2e/student-grades.spec.ts`, transactional RLS tests                                                                            | Passed: local browser/database                                                           |
| Student AI feedback presentation and instructor publication                 | `tests/e2e/codementor-mvp.spec.ts` intercepts AI endpoints with synthetic responses; it does not call SoCLaaS                          | Passed: latest broad run and earlier targeted MVP correction; AI mocked, no SoCLaaS call |
| AI role/identity, source/rubric injection, invalid output and safe failures | `src/lib/ai/review-route.test.ts`, `src/features/codementor/context.test.ts`, `contracts.test.ts`, `review-service.test.ts`, MVP pgTAP | Passed: current unit/database checks; real provider resistance unverified                |
| Mobile/theme/keyboard and safe source/feedback rendering                    | Existing account/workspace and relevant student browser journeys                                                                       | Passed: local browser                                                                    |

## Loading-feedback continuation results

The requester subsequently asked for visible progress throughout account and
application actions. New source adds shared spinners/disabled busy state,
action-specific account labels, a ten-second account notice, transition-aware
authentication navigation, and thrown-signup failure recovery. Existing local
toggles remain immediate; there is no automatic mutation retry.

- Fresh local full browser run: **95 passed, one failed, seven skipped out of
  103 in 8.4 minutes**. All twelve new account/loading cases passed, including
  real successful sign-in with its destination RSC deliberately held. Real
  Python/Java execution, MVP grade flow, forums, drafts and privacy cases passed.
- The failed Python authored-practice case hit `ECONNRESET` in a test-side GET
  of published cases after publication. Its Java counterpart passed. The
  unchanged, real-runtime Python targeted rerun passed in 20.5 seconds; no
  timeout increase, automatic retry or product workaround was added. One first
  rerun selector matched no tests; the corrected selector ran the case.
- All 96 runnable cases therefore have passing evidence across the broad run
  and isolated rerun. This is not a claim of a clean 103-case full rerun or a
  diagnosis of the user's hosted delay. Seven prerequisite skips remain the
  standalone runtime-lab/email opt-ins described below.
- Fresh database rerun: 321 assertions/eleven files passed. The initial attempt
  could not connect because Docker was stopped; starting the existing stack
  restored the prerequisite without resetting data.
- Final units/coverage: 619 tests/108 files passed; coverage was 84.05% statements,
  79.03% branches, 85.61% functions and 86.13% lines. App/site builds and
  lint/types/format passed. A scan of 39 final browser JavaScript files found
  neither configured server-only value, without printing the values. Final-head
  CI remains a separate check.
- Read-only source reviewer `/root/pending_action_review` found no material
  defect and requested the successful delayed-navigation check, now passed.
  The reviewer ran no tests; coordinator evidence above is separate.

## Earlier results and corrections before loading-feedback continuation

- Database: 321 assertions/eleven files passed, including 39 new username/attempt checks. Two actual concurrent case-variant claims produced exactly one winner; only the two known probe users were removed. Advisors found no issues; db lint retained an unrelated existing practice-case UUID-array warning.
- Units: 613 tests/106 files passed; coverage 83.54% statements, 78.52% branches, 84.98% functions, 85.47% lines.
- Full local Chromium run on the corrected app build: **91 passed, one failed, seven skipped out of 99 in 8.9 minutes**. The failure was the pre-existing MVP test's reused username, now invalid under the new uniqueness policy. All eight new sign-in cases, both actual Python/Java assignment/runtime journeys and the other student/grade/revision/privacy cases passed in that run.
- Corrected the MVP fixture to use a unique username and clean its own known accounts/coursework. An initial real-runtime rerun saved correctly but checked history before the RSC refresh committed; the no-runtime diagnostic run passed. Replaced the premature history check with waiting for the actual non-prefetch refresh response, without changing production code. The corrected **real-runtime MVP targeted rerun passed (one test, 27.7 seconds)**, including mocked student/instructor AI presentation and explicit grade publication/viewing.
- Thus all 92 runnable cases have passing evidence across the broad run and corrected targeted rerun; this is **not** represented as a clean all-case rerun at the final test-fixture revision. No product source changed between that broad run and its targeted fixture correction. The later user-requested loading changes are covered separately below. Avoided repeating the entire browser suite for a test-only correction, while preserving the original failure and its actual resolution.
- Seven local skips: six separately opt-in standalone runtime-lab checks and one separately opt-in local email recovery journey. Actual authenticated Python/Java execution was enabled through `RUN_AUTHENTICATED_RUNTIME_TESTS=1` and is distinct from those skips.
- App/runtime and website builds passed. A scan of 39 current built browser JavaScript files found neither configured server-only value, without printing them. Lint/types/format and strict OpenSpec/scaffold/local-link checks passed; final PR CI is recorded on the issue/PR.

## Release checks kept separate

- Hosted URL/commit, applied migrations and distinct development/production configuration: unverified here.
- Real provider feedback quality/security, key-specific live quotas and provider outages: unverified here; mocked API tests are not provider evidence. The earlier bounded SoCLaaS experiment remains historical evidence only.
- Hosted confirmation/reset email and redirect behavior: unverified here; local email checks require their explicit opt-in.
- Cross-course membership and workspace isolation: teammate's planned course feature, not implemented or tested by this change.
- Human review of generated evidence/reflections and final release/master: pending.

## Baseline evidence, explicitly historical

Draft-recovery PR #83 recorded 581 unit passes and 84 local browser passes/seven prerequisite skips before merge. Its CI ran 29 browser passes/62 prerequisite skips. These numbers identify prior evidence and are **not a fresh run of this sign-in change**. See [draft evidence](2026-11-02-draft-autosave-review.md) and the [earlier cross-feature audit](2026-11-02-security-testing.md).

## Reproduction and recording rules

Use pinned Node 24/pnpm, local synthetic fixtures and current additive migrations. Do not reset an existing database. Supply any test-only privileged key only to the test process; the new reviewed server metadata client, has its own explicit server-only configuration and must never use a public variable. No live provider call or hosted mutation is authorized by a local acceptance command.

Record exact commands, commit, counts, failures/retries and skip prerequisites after actual execution. Sanitized pass/fail summaries belong here; credentials, raw traces with auth headers and source/prompt payloads do not. A failed prerequisite stays unverified instead of being counted as a passing journey.
