## 1. Contracts and feasibility

- [ ] 1.1 Finish personal names, remaining shared-task ownership and coordination budget; retain requester-owned bootstrap/student work and teammate-owned auth/migrations/assignment creation/AI gateway.
- [ ] 1.2 Evaluate browser Python/Java candidates including Java source compilation, licensing and cold/warm behavior.
- [ ] 1.3 Prove credential/network isolation, cancellation, output limits and supported browsers before package selection.
- [ ] 1.4 Obtain teammate acknowledgment and map student contract v1 to actual schema/auth interfaces and atomic persistence; requester-authorized API types/limits/errors/retry decisions are in the design. XP/deadline decisions remain separate product work.

## 2. Fresh foundation

- [x] 2.1 Requester bootstraps Next.js/TypeScript/Tailwind/shadcn under src with pnpm, locked dependencies and shared tooling; keep auth/migration/gateway implementation with teammate.
- [ ] 2.2 Configure fresh local Supabase, auth, trusted roles, profiles and RLS tests.
- [ ] 2.3 Add formatting, lint, types, unit, database, browser and build checks to CI.

## 3. Assignments and execution

- [ ] 3.1 Implement teammate-owned assignment creation/private rubrics and requester-owned student browsing; student work is detailed in task group 7.
- [ ] 3.2 Implement isolated browser Python/Java adapters with stdin, diagnostics, stop and rerun.
- [ ] 3.3 Implement immutable code submission revisions and authorized history through teammate-owned migrations and student integration in task group 7.
- [ ] 3.4 Implement version-checked grade publication with atomic idempotent XP adjustment.
- [ ] 3.5 Test access boundaries, private grading data, revision races, forged run results and both languages.

## 4. SoCLaaS features

- [ ] 4.1 Verify provider access/limits and define application budgets/failure handling.
- [ ] 4.2 Implement shared server-only gateway, separate role contexts and validated output contracts.
- [ ] 4.3 Implement scoped cache, atomic quotas, timeouts and sanitized usage metadata.
- [ ] 4.4 Integrate student hints and instructor suggestions with explicit publication approval.
- [ ] 4.5 Test malformed output, XSS, role/cache leakage, quota races and provider failures.
- [ ] 4.6 Run bounded live adversarial/quality evaluations and record limitations.

## 5. Community and XP

- [ ] 5.1 Implement text threads/replies with authorization and input/request limits.
- [ ] 5.2 Implement deterministic leaderboard and synthetic local student/award seeds.
- [ ] 5.3 Verify duplicate/concurrent publication and corrections cannot inflate XP.

## 6. Review, evidence and release

- [ ] 6.1 Execute authorized specialist coordination and independent reviews with actual handoff evidence.
- [ ] 6.2 Compare context and development handoff strategies with measured quality/resource results.
- [ ] 6.3 Update guides, verified session summaries, individual reflections and acknowledgements.
- [ ] 6.4 Configure separate environments and team-managed deployment/migrations/recovery.
- [ ] 6.5 Add fresh Docusaurus site tooling and publish reviewed product website to GitHub Pages.
- [ ] 6.6 Verify deployed role journeys, both languages, AI failure behavior and security controls.
- [ ] 6.7 Complete human review, strict validation, archival/spec synchronization and master release before deadline.

## 7. Issue #5 student assignment browsing and submissions

This is the detailed checklist for the student portions of 3.1, 3.3 and 3.5, not a second implementation of them. Requester owns student integration; teammate owns shared auth, migrations/RLS, assignment creation and AI gateway. These tasks remain unchecked until delivered and verified. The design's dependency gates apply before persistence integration.

- [ ] 7.1 Verify requester-owned bootstrap and teammate delivery against student contract v1: requireStudent/getUser, protected roles/RLS, DTOs/routes, 32 KiB byte bound, errors, and atomic request_id/revision handling; record compatibility changes before integration.
- [ ] 7.2 Prepare synthetic published Python/Java and draft assignments plus two student fixtures using the shared schema; keep any temporary fixture adapter out of production paths.
- [ ] 7.3 Implement student published assignment list/detail with loading, empty, unavailable and error states through shared session/data services.
- [ ] 7.4 Implement source entry, assignment language and agreed input validation with pending/success/failure states; preserve input on failure and render source as text.
- [ ] 7.5 Integrate authenticated submission creation with server-derived identity/revision/time and an authoritative success response; implement agreed retry behavior without overwrites.
- [ ] 7.6 Display only the current student's immutable revision history and verify resubmission preserves prior source.
- [ ] 7.7 Test signed-out access, cross-student read/write and forged student/revision fields through actual local auth, routes and database policies; coordinate migration/policy fixes with teammate.
- [ ] 7.8 Test python/java, exact UTF-8 byte boundaries and multibyte source, strict bodies/queries, Origin, language mismatch, assignment unpublication, hidden grading data, identical/different-payload retries and concurrent revision allocation.
- [ ] 7.9 Run applicable checks and independent review, update only verified user-guide behavior, record session evidence/limitations and prepare a PR to develop referencing issue #5. Do not close the milestone on fixture-only results.
- [x] 7.10 Deliver the separate development-only synthetic list/detail preview with state/navigation tests and production denial; this partial UI milestone does not complete shared-auth tasks 7.2/7.3.
