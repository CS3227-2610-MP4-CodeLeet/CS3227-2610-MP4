# 2026-10-30 — local development seed data

- Timezone: Asia/Singapore
- Participants/actual agent IDs: User; Codex primary agent `/root`; read-only reviewer `/root/seed_review`
- AI tools/models, where known: Codex; exact model identifier unavailable
- GitHub issue: [#27 — seed local student and instructor workspaces](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/27)
- OpenSpec change: `openspec/changes/build-programming-platform/` (active)
- Branch and commits: `feat/local-dev-seed-data`, based on `develop`; `315a147` implementation and `8022fb2` local-only safety correction; push pending
- Pull request: Not created yet
- Human verification: pending
- Verifier/date: Not yet reviewed

## Prompt and interaction summaries

1. The user requested pnpm seeding commands for local student/instructor accounts, assignments and related data, plus a contributor reminder to maintain seeds after schema changes. The repository instructions required an issue, active OpenSpec update, focused feature branch, dated log, and verification before PR closeout.
2. No existing open issue matched this scope. Issue #27 was created. The only active OpenSpec change, `build-programming-platform`, was updated with the seed requirement, design and tasks. The work was placed on `feat/local-dev-seed-data`; an initial branch creation was denied by sandbox permissions, then succeeded through the approved sandbox escalation.
3. The user clarified that restricted-shell command failures should be retried with permission and that a successful permission path should be documented in `AGENTS.md`. Elevated access found Node.js 24.16.0, pnpm 12.15.0, Supabase CLI 2.119.0 via `pnpm exec`, and OpenSpec 1.15.0. `AGENTS.md` now tells contributors to retry required commands with elevated permission when unavailable in the restricted shell.
4. Before commit, the shared local demo password was removed to comply with the repository's no-credentials rule. Seeded users have no preset password; the setup guide points developers to request a reset through local Mailpit.
5. Inspection of local Auth schema confirmed identity fields and showed email is generated. The seed now adds email identities without preset passwords; an initial reset targeting that generated column failed, then succeeded after removing the column from the insert.
6. After local verification, commit `315a147` was created. The read-only reviewer identified that Supabase's configured automatic seed path could apply the local fixture on a linked reset. Verified the concern against current Supabase documentation, disabled automatic seed loading, changed `db:seed`/`db:reset` to explicitly reset with `--local --no-seed` and apply the SQL with `db query --local`, then amended the OpenSpec design/spec and contributor guides to record the linked-reset boundary.
7. The explicit pnpm seed flow passed. A plain local `supabase db reset --local` produced zero assignments, confirming no automatic fixture load; the explicit local seed query then restored the fixture counts. Reapplying the seed twice kept fixture counts stable. The reviewer rechecked commit `8022fb2`, confirmed the linked-reset finding was resolved, and reported no remaining code findings. Human verification remains pending.

## Work and verification

- Files and requirement links: `AGENTS.md`, `supabase/seed.sql`, `supabase/config.toml`, `package.json`, `supabase/README.md`, `CONTRIBUTING.md`, active OpenSpec spec/design/tasks, `workflow/plans/2026-10-30-local-dev-seed-data.md`.
- Implemented deterministic synthetic fixture definitions for 12 students, 3 instructors, 12 Python/Java assignments (10 published, 2 drafts), rubrics, 24 submissions, and a mix of published/unpublished grades. Added local `db:seed` reset command and schema-change upkeep documentation.
- Database verification: `pnpm db:seed` completed with explicit `--local --no-seed` reset and `db query --local` application. A plain `supabase db reset --local` left assignment count at zero; explicitly applying `supabase/seed.sql` restored counts: 12 students, 3 instructors, 12 assignments, 12 rubrics, 24 submissions and 12 grades. Reapplying the single-block seed twice kept counts stable at `12/3/12/12/24/12`. Earlier detailed checks established 12 email identities, 10 published/2 draft assignments, 8 published/4 unpublished grades, and no preset password on all fixture accounts.
- Checks run: `pnpm db:test` passed all 59 pgTAP checks. `pnpm format:check` passed. `pnpm exec openspec validate --all --strict` passed all six items. `git diff --check` passed after the reviewer correction.
- Review: `/root/seed_review` reviewed initial commit `315a147` and requested changes for automatic seed loading on linked reset. Follow-up review of `8022fb2` confirmed automatic loading is disabled and scripts apply fixtures only via local reset/query; no remaining code findings. This is an agent review; independent human verification remains pending.
- Failures/retries: The first pgTAP run failed because seeded account IDs overlapped fixture IDs in `accounts_and_access.test.sql`; the seed IDs were moved to unique prefixes, then reset counts and all 59 database checks passed. An Auth seed reset initially failed because email is a generated column; removing it from the insert fixed the reset. `supabase db query --file` could not execute the original multi-statement SQL in prepared-statement mode; the file is now a single `DO` block and the local query succeeded. A config edit briefly changed API TLS while enabling seed settings; the original TLS setting was restored and confirmed in the final diff.
- Runtime limitation: The installed Node.js is v24.16.0 while `.node-version` pins v24.22.1; the checks above ran on the installed version. Seeded-account password-reset behavior was not exercised during this task.
- Resource measurements: Not available.
- Remaining: Human verification is pending. Push and PR closeout remain pending.
