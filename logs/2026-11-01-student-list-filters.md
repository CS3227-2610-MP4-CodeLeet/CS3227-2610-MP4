# Session: 2026-11-01 student list search and filters

- Timezone: Asia/Singapore
- Participants/actual agent IDs: requester and Codex `/root`; no specialist agents dispatched
- AI tools/models, where known: Codex; token/cache measurements unavailable
- GitHub issue: [#44](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/44)
- OpenSpec change: `build-programming-platform`, assignments-and-grading, task group 18
- Branch and commits: `feat/student-list-filters` from `origin/develop` (`35daede`); commits pending
- Pull request: pending
- Human verification: pending
- Verifier/date: pending

## Prompt and interaction summaries

1. Requester accepted the proposed independent feature: title search and language filters for Assignments and My submissions, helpful empty states and Clear filters, with own-history privacy.
2. Codex read project/workflow/specs, relevant planning/TDD/Supabase/React skills and current assignment/history loaders. Fetched remote state, created issue #44 and branched from develop. Existing pending Profile/Forums/unsaved-code/copy PRs remain separate. Chose explicit URL-backed GET forms and server filtering before history pagination, with visible-title inner joins for searches and existing neutral hidden-title behavior otherwise.
3. Consulted Supabase filter/PostgREST primary documentation to select escaped literal regex matching instead of wildcard interpretation. The web fetch of the Markdown changelog was unsupported; no dependency/API upgrade is part of this work. Planning/test evidence follows below.
4. Baseline 143 unit tests passed. Wrote the history query regression using the actual installed Supabase query builder with a synthetic fetch boundary; it failed because language/title constraints were absent. Implemented shared parsing, forms, assignment queries and history filtering. Added query/URL/literal tests and verified initial 154 passes. Subsequent edge coverage includes control characters before trimming, verified identity forwarding and outer joins for language-only hidden history; full suite is now 157 passing tests.
5. Browser tests first exposed a select label that included option text; used explicit labels and IDs. History/privacy then passed, while Back restored edited native form values inconsistent with the applied URL. Read installed Next.js Form documentation and switched to the framework GET/client-navigation component with URL-keyed controls. Updated test waits to await applied URL navigation rather than a completed old-document load; both synthetic filter journeys passed. A trailing-newline unit case was RED before reordering raw control-character validation ahead of trimming, then GREEN. Lint required constants for repeated test literals.
6. Production Next build including TypeScript passed. Full production Chromium suite passed 14 tests with one local-email prerequisite skip, including real Python/Java saving/privacy, My submissions, mocked student/instructor AI flows and the two new filter journeys. All 59 existing pgTAP access assertions passed without resetting local data. Mobile dark screenshot inspected. Explicit fixture UI regression checks follow at closeout.
7. Fixture UI/layout run passed 21 cases but the existing mobile Menu navigation test timed out after its target detached during the click. The unchanged test passed on isolated reproduction, then all 22 fixture UI/layout cases passed in a complete rerun. No product fix is claimed for this transient failure. Author-reviewed the diff, confirmed develop still at `35daede`, and ran final lint/format/spec/scaffold/whitespace checks. No independent specialist reviewer was dispatched; teammate review remains pending. Installed terminal Node was v24.14.0 (Node 24); repository pin remains 24.22.1.

## Work and verification

- Files and requirement links: [plan](../workflow/plans/2026-11-01-student-list-filters.md), active OpenSpec change above.
- Commands/checks actually run and outcomes: 157 unit tests; production Next build/TypeScript; 14 production Chromium passes, one local-email skip; 22 fixture UI/layout passes on full rerun; 59 pgTAP assertions; lint, format, strict validation of six OpenSpec items, scaffold/local links and whitespace checks pass. Standard runtime asset fetching/building was not rerun, and real execution opt-ins were not enabled.
- Failures, retries, unresolved issues: one exploratory installed-doc path was stale; located the correct Next.js functions guide with rg. No product changes at that stage.
- Resource measurements and unavailable fields: single implementing agent; no live AI or source execution requested, no token savings measurements.
- Next steps: publish linked PR for teammate review and human summary verification. No merge, deployment, live SoCLaaS call or new source-execution run is claimed. No migrations/dependencies/env changes; Next-generated type references restored from the ignored backup outside Playwright output after stopping only task-owned app servers. Local Supabase remains running.
