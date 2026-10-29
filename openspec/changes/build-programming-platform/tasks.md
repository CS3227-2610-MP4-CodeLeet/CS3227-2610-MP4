## 1. Contracts and feasibility

- [ ] 1.1 Record personal names and coordination budget; responsibility notes identify primary accountability only, and either member may implement any task.
- [x] 1.2 Evaluate browser Python/Java candidates including Java source compilation, licensing and cold/warm behavior. See runtime-feasibility evidence: Python candidate retained; Java buffered input resolved in the local lab with first-party compatibility classes; provenance/distribution and production integration remain open, so no production Java runtime selected.
- [ ] 1.3 Prove credential/network isolation, cancellation, output limits and supported browsers before package selection.
- [ ] 1.4 Map student contract v1 to the implemented schema/auth interfaces and atomic persistence; requester-authorized API types/limits/errors/retry decisions are in the design. XP/deadline decisions remain separate product work.

## 2. Fresh foundation

- [x] 2.1 Bootstrap Next.js/TypeScript/Tailwind/shadcn under src with pnpm, locked dependencies and shared tooling.
- [x] 2.2 Configure fresh local Supabase, signup defaults, trusted roles, profiles and RLS tests. Verified clean `pnpm db:reset`; all 9 pgTAP access checks pass with `pnpm db:test`.
- [x] 2.3 Add formatting, lint, types, unit, database, browser, application-build and product-site-build checks to CI. Application checks remain in the Playwright container job; a separate job starts local Supabase and runs pgTAP, with cleanup on success or failure.
- [x] 2.4 Install `eslint-plugin-sonarjs` 4.2.2 as an exact development dependency and configure only the eight requested maintainability rules.
- [x] 2.5 Refactor student UI and browser-client functions in `src/features/student-assignments/components.tsx`, `workspace-shell.tsx`, `src/features/student-submissions/code-entry.tsx`, `practice-results.tsx`, `practice-runner.tsx` and `browser-client.ts` to satisfy the selected limits without changing visible behavior.
- [x] 2.6 Refactor runtime functions in `src/runtime-lab/embed.mjs`, `java-support.mjs`, `lab.mjs`, `server.mjs`, `supervisor.mjs` and `worker.mjs` to satisfy the selected limits while preserving browser isolation and runner behavior.
- [x] 2.7 Refactor repeated literals and remaining limits in `src/features/student-submissions/practice-tests.test.ts`, `tests/e2e/assignment-preview.spec.ts`, `tests/e2e/browser-runtime.spec.ts` and the three affected `workflow/scripts/*.mjs` files.
- [x] 2.8 Verify `pnpm lint`, typecheck, unit tests and non-opt-in preview E2E journeys: lint/typecheck passed, 31 unit tests passed and 14 E2E tests passed. Four real-runtime E2E tests remain skipped because reviewed local runtime assets are not present.
- [ ] 2.9 With reviewed local runtime assets available, run the four opt-in Python/Java browser-runtime E2E journeys and record the results.
- [x] 2.10 Remove Corepack command wrappers from package scripts and contributor/user docs; keep the exact `packageManager` pnpm pin and use direct `pnpm` invocations.
- [x] 2.11 Pin Node.js to the latest Node 24 LTS patch available on 28 October 2026 (`24.22.1`) in `.node-version`; make CI and documentation use that pin and retain the Node 24 engine range.
- [x] 2.12 Update repository and contributor workflow to require a matching GitHub issue, OpenSpec artifacts, relevant Superpowers skills, focused Conventional Commits, a reviewed/sanitized `logs/` summary, and a linked PR after verification. Reuse existing foundation issue #11 and PR #12.
- [x] 2.13 Verify no Corepack invocations remain, run applicable formatting/lint/type/unit checks and strict OpenSpec validation, create per-change summaries for the ESLint and current tooling/workflow updates, then push and update linked issue #11 / PR #12. Record installed Node v24.16.0 and the difference from `.node-version` 24.22.1.

## 3. Assignments and execution

- [ ] 3.1 Implement assignment creation/private rubrics and student browsing; student work is detailed in task group 7.
- [ ] 3.2 Implement isolated browser Python/Java adapters with stdin, diagnostics, stop and rerun.
- [ ] 3.3 Implement immutable code submission revisions and authorized history through the agreed schema and student integration in task group 7.
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
- [x] 6.8 Install and review the Superpowers, Supabase and selected Vercel agent skills under `.agents/skills`, record source hashes in `skills-lock.json`, and exclude credential-disclosure guidance.

## 7. Issue #5 student assignment browsing and submissions

This is the detailed checklist for the student portions of 3.1, 3.3 and 3.5, not a second implementation of them. Work areas are coordinated but not exclusive; either member may implement shared auth, migrations/RLS, assignment creation, AI gateway or student integration. These tasks remain unchecked until delivered and verified. The design's dependency gates apply before persistence integration.

- [ ] 7.1 Verify the shared implementation against student contract v1: requireStudent/getUser, protected roles/RLS, DTOs/routes, 32 KiB byte bound, errors, and atomic request_id/revision handling; record compatibility changes before integration.
- [ ] 7.2 Prepare synthetic published Python/Java and draft assignments plus two student fixtures using the shared schema; keep any temporary fixture adapter out of production paths.
- [ ] 7.3 Implement student published assignment list/detail with loading, empty, unavailable and error states through shared session/data services.
- [ ] 7.4 Implement source entry, assignment language and agreed input validation with pending/success/failure states; preserve input on failure and render source as text.
- [ ] 7.5 Integrate authenticated submission creation with server-derived identity/revision/time and an authoritative success response; implement agreed retry behavior without overwrites.
- [ ] 7.6 Display only the current student's immutable revision history and verify resubmission preserves prior source.
- [ ] 7.7 Test signed-out access, cross-student read/write and forged student/revision fields through actual local auth, routes and database policies; coordinate shared policy fixes with affected implementers.
- [ ] 7.8 Test python/java, exact UTF-8 byte boundaries and multibyte source, strict bodies/queries, Origin, language mismatch, assignment unpublication, hidden grading data, identical/different-payload retries and concurrent revision allocation.
- [ ] 7.9 Run applicable checks and independent review, update only verified user-guide behavior, record session evidence/limitations and prepare a PR to develop referencing issue #5. Do not close the milestone on fixture-only results.
- [x] 7.10 Deliver the separate development-only synthetic list/detail preview with state/navigation tests and production denial; this partial UI milestone does not complete shared-auth tasks 7.2/7.3.
- [x] 7.11 Deliver development-only source entry with fixed language, byte counter, input-preserving local validation and disabled/unconnected submission; verify unit/browser boundaries without claiming real task 7.4/7.5 completion.
- [x] 7.12 Deliver an additional opt-in local browser Run/published-tests preview with synthetic cases, deterministic output matching, separate execution/compile deadlines, stop/rerun, real Python/Java browser checks, production denial and public-case publication contract. This does not complete production task 3.2 or teacher persistence.
- [x] 7.13 Adapt the Coursemology-inspired student workspace: compact assignment rows, responsive navigation, problem above editor/run panels, readable public test results and honest preview state; verify mobile/desktop and existing Python/Java journeys without changing execution/security or shared service contracts.
- [x] 7.14 Add an accessible workspace light/dark toggle with system default, browser-local preference and storage-failure recovery; preserve editor/run state and verify persistence, keyboard/mobile use and readable theme-aware input/results.
- [x] 7.15 Simplify workspace spacing and run panels; remove the visible Stop action while preserving deadlines/unmount cleanup, group Menu and theme at the far right on all screen sizes, and verify the revised navigation/run journeys.
- [x] 7.16 Issue #15: share theme with account pages, add independent password visibility and signup confirmation, provide failure-aware sign-out in authenticated workspace, remove redundant Home navigation and sample labels from real data, and connect opt-in development-only browser practice to the real Python submission editor with verified regressions. Preserve production runtime gates and existing submission limits.
- [x] 7.17 Issue #15 / PR #16 follow-up: share a native source editor with Python/Java syntax colours and synchronized line numbers between authenticated submissions and practice, preserving source, validation, both themes, accessibility, local-only typing and existing run/submit contracts. Verify token colours, scroll alignment, mobile fit and regression journeys.
- [x] 7.18 Issue #15 / PR #16 branding correction: use CodeLeet in visible app copy/metadata and Username in registration, preserving existing profile storage and email-based authentication; verify current browser/account journeys.
- [x] 7.19 Issue #15 / PR #16 Run copy refinement: remove the Run details disclosure and redundant completion/practice-feedback sentence, retaining output/results, progress and actionable errors; verify existing run behavior.
- [x] 7.20 Issue #15 / PR #16 editor indentation: support Tab/Shift+Tab and language-aware Enter in the shared Python/Java editor, preserving selection, undo, limits and an accessible keyboard focus exit; verify real submission integration.
- [x] 7.21 Issue #15 / PR #16 email password recovery: add email request, generic acknowledgement/rate handling, fixed PKCE callback routing, server-verified new-password/confirmation form and sign-in after update; verify real local email recovery, failures and access/redirect boundaries.

## 8. Issue #17 Java assignment/submission integration

- [x] 8.1 Add Python/Java contract and instructor selection with backwards-compatible Python defaults and explicit unsupported-language rejection.
- [x] 8.2 Apply a forward migration for allowed assignment languages, server-derived immutable revision language and guarded submission RPCs; prevent language changes after submissions and preserve local history/data.
- [x] 8.3 Use validated assignment/revision language in real student editor/runner/history and AI context without changing execution/persistence limits or exposing private grading data.
- [x] 8.4 Verify both-language real browser journeys, private revisions/RLS/API access, retries/unsupported and forged fields, published/draft boundaries and language-change guard. Update guides, summary and linked PR with actual evidence and prerequisite #16.

## 9. Issue #19 student practice-case integration

- [x] 9.1 Share the public case DTO/limits with teammate through issue/contract docs; record teacher persistence/publication as pending.
- [x] 9.2 Add a server-gated standalone example adapter and explicit student opt-in in real assignments, with truthful example labels and no production/default fallback.
- [x] 9.3 Reuse browser-only tests/results for Python/Java source without altering submissions, grades or XP; clear/cancel results on opt-out/navigation.
- [x] 9.4 Verify both-language real-page tests, stale results/errors/deadlines, no automatic writes, default/production denial and saving/privacy regression. Update guides, summary and linked PR with actual evidence.
- [x] 9.5 Issue #21: simplify sidebar/Menu to Assignments, uncramp branding and order real editor/run/input-output/test cases/submit/history; verify responsive navigation, source preservation and Python/Java actions and update PR #20.
