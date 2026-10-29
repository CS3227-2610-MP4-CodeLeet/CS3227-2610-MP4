# Session: 29 October 2026 account and workspace controls

- Timezone: Asia/Singapore
- Participants: requester and primary Codex agent; no specialist delegation
- GitHub issue: #15
- OpenSpec change: build-programming-platform
- Branch: fix/account-workspace-controls; implementation commit 0093165
- Pull request: [#16](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/pull/16), targeting develop
- Human verification: pending

## Prompt and interaction summaries

1. Requester reported theme gaps on account actions, asked for confirmation and independent password visibility buttons, asked why Run was unavailable, questioned Home navigation, requested removal of initial sample messaging and reported missing sign-out.
2. Inspection found an opt-in fixture shell without sign-out and a separate authenticated form without Run. Both Supabase configuration fields had been filled in an earlier troubleshooting interaction; no credentials are recorded here. Existing generated next-env.d.ts changes predate this change and must be preserved.
3. Chosen implementation reuses shared theme and local browser runtime; real Python/8,000-character submission and security contracts remain unchanged. Default local use switches to authenticated mode; explicit fixture mode must remain honestly labeled. Issue #15 and a feature branch were created before implementation.
4. After checks, committed and pushed 0093165 and created PR #16 to develop. Completed the log/plan closeout in a documentation follow-up. No merge, live AI call or deployment was performed. Owned test servers on 3100/3101 were stopped; the existing requester dev server was preserved and the local static runner on 3130 was left available for manual testing. Synthetic local test records remain; no database reset was performed.

## Work and verification

- Plan: workflow/plans/2026-10-29-account-workspace-controls.md
- Implementation: shared `AppTheme`, account password controls, failure-aware local sign-out, authenticated `WorkspaceShell` and local Run integration in the real submission form. Updated guides, environment example, OpenSpec scenarios and task 7.16. The ignored local environment selects real assignments and enables opt-in development Run; no values are committed.
- Red/green: two new account regressions first failed for absent theme control and confirmation, then both passed. Local account plus authenticated instructor/student journey passed (3 tests), including actual Python stdin/output, source retention, immutable revisions, mocked AI, explicit grading, synthetic sign-out failure/retry and protected-route denial after logout.
- Wider browser suite: initially 22 passed and 2 failed out of 24. All four real Python/Java runtime tests passed. Failures were the newly ambiguous password selector in production-denial checks and an existing local `APP_SITE_URL` port 3000 value conflicting with the owned production test port 3100. Fixed exact selectors and configured only the test server origin, preserving application CSRF enforcement. Re-ran the two affected journeys: 2 passed, exit 0. No single-run 24/24 claim is made.
- Unit tests: 65/65 passed. Production Next build and TypeScript passed. Final ESLint passed with zero warnings; formatting, scaffold/local links, strict OpenSpec (6 items) and whitespace checks passed before publication.
- Visual check: primary agent inspected a synthetic empty dark signup form at 375px; no horizontal overflow. Screenshot is in ignored test-results only. No contrast certification or independent accessibility audit claimed.
- Failures/retries: first separate Next dev attempt conflicted with the requester's existing port-3000 dev server; reused it and later started separately isolated owned test servers. Initial lint limits required small helper extraction and literal constants; first atomic patch contexts failed and were corrected. Password eye labels required exact test selectors; a Next route-announcer alert required a scoped error locator. No auth or runtime production boundary was relaxed.
- Original generated next-env.d.ts dev-import changes are preserved and excluded from feature commits. No credentials, test traces or generated runtime assets are staged. Authenticated tests use only synthetic local accounts and process-scoped admin credentials.
- Independent review: not performed
- Resource/token measurements: unavailable
- Deployment/hosted runtime: not verified
