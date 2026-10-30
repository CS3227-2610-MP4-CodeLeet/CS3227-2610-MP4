# Local workspace seed implementation plan

Issue: [#27](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/27). Branch: `feat/local-workspace-seed` from `develop`.

## Design and decisions

The user requested the proposed reproducible local dataset. Use one native Supabase SQL seed, rather than a new fixture service or API-based importer, so fresh local starts and resets share the same data definition. A Node 24 command runs that file through psql in the local Docker container, supplying a process-scoped password over stdin. There is no committed password or admin key. Normal seed application preserves existing passwords; `db:seed` deliberately rotates only the thirteen seed accounts' passwords to the supplied CODELEET_SEED_PASSWORD without printing it. It never resets the database.

Use reserved UUIDs, `.example.test` addresses and trusted seed metadata. Reject conflicting identities before granting instructor roles. Insert missing records only; preserve edited assignments, profiles, grades and existing submissions. Seed ten students (the last has no submissions), three instructors, ten assignments (both languages, eight published and two drafts), private rubrics, four revisions per submitted assignment and both draft/published grades. No AI calls, grade inference, execution or XP awards occur.

Keep the SQL outside migrations, enable it only through local seed configuration, and refuse command arguments/production mode. A database reset remains destructive and must be explicitly requested by the user; verification here uses an additive seed plus rollback-only tests instead of resetting their database. No new schema/RLS/functions or dependencies. Existing `next-env.d.ts` edit is excluded. No specialist delegation is authorized; author review is not independent review.

Ruling: The installed CLI rejects multi-statement SQL in `db query --local --file`. Use Docker psql through an explicitly local socket instead; no temporary password file or shell interpolation is needed.

## Tasks and checks

- [x] Write failing command-boundary tests and dataset/RLS pgTAP assertions.
- [x] Add atomic, idempotent SQL seed and non-logging password local command; enable native fresh-start/reset seeding.
- [x] Verify repeated application, partial recovery, preservation of unrelated data and edited fixtures, both-language password sign-in, instructor ownership and private student history/grades.
- [x] Document seed command, destructive reset distinction, accounts, schema-maintenance rule and actual evidence; run unit/database/static checks.
- [x] Commit focused verified changes, push and create PR to `develop` linked to issue, spec and summary.

## Review focus

Auth schema compatibility, identity collisions, full transaction rollback, hidden rubrics/draft grades, no hosted target or secret leakage, stable identifiers across repeated runs, and retaining manually edited seed data.

Outcome: [PR #29](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/pull/29) targets develop. All planned checks passed. Independent teammate/log review remains pending.

## PR #29 security review follow-up

CodeQL correctly identified clear-text password logging. Remove the output entirely, require CODELEET_SEED_PASSWORD in the process environment, validate it without echoing input, and encode it for safe SQL transport over stdin. Integration tests generate their own ephemeral password and assert raw/base64 forms are absent from stdout/stderr before checking sign-in. Document hidden PowerShell entry and keep passwords out of files/history. No alert suppression or dismissal.
