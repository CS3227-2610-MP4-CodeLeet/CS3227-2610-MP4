# Session: 2026-11-12 practice-tests guide clarification

- Timezone: Asia/Singapore
- Participants/actual agent IDs: User and Codex `/root`; no specialist agents
- AI tools/models, where known: Codex; exact model not exposed
- GitHub issue: [#166](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/166)
- OpenSpec change: [`build-programming-platform`, task 6.3](../openspec/changes/build-programming-platform/tasks.md); task remains open for reflections and acknowledgements
- Branch and commits: `docs/166-practice-test-auth-guides`; commit pending
- Pull request: pending branch CI; repository process requires CI before opening a PR
- Human verification: pending
- Verifier/date: pending

## Prompt and interaction summaries

1. The user requested a thorough app and guide consistency review for a graded university project. The follow-up asked what the Practice tests editor is and where it appears, requested User Guide and Developer Guide updates, and explicitly deferred two unrelated audit findings.
2. Source review confirmed the dedicated instructor route `/courses/[courseId]/assignments/[assignmentId]/practice-tests`. It is restricted to active instructors when Assessments is enabled, but the assignment list and edit page do not link to it. The edit form separately exposes the same case data.
3. Reviewing the editor, schemas, route handlers and database migration found different case-entry limits and controls: the assignment form and shared schema support 25 and expose Public/Private visibility; the dedicated page has no visibility control, its button disables at exactly five, and its helper says “Up to 5 cases.” Saving through the assignment form immediately refreshes public cases for a published assignment; the dedicated page's Save draft leaves publication unchanged.
4. Source review also found that private cases are excluded from the public snapshot and the current submission-review view has no private-case runner, despite the assignment form helper text suggesting they are used in instructor evaluation. The User Guide now records the implemented behavior and calls out the stale helper text.
5. The User Guide and Developer Guide were updated for those behaviors, the Supabase Auth verification path, and the last-admin API's HTTP 409 response. The OpenSpec task 6.3 remains unchecked because its reflections and acknowledgements are incomplete. The two deferred audit findings and the requester-confirmed administrator contact were left untouched.

## Work and verification

- Files and requirement links: `docs/UserGuide.md`, `docs/DeveloperGuide.md`, `openspec/changes/build-programming-platform/tasks.md` task 6.3, and this summary.
- Commands/checks actually run and outcomes: `pnpm format:check` passed; `pnpm check:scaffold` passed, including local Markdown link targets; `pnpm spec:validate` passed all 8 items; `pnpm site:build` compiled the Docusaurus client/server and generated static files; `git diff --check` passed. A targeted guide scan was reviewed. Application tests were not run because this issue is documentation-only.
- Failures, retries, unresolved issues: The restricted shell could not find `pnpm`; the project-required elevated retries succeeded. The route remains unlinked in the application, and the assignment-form helper still claims private cases are used for instructor evaluation. These product/UI discrepancies were documented but not changed under this guide-only scope. No independent human review has occurred.
- Resource measurements and unavailable fields: No model-provider requests or agent token/cost measurements were made. The exact Codex model is unavailable.
- Next steps: Check the final diff, commit and push the branch, wait for branch CI, then open a PR to `develop` linking issue #166, OpenSpec task 6.3, and this summary. Keep human verification pending; do not claim merge or deployment.
