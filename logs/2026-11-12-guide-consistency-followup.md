# Session: 2026-11-12 guide consistency follow-up

- Timezone: Asia/Singapore
- Participants/actual agent IDs: User and Codex `/root`; no specialist agents
- AI tools/models, where known: Codex; exact model not exposed
- GitHub issue: [#164](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/164)
- OpenSpec change: [`build-programming-platform`, task 6.3](../openspec/changes/build-programming-platform/tasks.md); the task remains open for reflections and acknowledgements
- Branch and commits: `docs/164-finish-guide-consistency`; `ed4b3cb` (guide fixes), `a368f0f` (record commit ID), `d042759` (record branch CI)
- Pull request: [#165](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/pull/165), open as draft because the authenticated browser workflow has one failure in unchanged application code
- Human verification: pending
- Verifier/date: pending

## Prompt and interaction summaries

1. The user requested implementation of the remaining guide consistency fixes after confirming the administrator contact address. Preserve that address and keep the work focused on source-backed documentation.
2. The working tree was clean on `develop` at `fac29df`. Issue #162 for the previous guide pass was closed, so follow-up issue #164 was created and this branch was created from `develop`.
3. OpenSpec `build-programming-platform` is the active spec-driven change. Task 6.3 remains unchecked because its broader reflections and acknowledgements work is incomplete; this follow-up does not mark it complete.
4. Review of the current source and guides confirmed stale claims about instructor invitations, Legacy course controls, instructor preview, test-case limits, leaderboard timing, execution/runtime protocols, XP eligibility, administrator safeguards, draft storage/submission feedback, source-tree paths, Pages triggers, and unsupported provenance/coverage wording. Corrections preserve product behavior.

## Work and verification

- Files and requirement links: `docs/UserGuide.md`, `docs/DeveloperGuide.md`, `openspec/changes/build-programming-platform/tasks.md` task 6.3, this summary, and `docs/superpowers/plans/2026-11-12-guide-documentation-drift.md`.
- Commands/checks actually run and outcomes: local `pnpm format:check` passed; `pnpm check:scaffold` verified scaffold artifacts and local Markdown links; `pnpm spec:validate` passed (8 items, 0 failed); `pnpm site:build` compiled the Docusaurus client and server and generated static files; `git diff --check` passed; a targeted stale-claim scan found no known old wording. Branch CI runs for [Application checks](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/actions/runs/43167319181), [Scaffold checks](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/actions/runs/43167323864), and [CodeQL](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/actions/runs/43167324927) completed. Scaffold and CodeQL passed. Application, database, and unauthenticated browser jobs passed (31 browser tests passed; 85 were skipped because local authenticated fixtures were not available in that job). The authenticated browser job had 83 passed, 1 skipped, and 1 failed: `tests/e2e/responsive-history.spec.ts` reports that the horizontally scrollable “Code changes” region does not advance `scrollLeft` after `ArrowRight`. This is in unchanged application code; the failure has not been independently reproduced or baseline-compared. No application code was changed in this documentation-only branch.
- Failures, retries, unresolved issues: `pnpm` was unavailable in the restricted shell; elevated checks succeeded. An initial stale-phrase scan matched a valid lowercase runtime event because the search was case-insensitive; the case-sensitive scan passed with no known stale claims. The authenticated responsive-history failure remains unresolved and is disclosed for follow-up. Human verification remains pending; this run was on commit `a368f0f`, before the log-only follow-up commit and PR-triggered final-head checks.
- Resource measurements and unavailable fields: not measured; exact Codex model is unavailable.
- Next steps: inspect all PR-triggered checks on the final head and keep the PR in draft for human review; do not merge.
