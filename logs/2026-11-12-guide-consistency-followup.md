# Session: 2026-11-12 guide consistency follow-up

- Timezone: Asia/Singapore
- Participants/actual agent IDs: User and Codex `/root`; no specialist agents
- AI tools/models, where known: Codex; exact model not exposed
- GitHub issue: [#164](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/164)
- OpenSpec change: [`build-programming-platform`, task 6.3](../openspec/changes/build-programming-platform/tasks.md); the task remains open for reflections and acknowledgements
- Branch and commits: `docs/164-finish-guide-consistency`; `ed4b3cb` (`docs: finish guide consistency fixes`)
- Pull request: pending
- Human verification: pending
- Verifier/date: pending

## Prompt and interaction summaries

1. The user requested implementation of the remaining guide consistency fixes after confirming the administrator contact address. Preserve that address and keep the work focused on source-backed documentation.
2. The working tree was clean on `develop` at `fac29df`. Issue #162 for the previous guide pass was closed, so follow-up issue #164 was created and this branch was created from `develop`.
3. OpenSpec `build-programming-platform` is the active spec-driven change. Task 6.3 remains unchecked because its broader reflections and acknowledgements work is incomplete; this follow-up does not mark it complete.
4. Review of the current source and guides confirmed stale claims about instructor invitations, Legacy course controls, instructor preview, test-case limits, leaderboard timing, execution/runtime protocols, XP eligibility, administrator safeguards, draft storage/submission feedback, source-tree paths, Pages triggers, and unsupported provenance/coverage wording. Corrections preserve product behavior.

## Work and verification

- Files and requirement links: `docs/UserGuide.md`, `docs/DeveloperGuide.md`, `openspec/changes/build-programming-platform/tasks.md` task 6.3, this summary, and `docs/superpowers/plans/2026-11-12-guide-documentation-drift.md`.
- Commands/checks actually run and outcomes: `pnpm format:check` passed; `pnpm check:scaffold` verified scaffold artifacts and local Markdown links; `pnpm spec:validate` passed (8 items, 0 failed); `pnpm site:build` compiled the Docusaurus client and server and generated static files; `git diff --check` passed; a targeted stale-claim scan found no known old wording. No application test suites were run because no app behavior changed.
- Failures, retries, unresolved issues: `pnpm` was unavailable in the restricted shell; the repository-required elevated OpenSpec status/instructions and documentation check commands succeeded. An initial stale-phrase scan matched a valid lowercase runtime event because the search was case-insensitive; the case-sensitive scan passed with no known stale claims. Human verification remains pending. Exact final-head branch CI and hosted behavior have not been checked.
- Resource measurements and unavailable fields: not measured; exact Codex model is unavailable.
- Next steps: push the branch, wait for branch CI, and open a linked PR to `develop` without merging.
