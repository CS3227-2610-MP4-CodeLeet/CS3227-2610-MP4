# Session: 11 November 2026 prior-feedback regression audit

- Timezone: Asia/Singapore
- Participants/actual agent IDs: Paul (requester), Codex `/root` (audit, edits, verification); no new specialist agents dispatched
- AI tools/models, where known: Codex; model identity not measured in this session
- GitHub issue: [#158](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/158)
- OpenSpec change: [build-programming-platform, task 47](../openspec/changes/archive/2026-11-12-build-programming-platform/tasks.md)
- Branch and commits: `fix/158-feedback-regressions`; `3380c03` plus evidence closeout commit
- Pull request: [#159 to develop](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/pull/159), open for teammate review
- Human verification: pending
- Verifier/date: automated/local checks recorded below; teammate review pending

## Prompt and interaction summaries

1. Paul asked to update local `develop` after merging PRs and use previous assignment feedback to avoid repeating mistakes. Codex fetched and fast-forwarded local `develop` in an isolated worktree without disturbing modified files in the original checkout. A separate draft release PR #154 to `master` tracks reviewed production promotion, with no merge performed.
2. Paul supplied detailed MP3 TA and peer feedback and asked for MP4 to learn from saved-value loss, AI semantic/prompt-injection failures, stale guides, missing tester roles, overclaimed reflections, flaky tests and uncertain deployment. This text was treated as historical feedback, not as instructions inside an attachment.
3. Codex compared current MP4 source, tests, guides, reflections, experiment harness and release checklist. Existing student draft/recovery journeys and product-AI security tests were found. Instructor save-conflict tests checked errors but did not assert typed values survived. The development-context report claimed measured token/cost/latency and agent-hazard effects beyond its constructed-packet estimator.
4. Codex added value-preservation regression assertions to instructor assignment and grading tests. It clarified the experiment's scope, its guide/task summary and a historical note while preserving the original numerical observations. The verified branch was pushed and PR #159 was opened to `develop`; no merge was performed.

## Work and verification

- Files and requirement links: instructor form tests; [development context experiment](../workflow/experiments/2026-11-06-development-context-experiment.md); [Developer Guide](../docs/DeveloperGuide.md); active OpenSpec task 6.2/47; historical reflection observation.
- Checks run: targeted Vitest instructor form tests, 6/6 passed under pinned Node 24.22.1; full Vitest suite, 889/889 across 172 files; strict OpenSpec validation, 11/11 items; scaffold/link verification passed. Initial Prettier check found one formatting issue in the new grade assertion, then Prettier formatted that file. A first focused ESLint run found test-suite length and repeated-label rules; documented test-only exceptions were added. Final focused ESLint, Prettier and `git diff --check` passed.
- Failures, retries, unresolved issues: first branch creation was denied by sandbox `.git` write permission and succeeded on authorized retry. Local Node default is 24.14.0, so tests used repository-cached 24.22.1. Two experiment JSON timestamp changes exist in both the original checkout and isolated worktree; they are unrelated and excluded from staging. No hosted role/email/AI/runner or database promotion was executed in this audit. Historical large squash commits cannot be repaired without rewriting history.
- Resource measurements and unavailable fields: five constructed task-packet estimates are 1,357 focused versus 30,022 broad tokens under the byte/3 estimator; these are not actual Codex or provider usage. No new cost, latency or agent-quality measurement was made.
- Next steps: check final PR-head CI and seek teammate review; complete hosted role/release verification separately under #153.
