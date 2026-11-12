# Session: 2026-11-12 practice-tests guide clarification

- Timezone: Asia/Singapore
- Participants/actual agent IDs: User and Codex `/root`; no specialist agents
- AI tools/models, where known: Codex; exact model not exposed
- GitHub issue: [#166](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/166)
- OpenSpec change: [`build-programming-platform`, task 6.3](../openspec/changes/build-programming-platform/tasks.md); task remains open for reflections and acknowledgements
- Branch and commits: `docs/166-practice-test-auth-guides`; guide changes at `5cebf2d`; pre-PR CI passed on `a014bfa`; PR-head CI passed on `a0c6f0c`
- Pull request: [#167](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/pull/167), open to `develop`; human review pending
- Human verification: pending
- Verifier/date: pending

## Prompt and interaction summaries

1. The user requested a thorough app and guide consistency review for a graded university project. The follow-up asked what the Practice tests editor is and where it appears, requested User Guide and Developer Guide updates, and explicitly deferred two unrelated audit findings.
2. Source review confirmed the dedicated instructor route `/courses/[courseId]/assignments/[assignmentId]/practice-tests`. It is restricted to active instructors when Assessments is enabled, but the assignment list and edit page do not link to it. The edit form separately exposes the same case data.
3. Reviewing the editor, schemas, route handlers and database migration found different case-entry limits and controls: the assignment form and shared schema support 25 and expose Public/Private visibility; the dedicated page has no visibility control, its button disables at exactly five, and its helper says “Up to 5 cases.” Saving through the assignment form immediately refreshes public cases for a published assignment; the dedicated page's Save draft leaves publication unchanged.
4. Source review also found that private cases are excluded from the public snapshot and the current submission-review view has no private-case runner, despite the assignment form helper text suggesting they are used in instructor evaluation. The User Guide now records the implemented behavior and calls out the stale helper text.
5. The User Guide and Developer Guide were updated for those behaviors, the Supabase Auth verification path, and the last-admin API's HTTP 409 response. The OpenSpec task 6.3 remains unchecked because its reflections and acknowledgements are incomplete. The two deferred audit findings and the requester-confirmed administrator contact were left untouched.
6. Branch CI on commit `a014bfa` passed before PR creation: Application, Scaffold and CodeQL succeeded; the coverage-report job was skipped, and Vercel's preview status passed. PR [#167](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/pull/167) was opened to `develop` with `Closes #166`.
7. Exact PR-head CI on `a0c6f0c` completed successfully: Application (database, application, authenticated E2E, and coverage report), Scaffold, CodeQL, and Vercel preview all passed. Teammate review and human verification remain pending.

## Work and verification

- Files and requirement links: `docs/UserGuide.md`, `docs/DeveloperGuide.md`, `openspec/changes/build-programming-platform/tasks.md` task 6.3, and this summary.
- Commands/checks actually run and outcomes: `pnpm format:check` passed; `pnpm check:scaffold` passed, including local Markdown link targets; `pnpm spec:validate` passed all 8 items; `pnpm site:build` compiled the Docusaurus client/server and generated static files; staged `git diff --check` passed. Pre-PR branch CI on `a014bfa` passed [Application checks](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/actions/runs/43195309497) (database, application, authenticated E2E), [Scaffold checks](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/actions/runs/43195337883), and [CodeQL](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/actions/runs/43195366558); its coverage-report job was skipped. On PR-head `a0c6f0c`, [Application checks](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/actions/runs/43197091672) (database, application, authenticated E2E, coverage report), [Scaffold checks](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/actions/runs/43197091663), and [CodeQL](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/actions/runs/43197091771) passed. Vercel's preview status passed. A targeted guide scan was reviewed.
- Failures, retries, unresolved issues: The restricted shell could not find `pnpm` or reach GitHub; project-required elevated retries succeeded. The pre-PR coverage-report job was skipped by its workflow condition; it passed on the PR-head run. The route remains unlinked in the application, and the assignment-form helper still claims private cases are used for instructor evaluation. These product/UI discrepancies were documented but not changed under this guide-only scope. No independent human review has occurred.
- Resource measurements and unavailable fields: No model-provider requests or agent token/cost measurements were made. The exact Codex model is unavailable.
- Next steps: Obtain teammate review and complete the separate human verification. Do not merge or claim deployment.
