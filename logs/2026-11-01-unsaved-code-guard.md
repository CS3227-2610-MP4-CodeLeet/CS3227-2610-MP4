# Session: 2026-11-01 unsaved assignment code

- Timezone: Asia/Singapore
- Participants/actual agent IDs: requester and Codex `/root`; no specialist agents dispatched.
- AI tools/models, where known: Codex; model/token/cache measurements unavailable.
- GitHub issue: [#40](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/40)
- OpenSpec change: `build-programming-platform`, assignments-and-grading, task group 16
- Branch and commits: `feat/unsaved-code-guard` from `origin/develop` (`35daede`); `bff6d61` implementation/tests/docs; subsequent closeout commit links PR evidence.
- Pull request: [#41](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/pull/41)
- Human verification: pending
- Verifier/date: pending

## Prompt and interaction summaries

1. Requester asked for independent feature work. Codex suggested protecting unsaved assignment code, explaining indicator, navigation warning, successful-save reset and failure retention; requester asked to implement it.
2. Codex read project/workflow, relevant local skills, editor/navigation code and installed Next.js guides; fetched remote state, created issue #40 and a branch directly from develop, preserving the unrelated `next-env.d.ts` edit and leaving `.env.local` untouched. Profile #39 and Forums #37 remain separate pending PRs.
3. Codex chose in-memory exact source snapshots, browser listeners and sign-out integration without new packages/schema/storage. Checked MDN navigation/beforeunload documentation and Chromium 156 history cancellation capability. Explained browser-dependent mobile warning limitations. Baseline 143 unit tests passed. An initial browser probe found no server listening on port 3100; no running service was stopped.
4. Wrote synthetic account/assignment fixtures and browser tests before implementation. Corrected an ambiguous assignment-link selector, then observed the expected RED failure because the editor lacked an unsaved indicator. Implemented the state hook, guard and pre-sign-out check. Lint required splitting the guard predicate/status component and test helpers, and renaming Playwright's fixture callback to avoid treating it as React's `use`.
5. Canceled Back/reload initially kept Playwright waiting indefinitely; interrupted the test and bounded expected aborted navigation waits. The corrected Python test passed. Broader checks passed four save/navigation cases; two mobile cases hit Next's extra route-announcer alert in the selector. Scoped the selector to the actual sign-out error, then both passed. Verified that a failed sign-out preserves the warning and a later confirmed sign-out succeeds.
6. Built the production app with TypeScript successfully and ran all production Chromium tests: 18 passed, one local-email prerequisite skip. This includes both-language saving/history/privacy and the student/instructor flow with mocked AI. Added a focused modified/new-tab gesture regression after author review; its verification is recorded at closeout. Visually inspected the mobile dark-mode safeguard screenshot. Queried only the task's synthetic account prefix after the interrupted run; no leftover accounts were found.
7. Modified-click tests initially waited for the originating page's popup event; Chromium opens these as background context pages. Changed the wait to the browser-context page event, then both expanded mobile/new-tab cases passed. No product-code change was needed. Author-reviewed the full diff; no independent specialist review was performed. Next regenerated `next-env.d.ts` references during development/build. A backup under Playwright's generated output directory was removed by its normal output cleanup; do not use that directory for preserving unrelated files. This generated file is excluded from commits; `.env.local` was not edited.
8. Confirmed develop remained at `35daede`, committed only this change as `bff6d61`, pushed the feature branch and created enhancement-labelled PR #41 targeting develop and closing #40. Updated cross-links and task completion with actual results. Review/merge/deployment remain human decisions; CI is not claimed passing merely because local checks passed.
9. Final scaffold checking also scanned an ignored temporary PR-body Markdown file and found its relative links unresolved. Replaced them with direct GitHub branch URLs and rechecked. Stopped only the two task-owned application test-server sessions (ports 3200/3100); left local Supabase running.

## Work and verification

- Files and requirement links: [plan](../workflow/plans/2026-11-01-unsaved-code-guard.md), active OpenSpec change above.
- Commands/checks actually run and outcomes: full Vitest 143 passed; full ESLint (zero warnings), Prettier, `next build` including TypeScript, six strict OpenSpec items, scaffold/local links and `git diff --check` passed. Production Chromium: 18 passed, one skipped. Six safeguard journeys verified on both development and production app code. No live SoCLaaS requests or new Python/Java execution checks were enabled. Standard runtime-distribution fetching was not rerun; the production application build used the existing local environment.
- Failures, retries, unresolved issues: initial restricted gh invocation could not resolve dubious ownership; explicit repo and authorized elevated invocation succeeded. Several exploratory file paths did not exist; located actual editor/layout files with rg. No product changes at that stage.
- Resource measurements and unavailable fields: one implementing agent; no model/API calls or token savings measured.
- Next steps: teammate reviews PR #41 and verifies this summary before merging. Browser/mobile unload suppression and noncancelable/unsupported history traversal remain documented limitations. No merge, hosted smoke or deployment is claimed.
