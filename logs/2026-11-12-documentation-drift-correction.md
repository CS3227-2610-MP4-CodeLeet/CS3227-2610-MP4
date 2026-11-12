# Session: 2026-11-12 documentation drift correction

- Timezone: Asia/Singapore
- Participants/actual agent IDs: User and Codex `/root`; no specialist agents
- AI tools/models, where known: Codex; exact model not exposed
- GitHub issue: [#162](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/162)
- OpenSpec change: `build-programming-platform`, task 6.3 (guide updates; broader reflections and acknowledgements work remains open)
- Branch and commits: `docs/162-reconcile-guide-behavior`; guide and workflow changes committed as `1f068be` (`docs: reconcile guides with implemented behavior`)
- Pull request: [#163](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/pull/163) to `develop` (open, unmerged)
- Human verification: pending
- Verifier/date: pending

## Prompt and interaction summaries

1. User requested a thorough source-grounded consistency audit of both guides because documentation drift is graded as a bug. Static review found confirmed mismatches in role access, user input rules, join-code shape/storage, feature switches, test publication, revision-comparison flow, API contracts, source paths, and evaluation claims.
2. User confirmed the administrator contact and stated that Vercel Preview deploys `develop` at `https://dev-cs3227-mp4.johnwz123.me/` and Vercel Production deploys `master` at `https://cs3227-mp4.vercel.app/`. These facts are accepted as requester-confirmed; the contact will be retained, and deployment will remain distinct from hosted acceptance/release checks.
3. User asked for a branch and corrections. Created issue #162 and branch `docs/162-reconcile-guide-behavior` from the current `develop` checkout after normal branch creation was denied by read-only `.git` permissions; elevated `git switch` succeeded.

## Work and verification

- Files and requirement links: `docs/UserGuide.md`, `docs/DeveloperGuide.md`, `openspec/changes/build-programming-platform/tasks.md` task 6.3, `docs/superpowers/plans/2026-11-12-guide-documentation-drift.md`, this summary.
- Commands/checks actually run and outcomes: initial `git status` showed a clean `develop` checkout at `84bc38b`; branch creation succeeded with elevated terminal access. `pnpm format:check` passed (final docs checked). `pnpm check:scaffold` passed and verified local Markdown link targets (final docs checked). `pnpm spec:validate` passed (8 items, 0 failed). `pnpm exec openspec status --change build-programming-platform` reported all four planning artifacts complete. `git diff --check` passed. The active OpenSpec task 6.3 remains unchecked because its broader reflections and acknowledgements scope is not complete here.
- Failures, retries, unresolved issues: `node`, `pnpm`, and `openspec` were not on the restricted shell PATH. Retried repository CLI checks through the elevated terminal; all completed successfully. No application behavior tests or hosted browser checks were run because this change only edits documentation and workflow notes. Human verification remains pending.
- Resource measurements and unavailable fields: not measured.
- Source review: compared guide claims against relevant route handlers, feature contracts/loaders, Supabase migrations, runtime modules, package scripts, workflow configuration, and experiment records. Deployment mappings are requester-confirmed rather than independently checked against Vercel.
- Final interaction: pushed the branch and opened PR #163 to `develop`, linked to issue #162 with `Closes #162`. Human verification remains pending; the PR is open and unmerged.
