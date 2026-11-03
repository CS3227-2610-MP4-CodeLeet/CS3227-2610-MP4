# Student acceptance and security evidence — 3 November 2026

Issue [#84](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/84); branch `feat/username-sign-in`, baseline merged develop `0aca647`. This is the acceptance record for the approved user request, initially prepared during sign-in design. **Fresh execution has not yet occurred for this change.** Do not treat planned checks, historical results or mock responses as passes.

## Execution identity

- Tested commit: pending implementation/verification
- Environment: planned local Supabase plus production-build Next.js app; hosted run pending
- Node/pnpm/browser versions: capture from actual execution
- Participants: coordinator Codex; independent design/source review and human verification separately recorded in the session log
- Accounts/data: synthetic only; no credentials, cookies, real student source, private prompts or service keys in this record

## Acceptance matrix

| Journey / boundary                                                          | Existing evidence to reuse and extend                                                                                                  | Fresh result                 |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| Email and unique username sign-in; case variants; sign-out                  | Existing auth/account browser tests plus new username tests after design approval                                                      | Not run                      |
| Duplicate signup/profile races, legacy names, immediate rename behavior     | New transactional pgTAP and auth/profile API/browser cases                                                                             | Not implemented/run          |
| Private username lookup and login request limits                            | New grant/role, same-origin, bounded-body, HMAC/counter, safe error and missing-config tests                                           | Not implemented/run          |
| Published assignments, own source and fixed language                        | `tests/e2e/java-assignments.spec.ts`, `my-submissions.spec.ts`                                                                         | Not run                      |
| Real Python/Java compilation/execution with stdin                           | Java assignment journeys with `RUN_AUTHENTICATED_RUNTIME_TESTS=1`; standalone lab checks remain separately opt-in                      | Not run                      |
| Refresh/tab-close recovery, account/tab isolation and sign-out cleanup      | `tests/e2e/draft-autosave.spec.ts`, `unsaved-code.spec.ts`                                                                             | Not run                      |
| Submit/retry/in-flight edits, immutable own history                         | `continue-editing.spec.ts`, `my-submissions.spec.ts`, unit source-bound retry tests                                                    | Not run                      |
| Compare own revisions and reject peer/mismatched selections                 | `tests/e2e/compare-revisions.spec.ts`, comparison route/query tests                                                                    | Not run                      |
| Own published grades only; hidden drafts and peer records                   | `tests/e2e/student-grades.spec.ts`, transactional RLS tests                                                                            | Not run                      |
| Student AI feedback presentation and instructor publication                 | `tests/e2e/codementor-mvp.spec.ts` intercepts AI endpoints with synthetic responses; it does not call SoCLaaS                          | Not run; mocked AI scope     |
| AI role/identity, source/rubric injection, invalid output and safe failures | `src/lib/ai/review-route.test.ts`, `src/features/codementor/context.test.ts`, `contracts.test.ts`, `review-service.test.ts`, MVP pgTAP | Not run; unit/database scope |
| Mobile/theme/keyboard and safe source/feedback rendering                    | Existing account/workspace and relevant student browser journeys                                                                       | Not run                      |

## Release checks kept separate

- Hosted URL/commit, applied migrations and distinct development/production configuration: unverified here.
- Real provider feedback quality/security, key-specific live quotas and provider outages: unverified here; mocked API tests are not provider evidence. The earlier bounded SoCLaaS experiment remains historical evidence only.
- Hosted confirmation/reset email and redirect behavior: unverified here; local email checks require their explicit opt-in.
- Cross-course membership and workspace isolation: teammate's planned course feature, not implemented or tested by this change.
- Human review of generated evidence/reflections and final release/master: pending.

## Baseline evidence, explicitly historical

Draft-recovery PR #83 recorded 581 unit passes and 84 local browser passes/seven prerequisite skips before merge. Its CI ran 29 browser passes/62 prerequisite skips. These numbers identify prior evidence and are **not a fresh run of this sign-in change**. See [draft evidence](2026-11-02-draft-autosave-review.md) and the [earlier cross-feature audit](2026-11-02-security-testing.md).

## Reproduction and recording rules

Use pinned Node 24/pnpm, local synthetic fixtures and current additive migrations. Do not reset an existing database. Supply any test-only privileged key only to the test process; the new reviewed server metadata client, once approved/implemented, has its own explicit server-only configuration and must never use a public variable. No live provider call or hosted mutation is authorized by a local acceptance command.

Record exact commands, commit, counts, failures/retries and skip prerequisites after actual execution. Sanitized pass/fail summaries belong here; credentials, raw traces with auth headers and source/prompt payloads do not. A failed prerequisite stays unverified instead of being counted as a passing journey.
