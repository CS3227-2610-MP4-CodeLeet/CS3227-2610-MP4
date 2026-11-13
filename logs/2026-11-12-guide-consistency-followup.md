# Session: 2026-11-12 guide consistency follow-up

- Timezone: Asia/Singapore
- Participants/actual agent IDs: User and Codex `/root`; no specialist agents
- AI tools/models, where known: Codex; exact model not exposed
- GitHub issue: [#164](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/164)
- OpenSpec change: [`build-programming-platform`, task 6.3](../openspec/changes/archive/2026-11-12-build-programming-platform/tasks.md); the task remains open for reflections and acknowledgements
- Branch and commits: `docs/164-finish-guide-consistency`; `ed4b3cb` (guide fixes), `a368f0f` (record commit ID), `d042759` (record branch CI), `8491c95` (link PR and summary), `74c4855` (final PR verification), `15c44c7` (address review comments)
- Pull request: [#165](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/pull/165), open and ready for review; human verification remains pending
- Human verification: pending
- Verifier/date: pending

## Prompt and interaction summaries

1. The user requested implementation of the remaining guide consistency fixes after confirming the administrator contact address. Preserve that address and keep the work focused on source-backed documentation.
2. The working tree was clean on `develop` at `fac29df`. Issue #162 for the previous guide pass was closed, so follow-up issue #164 was created and this branch was created from `develop`.
3. OpenSpec `build-programming-platform` is the active spec-driven change. Task 6.3 remains unchecked because its broader reflections and acknowledgements work is incomplete; this follow-up does not mark it complete.
4. Review of the current source and guides confirmed stale claims about instructor invitations, Legacy course controls, instructor preview, test-case limits, leaderboard timing, execution/runtime protocols, XP eligibility, administrator safeguards, draft storage/submission feedback, source-tree paths, Pages triggers, and unsupported provenance/coverage wording. Corrections preserve product behavior.
5. The user asked to fetch, evaluate, fix where warranted, push, and resolve PR review comments. Two inline threads were found: XP re-enable wording in `docs/UserGuide.md` and stale PR/failure status in this log. The migration and database tests confirm automatic XP recomputation when re-enabled; pre-tracking grades without a recorded grade basis still need review and republishing. Commit `15c44c7` updates the guide and log and was pushed. The PR description now says open and ready for review. Inline replies were posted and both threads were resolved after the push. On head `15c44c7`, Scaffold checks, CodeQL, and Vercel passed; Application checks were still running at the time of this update.

## Work and verification

- Files and requirement links: `docs/UserGuide.md`, `docs/DeveloperGuide.md`, `openspec/changes/build-programming-platform/tasks.md` task 6.3, this summary, and `docs/superpowers/plans/2026-11-12-guide-documentation-drift.md`.
- Commands/checks actually run and outcomes: local `pnpm format:check` passed; `pnpm check:scaffold` verified scaffold artifacts and local Markdown links; `pnpm spec:validate` passed (8 items, 0 failed); `pnpm site:build` compiled the Docusaurus client and server and generated static files; `git diff --check` passed; a targeted stale-claim scan found no known old wording. Branch CI runs for [Application checks](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/actions/runs/43167319181), [Scaffold checks](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/actions/runs/43167323864), and [CodeQL](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/actions/runs/43167324927) completed. Scaffold and CodeQL passed. Application, database, and ordinary browser jobs passed (31 browser tests passed; 85 were skipped because authenticated local fixtures are not configured for that job). The authenticated browser job initially had 83 passed, 1 skipped, and 1 failed: `tests/e2e/responsive-history.spec.ts` reported that the “Code changes” region did not advance `scrollLeft` after `ArrowRight`. On final PR head `74c4855`, the authenticated workflow passed with 84 passed and 1 skipped. The assertion did not reproduce; no application code changed in this documentation-only branch.
- Failures, retries, unresolved issues: `pnpm` was unavailable in the restricted shell; elevated checks succeeded. An initial stale-phrase scan matched a valid lowercase runtime event because the search was case-insensitive; the case-sensitive scan passed with no known stale claims. The earlier responsive-history assertion did not reproduce on PR head `74c4855`; its cause is unconfirmed. Final-head PR checks passed on `74c4855`: application, authenticated E2E, database, coverage report, scaffold, CodeQL, and Vercel checks passed; Supabase Preview was skipped. Human verification remains pending.
- Resource measurements and unavailable fields: not measured; exact Codex model is unavailable.
- Next steps: human verification remains pending, and OpenSpec task 6.3 remains open for reflections and acknowledgements. Both PR review threads are resolved.
