# 2026-10-30 — local development seed data

- Timezone: Asia/Singapore
- Participants/actual agent IDs: User; Codex primary agent `/root`; no specialist agents were dispatched
- AI tools/models, where known: Codex; exact model identifier unavailable
- GitHub issue: [#27 — seed local student and instructor workspaces](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/27)
- OpenSpec change: `openspec/changes/build-programming-platform/` (active)
- Branch and commits: `feat/local-dev-seed-data`, based on `develop`; commit and push pending
- Pull request: Not created yet
- Human verification: pending
- Verifier/date: Not yet reviewed

## Prompt and interaction summaries

1. The user requested pnpm seeding commands for local student/instructor accounts, assignments and related data, plus a contributor reminder to maintain seeds after schema changes. The repository instructions required an issue, active OpenSpec update, focused feature branch, dated log, and verification before PR closeout.
2. No existing open issue matched this scope. Issue #27 was created. The only active OpenSpec change, `build-programming-platform`, was updated with the seed requirement, design and tasks. The work was placed on `feat/local-dev-seed-data`; an initial branch creation was denied by sandbox permissions, then succeeded through the approved sandbox escalation. No other agents or handoffs were used.
3. The user clarified that restricted-shell command failures should be retried with permission and that a successful permission path should be documented in `AGENTS.md`. Elevated access found Node.js 24.16.0, pnpm 12.15.0, Supabase CLI 2.119.0 via `pnpm exec`, and OpenSpec 1.15.0. `AGENTS.md` now tells contributors to retry required commands with elevated permission when unavailable in the restricted shell.
4. Before commit, the shared local demo password was removed to comply with the repository's no-credentials rule. Seeded users have no preset password; the setup guide points developers to request a reset through local Mailpit.
5. Inspection of local Auth schema confirmed identity fields and showed email is generated. The seed now adds email identities without preset passwords; an initial reset targeting that generated column failed, then succeeded after removing the column from the insert.

## Work and verification

- Files and requirement links: `AGENTS.md`, `supabase/seed.sql`, `supabase/config.toml`, `package.json`, `supabase/README.md`, `CONTRIBUTING.md`, active OpenSpec spec/design/tasks, `workflow/plans/2026-10-30-local-dev-seed-data.md`.
- Implemented deterministic synthetic fixture definitions for 12 students, 3 instructors, 12 Python/Java assignments (10 published, 2 drafts), rubrics, 24 submissions, and a mix of published/unpublished grades. Added local `db:seed` reset command and schema-change upkeep documentation.
- Database verification: `pnpm db:seed` completed with `--local`; the local linked-project status was null. Read-only counts after reset were 12 students, 3 instructors, 12 email identities, 12 assignments (10 published, 2 drafts), 12 rubrics, 24 submissions and 12 grades (8 published, 4 unpublished). All 15 fixture users have no preset password. Reapplying the final seed through local Docker Postgres left counts unchanged at `12/3/12/24/12/15`.
- Checks run: `pnpm db:test` passed all 59 pgTAP checks after the ID correction. `pnpm format:check` passed. Package JSON parsing, local seed configuration and `git diff --check` passed. The new OpenSpec requirement no longer triggers a length warning.
- OpenSpec validation: `openspec validate --all --strict` exits 1 because the active change still has long-requirement warnings in other existing specs, including the prior issue-linked workflow requirement. The validator passed the other five spec entries. No unrelated specs were rewritten.
- Failures/retries: The first pgTAP run failed because seeded account IDs overlapped fixture IDs in `accounts_and_access.test.sql`; the seed IDs were moved to unique prefixes, then reset counts and all 59 database checks passed. An Auth seed reset initially failed because email is a generated column; removing it from the insert fixed the reset. `supabase db query --file supabase/seed.sql` could not execute the multi-statement file in its prepared-statement mode, so the repeat-application check used the local Postgres container directly. A config edit briefly changed API TLS while enabling seed settings; the original TLS setting was restored and confirmed in the final diff.
- Runtime limitation: The installed Node.js is v24.16.0 while `.node-version` pins v24.22.1; the checks above ran on the installed version. Seeded-account password-reset behavior was not exercised during this task.
- Resource measurements: Not available.
- Remaining: Strict OpenSpec validation has unrelated existing warnings. Independent human review is pending. Commit, push and PR closeout remain pending.
