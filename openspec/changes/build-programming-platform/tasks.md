## 28. Issue #80 trusted XP leaderboard

- [x] 28.1 Review/approve ranking, visibility and narrow privacy design; write implementation plan after approval and ensure XP dependency is available.
- [x] 28.2 Implement one-snapshot trusted XP rankings and own position without widening profile/award access; verify ties, paging, roles, corrections and forged data denial.
- [x] 28.3 Add signed-in student/instructor leaderboard navigation, safe responsive/theme/error states and scoped synthetic seed/browser evidence.
- [x] 28.4 Complete review and applicable checks, update guides/logs, push verified milestones and create a linked PR to develop after branch CI; verify final-head checks.

## 27. Issue #77 instructor-configured assignment XP

- [x] 27.1 Resolve later maximum-XP edit policy and review design, including proposed bounds and legacy published-grade basis; write implementation plan.
- [x] 27.2 Implement owner-configured assignment XP and atomic server-owned best-published-grade awards/audit adjustments, with denial, retry, correction and concurrent-publication tests.
- [x] 27.3 Show own student total/assignment awards without private rubric/draft/peer data; verify published score basis, zero/fractional limits and rollout compatibility.
- [x] 27.4 Complete applicable regression/security/browser checks and scoped review, update guides/logs, pass branch CI and create a linked PR with final-head checks. Leaderboard and hosted release remain separate.

## 26. Issue #74 instructor-authored public practice tests

- [x] 26.1 Requester approved the concrete design on 2 November 2026; implementation plan written. Teammate review remains separate.
- [x] 26.2 Add bounded case contracts, private draft/public snapshots, owner-only atomic version-checked save/publish/unpublish and RLS/API denial tests. All 180 database assertions/eight files pass, including 33 authored-case assertions and publication/Unicode checks.
- [x] 26.3 Implement instructor authoring and student published-case loading with browser-only Python/Java execution, fresh/safe snapshots and no grading/fixture fallback. Both actual-language journeys, concurrent API/denial and mobile recovery pass; independent review findings resolved.
- [x] 26.4 Verify role/draft/assignment visibility, conflicts, byte/whitespace/Unicode limits, both real-language journeys and mobile recovery; update guides/handoff/logs/rollout notes. Final local checks: 526 unit tests, 180 DB assertions, build/lint/format/types/spec/scaffold pass. Combined browser run 70 passes/seven skips plus one corrected harness startup replay pass; scoped independent findings resolved. See dated summary for exact limits.
- [x] 26.5 Push verified milestones and pass branch CI 41381615295 (one infrastructure-only database startup retry); create linked PR #76 to develop. Final-head checks are monitored/reported there before handoff; prerequisite skips and exact local runs documented. Scoped independent review findings resolved; human/hosted acceptance remains separate.

## 25. Issue #70 User Guide and security/reflection evidence

- [x] 25.5 Issue #72 follows the requester's two-member reflection structure: index plus MP4-specific Paul/John drafts and preserved shared evidence. Updated develop verification: 147 links/13 documents, theme/member-review structure, formatting/scaffold/strict OpenSpec passed. Branch CI 41377040526 passed before linked PR #73; final-head checks are monitored/reported there. Member contribution/wording verification remains pending.

- [x] 25.1 Audit current routes, test assertions, prior experiments and merged CI; link a focused documentation issue/branch without changing product behavior.
- [x] 25.2 Update user journeys and add a traceable security evidence report/reflection analysis with dated observations, skips and remaining release gates.
- [x] 25.3 Verify links/format/spec/scaffold and applicable existing tests; record failures, actual outcomes and unavailable measurements in the dated summary. Local pinned-Node coverage: 496 tests/80 files passed; links/format/spec/scaffold passed. Local database unavailable; baseline CI passed 147 assertions. Hosted/independent review not claimed.
- [x] 25.4 Commit/push and create linked PR #71 to develop after successful branch CI 41375618030. Final-head checks are monitored/reported on the PR before handoff. Human reflection review and hosted acceptance remain pending.

## 21. Issue #52 My grades

- [x] 21.1 Implement projected published-grade DTO/query with explicit ownership, bounded filters/pagination, safe failures and unit/privacy tests.
- [x] 21.2 Add student My grades routes/navigation, score/feedback/revision links, states and shared filter/pagination presentation.
- [x] 21.3 Verify both languages, draft/peer/hidden/role boundaries, deterministic pagination/filter URLs, feedback safety and mobile/theme; run applicable regressions.
- [x] 21.4 Update verified guides/spec/log evidence, commit/push and publish linked labelled PR #53 to develop. Verified 312 unit tests, 124 database assertions, 57 full-suite browser passes/seven skips, direct Next build/types/lint/format/spec/scaffold checks; independent review and hosted verification remain pending.

## 22. Issue #54 forum search

- [x] 22.1 Add bounded search parsing, literal regex/PostgREST escaping and stable URL/pager helpers with failing-first regressions.
- [x] 22.2 Integrate title/opening-body search before existing forum paging, Search/Clear controls and no-match copy without changing access/posting/replies.
- [x] 22.3 Verify both member roles, literal/injection-shaped input, filtering before paging/ties, navigation, safe text and mobile/theme; run applicable regressions/checks.
- [x] 22.4 Update verified guides/spec/log evidence, commit/push and create linked labelled PR #55 to develop. Combined verification: 324 unit tests, 124 database assertions, 59 browser passes/seven skips, build/types/lint/format/spec/scaffold checks passed. Independent review and hosted verification remain pending.

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
- [x] 2.14 Add local-only Supabase seed data and a `pnpm db:seed` command for synthetic student/instructor accounts, assignments, rubrics, submissions and grades; document schema-change upkeep and verify fresh setup/reset counts without touching hosted data.

## 3. Assignments and execution

- [ ] 3.1 Implement assignment creation/private rubrics and student browsing; student work is detailed in task group 7.
- [ ] 3.2 Implement isolated browser Python/Java adapters with stdin, diagnostics, stop and rerun.
- [ ] 3.3 Implement immutable code submission revisions and authorized history through the agreed schema and student integration in task group 7.
- [x] 3.4 Implement version-checked grade publication with atomic idempotent XP adjustment.
- [ ] 3.5 Test access boundaries, private grading data, revision races, forged run results and both languages.

## 4. SoCLaaS features

- [ ] 4.1 Verify provider access/limits and define application budgets/failure handling.
- [ ] 4.2 Implement shared server-only gateway, separate role contexts and validated output contracts.
- [ ] 4.3 Implement scoped cache, atomic quotas, timeouts and sanitized usage metadata.
- [ ] 4.4 Integrate student hints and instructor suggestions with explicit publication approval.
- [ ] 4.5 Test malformed output, XSS, role/cache leakage, quota races and provider failures.
- [ ] 4.6 Run bounded live adversarial/quality evaluations and record limitations.

### Issue #75: zero-cost Promptfoo AI security evaluation

- [x] 4.7.1 Pin the free MIT-licensed Promptfoo CLI as a development-only dependency and add a local fixed-case evaluation using synthetic student/instructor contexts; disable telemetry, hosted generation, sharing, and remote graders.
- [x] 4.7.2 Reuse the existing AI prompt/context case source where practical; cover both roles/languages and source-code, assignment-instruction and rubric-description attacks, then verify rubric separation, output safety and advisory-only instructor results with deterministic local assertions. Three live runs returned 5/10 (initial prompt-contract mismatch), 9/10 (student Java assignment-injection assertion), and 10/10 after review fixes; retain both earlier failures as historical evidence.
- [x] 4.7.3 Keep live SoCLaaS calls out of CI; allow only an explicitly gated ten-request maximum against the confirmed free endpoint and record cost/data-flow limits and evidence. The live command ran three times, each capped at ten synthetic requests (30 calls total).
- [x] 4.7.4 Run the local evaluation and applicable checks, update the dated summary, and create a linked PR to develop after branch CI passes. Focused tests, offline evaluation, unit/lint/type/format/scaffold checks and rebased application/database CI passed; targeted and non-strict OpenSpec validation passed. Strict validation reports existing long-requirement warnings with OpenSpec 1.15.0. Summary: `logs/2026-11-02-promptfoo-ai-security.md`; PR #78 is open for human review.
- [x] 4.7.5 Address PR #78 review findings: enforce the telemetry opt-out in the pinned Promptfoo package, disable update checks, strengthen rubric/solution/publication assertions, prevent default dotenv discovery in offline runs, accept passive publication denials including coordinated actions and instructor-capability policy statements (carrying capability policy across coordinated verbs while eliminating regex exponential backtracking), restrict implicit publication referents to evaluation results rather than non-evaluation materials, detect rubric textual content disclosed without score words (matching configured criterion descriptions and title-description associations while requiring criterion or disclosure context to avoid false positives on ordinary learning advice), preserve disclosure context after refusals and strip only refusals that do not continue with rubric content, reject disclosures of private rubric titles and categories while requiring category/disclosure context to avoid false positives on common review terms, recognize Java methods with throws clauses, fix test file code style for CI format checks, keep live-run evidence consistent, detect numeric and word-form allocations tied to rubric criteria/maxima without flagging ordinary point/test-count advice, reject target-first Python and chained Java replacement bodies with bounded parsing including inline Markdown code, honor explicit disclosure refusals, sanitize Windows environment names case-insensitively, and reject null assertion envelopes without throwing. Focused quality tests (7/7) and full unit test suite (566/566 across 93 files) passed; offline Promptfoo passed 10/10; format:check, lint (0 errors, 0 warnings), typecheck, and strict OpenSpec validation passed. All PR review threads are addressed; PR checks (CodeQL, Analyze, application, database, coverage-report, scaffold, Vercel) passed on GitHub Actions run 41448243347. Human review remains pending on open PR #78.

## 5. Community and XP

- [x] 5.1 Implement text threads/replies with authorization and input/request limits.
- [x] 5.2 Implement deterministic leaderboard and synthetic local student/award seeds.
- [x] 5.3 Verify duplicate/concurrent publication and corrections cannot inflate XP.

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

## 10. Issue #23 My submissions

- [x] 10.1 Add a verified-student, metadata-only cross-assignment history loader with stable pagination, page validation, hidden-assignment fallback and safe errors; preserve RLS and exclude source/rubrics/grades from list reads.
- [x] 10.2 Add My submissions to authenticated sidebar/Menu, loading/empty/error/list states and detail return navigation in the shared workspace; keep signed-out/instructor and preview boundaries enforced.
- [x] 10.3 Verify both languages, multiple revisions, pagination, two-student privacy/forged query denial, hidden grades/rubrics, safe text, mobile navigation and existing detail/run/save behavior.
- [x] 10.4 Update verified guides, plan/spec/log evidence and linked PR to develop; leave independent human review and deployment claims accurate.

## 11. Issue #25 local defaults

- [x] 11.1 Remove student preview configuration flags; make real data default and local runner enabled in development, with samples restricted to an explicit UI-test harness setting and production still denied.
- [x] 11.2 Preserve local credentials/configuration values, retain the separate example-case opt-in and update setup guides/specs.
- [x] 11.3 Verify real local Python/Java/history, fixture tests and production boundaries, record evidence and publish a linked PR with prerequisite #24 identified.

## 12. Issue #27 local development seed data

- [x] 12.1 Configure deterministic synthetic Auth users with GoTrue-compatible instance/token fields, roles, assignments, rubrics, submissions and representative grades meeting issue #27's minimum counts; keep automatic Supabase CLI seeding disabled to prevent hosted linked resets from loading local fixtures.
- [x] 12.2 Add explicit local-only `pnpm db:seed` with a warning before destructive reset, document its behavior and seeded-account password-recovery path, and instruct contributors to maintain seeds when schema requirements change.
- [x] 12.3 Verify clean local reset leaves fixtures unloaded, explicitly seed local data and inspect counts, run applicable static/spec checks, and record actual results and limitations in the dated session summary.

## 13. Issue #31 hosted browser runner for student and instructor

- [x] 13.1 Record the same-project static `/runtime/` topology, protected Preview same-origin asset loading, opaque iframe boundary and current Pyodide/TeaVM asset provenance/license decisions.
- [x] 13.2 Add a deterministic build step that always stages the reviewed fixed, versioned browser runtime assets under the app's public `/runtime/` path, fails closed on missing/mismatched approval, hashes or notices and exposes no source-execution endpoint. Focused builder tests cover the fixed path, always-included output, hash validation and complete-notice gate; deployed/browser evidence remains open under 13.5/13.6.
- [x] 13.3 Use the same-deployment `/runtime/` bridge for hosted Preview and Production; keep the local development runner behavior, remove app/runner project pairing and validate same-origin asset loading plus opaque-frame message source/nonce/protocol/run IDs. Focused loader/bridge/environment tests pass; deployed smoke remains open under 13.5/13.6.
- [x] 13.4 Enable the shared runner on authenticated student assignment pages and the instructor's owner-authorized submission-review page. Runs/results remain browser-only and cannot mutate submissions, grades or XP.
- [ ] 13.5 Verify runtime build/hash/license gating, same-origin asset requests, opaque-frame source/nonce rejection, both languages, both roles, ownership boundaries, worker network denial, lifecycle/deadlines, local regressions and static application build. A local same-project Playwright smoke passes Python and Java in Chromium after correcting inherited CSP; the requester also reports Python and Java passing in Preview, but did not specify browser or role. Production and authenticated instructor journeys remain unverified. Record exact runtime/source hashes, browsers and remaining limitations before completion.
- [ ] 13.6 Configure and smoke the single Vercel app Preview deployment; run Production smoke only after provenance/license and independent review gates pass. The requester reports that Python and Java now run in Preview; Production smoke and independent code review remain pending. Update verified docs and the dated issue/OpenSpec/branch/PR log. Keep human verification pending.
- [x] 13.7 Make `pnpm dev` verify/fetch the pinned local runtime assets and start the loopback static runner with Next.js; verify startup/shutdown, both browser runtimes and no Node-side submitted-code execution. Local startup, Python/Java browser journeys, and clean shutdown were verified; no submitted code is executed in Node.
- [x] 13.8 Resolve PR #32 review findings: require at least one path segment for immutable versioned runtime caching, stage generated runtime files outside `public/`, and clean abandoned legacy public staging directories. Header matching and builder regression tests pass.
- [x] 13.9 Address PR #55 CI integrity-download failure (issue #31): bypass stale cached responses on bounded retries, preserve approved size/hash gates, add failure diagnostics and regression coverage. GitHub run 41311436296 at 795e46c passed runtime/application and website builds, 325 unit tests, 29 browser tests/37 prerequisite skips and database checks; CodeQL/scaffold and automatic Vercel preview build passed. No hosted runtime execution smoke or independent review claimed.

## 14. Issue #30 Forums

- [x] 14.1 Add authenticated thread/reply schema, RLS and trusted idempotent posting RPC with atomic quotas and security tests.
- [x] 14.2 Build bounded same-origin posting API, server loaders, shared-role forum pages/forms and navigation.
- [x] 14.3 Verify both roles, safe text, paging, retries/concurrency, access/privacy and responsive/theme behavior; run regression checks.
- [x] 14.4 Update current guides, plans/logs/spec evidence and publish linked PR to develop; leave human review pending.

## 15. Issue #38 Profile settings

- [x] 15.1 Implement own-profile loading and strict same-origin session-derived username updates with readonly email/role and privacy/validation tests.
- [x] 15.2 Add shared account settings UI and role navigation; verify persisted edits, errors, mobile/theme and existing workspace behavior.
- [x] 15.3 Update verified docs/spec/log evidence, complete applicable checks and publish a labelled PR to develop.
- [x] 15.4 Resolve PR #39 mobile-menu CI race by awaiting committed assignment navigation; reproduce the failure and verify repeated mobile checks plus the browser suite before updating the PR.

## 30. Issue #84 email or unique username sign-in and student acceptance

- [x] 30.1 Implement database-owned username claims/legacy reservation transitions and private rate/lookup RPCs; 321 assertions/eleven files passed, actual parallel case-variant claim produced one winner, advisors found no issues. Applied local additive migration without reset; existing unrelated practice-case lint warning remains.
- [x] 30.2 Integrate bounded same-origin email/username password authentication, server-only metadata keys/HMAC limits, safe cookie/error behavior and signup/profile uniqueness UI with failing-first tests. Verified 613 units, app build and targeted real login/rename/legacy/quota/cross-tab journeys; full acceptance remains task 30.3.
- [x] 30.3 Verify fresh synthetic student/runtime/privacy/loading journeys, bounded source/security reviews and accurate guides/evidence. Final 619 units and 321 database assertions passed; browser 95 passes/one connection reset/seven skips plus unchanged failed-case rerun passed. Hosted/live-provider gates remain separate; exact results are in the dated acceptance record.
- [x] 30.4 Publish linked PR #86 to develop after branch CI. Required application/database/coverage/scaffold/CodeQL/Vercel checks passed at f681aef; database run 41604412398 attempt 2 resolved a registry/occupied-port startup failure. Supabase Preview skipped. Checklist closeout triggers checks again; final-head status is recorded on the PR. Preserved the unrelated next-env edit; human/hosted release gates remain separate.

## 29. Issue #82 browser draft autosave and recovery

- [x] 29.1 Implement bounded account/assignment/language/revision-scoped browser storage, validation, retention, conflict tokens and invalidation with failing-first tests.
- [x] 29.2 Integrate restore/discard, debounced persistence, conflict choices, exact submission acknowledgement and sign-out/auth cleanup without changing official submissions.
- [x] 29.3 Verify authenticated Python/Java recovery, cross-account/tab boundaries, failure and submission races; update verified guides and independent review evidence. Local verification: 581 units, 84 browser passes/seven prerequisite skips, build/site/types/lint/format/spec/scaffold pass; bounded independent source review fixes verified.
- [x] 29.4 Commit/push, pass branch CI before PR creation and confirm PR checks; PR #83 links issue #82/design/summary. Branch run 41446869897 and implementation-head PR run 41447276707 passed application/database; coverage/scaffold/CodeQL/Vercel passed, Supabase Preview skipped. Documentation-only closeout checks are tracked on the PR before final handoff. Human review and hosted verification remain separate.

## 16. Issue #40 unsaved assignment code safeguard

- [x] 16.1 Track the exact submitted source snapshot and show unsaved state; keep failed saves and newer in-flight edits dirty with source-bound idempotent retries.
- [x] 16.2 Warn before ordinary app links, sign-out and reload/close while dirty; support cancelable browser history traversal without modifying history and clean up listeners after save/unmount.
- [x] 16.3 Verify Python/Java save/failure/navigation journeys and regressions, document browser limitations, and publish linked issue/spec/log/PR evidence. PR #41: 143 unit tests, 18 production Chromium passes with one local-email skip, two expanded new-tab checks, lint/format/build/types/spec/scaffold checks pass; independent review and deployment remain pending.

## 17. Issue #42 user-facing copy cleanup

- [x] 17.1 Remove the requested landing paragraph, simplify account/runner setup messages, record the UI copy preference and verify existing UI checks.
- [x] 17.2 Publish the verified fix with linked issue #42, OpenSpec and dated summary in PR #43; leave human review pending.

## 18. Issue #44 student list search and filters

- [x] 18.1 Add shared bounded literal title/language filters with URL-backed controls and helpful empty/reset states on Assignments and My submissions.
- [x] 18.2 Apply history filters before stable pagination while preserving verified identity, metadata-only reads, hidden-assignment boundaries and filtered page links.
- [x] 18.3 Verify combined filters, punctuation, hidden/peer privacy, pagination/reset and mobile/history regressions; update guides/logs and publish PR #45 to develop, linked to issue #44. Verification: 157 unit tests, 59 pgTAP assertions, 14 production browser passes with one email skip and 22 fixture UI passes on full rerun; build/types/lint/format/spec/scaffold checks pass. Independent review remains pending.

## 19. Issue #46 Java compatibility diagnostics

- [x] 19.1 Add shared, status-gated presentation for recognized unsupported Java compiler diagnostics; preserve raw results, ordinary errors and source without heuristic Thread attribution.
- [x] 19.2 Verify the real browser example, Runnable/direct-run success, syntax and diagnostic-like output, both result views and existing regressions; document confirmed limits.
- [x] 19.3 Finalize verified guides/spec/log evidence, commit/push and publish PR #47 to develop, linked to issue #46. Verification: 153 unit tests, six real browser runtime tests, build/types/lint/format/spec/scaffold checks pass; independent review remains pending.

## 24. Issue #59 optional assignment deadlines

- [x] 24.1 Implement forward deadline/timing schema, compatible authorized RPC, seed examples and failing-first time/database tests; verify without resetting local data.
- [x] 24.2 Integrate validated SGT deadline authoring, source-free scoped latest-own status and revision/instructor timing views with API/query/render tests.
- [x] 24.3 Verify both languages, boundary/retry/edit/privacy/status/theme/mobile journeys and regressions; update verified guides/logs/spec evidence.
- [ ] 24.4 Author-review, commit/push, create linked PR to develop after branch CI and wait for final-head PR checks; independent/human review pending.

## 23. Issue #56 compare own saved revisions

- [x] 23.1 Implement bounded selection/line-diff helpers with failing-first regression tests.
- [x] 23.2 Add verified own metadata/selected-source loading, comparison route/view and revision-detail action; verify privacy, bounds and safe rendering. Query/render/page tests and four synthetic browser journeys passed; no source writes or schema changes.
- [x] 23.3 Verify real Python/Java synthetic journeys, navigation/themes/mobile and immutable originals; update guides/log/spec evidence.
- [x] 23.4 Author-review, commit/push and create linked PR #58 to develop. Verified 361 units, 124 database assertions, 63 local browser passes/seven skips and GitHub application/database/build/site/scaffold/CodeQL/Vercel checks at dc63f7c (application run 41314311055 attempt 2). One upstream wrong-size runtime response required a failed-job retry without changing pins. Final documentation closeout triggers checks again; independent review remains pending.

## 20. Issue #50 continue editing saved revisions

- [x] 20.1 Add strict revision selection and projected owned assignment/language-scoped loading with denial/validation tests.
- [x] 20.2 Integrate revision actions and revision-keyed initial source/baseline into the existing workspace; preserve unsaved warnings and immutable submissions.
- [x] 20.3 Verify both languages, runs/new saves/original preservation, retries/refresh/newer edits, canceled replacement and private/unpublished/invalid targets using synthetic fixtures.
- [x] 20.4 Update verified guides/log/specs, run checks, author-review, push and create linked PR #51 to develop; leave AI PR #49 unmerged. Verification: 267 unit tests, 124 database assertions, 54 full-suite browser passes/seven skips, six focused feature checks including Python/Java runs, build/types/lint/format/spec/scaffold checks passed. Independent teammate review remains pending.

## 32. Issue #89 student personal progress

- [x] 32.1 Implement exact own assignment counts, bounded upcoming/recent metadata queries and private-data/error tests against existing RLS. Query tests and real synthetic count/withdrawal acceptance passed beyond 1,000 assignments.
- [x] 32.2 Add student-only My progress page/navigation with independent empty/error/loading states, pending retry and mobile/theme/accessibility verification.
- [x] 32.3 Verify synthetic real database/browser scenarios, update guides/log/spec evidence and complete independent review. 674 units, 321 database assertions, three actual synthetic dashboard journeys and 35 standard browser regressions passed; 71 standard prerequisite skips. The review's boundary-retry finding has a failing-first regression and is fixed.
- [ ] 32.4 Commit/push and publish issue-linked PR to develop after branch CI; verify final-head checks without merging or claiming deployment.
