# Local development seed data implementation plan

**Goal:** Make a fresh local Supabase database useful for student and instructor development with synthetic accounts and linked coursework records.

**Architecture:** Use Supabase's migration-following `supabase/seed.sql` mechanism with deterministic fixture identifiers. Add a pnpm command that explicitly resets only local Supabase, and document fixture access and schema upkeep.

**Tech Stack:** Supabase CLI, PostgreSQL seed SQL, pnpm.

**Spec:** `openspec/changes/build-programming-platform/specs/engineering-and-delivery/spec.md`, issue #27.

## Constraints

- Local development data only; never connect to a hosted project.
- Use only synthetic accounts and records.
- Minimum 10 students, 3 instructors and 10 assignments; include rubrics, submissions and published/unpublished grades.
- No migrations, schema changes, new dependencies, uploaded files, or product authorization changes.
- `pnpm db:seed` must clearly warn that it deletes existing local database contents.

## Review focus

- Fixture role assignment must stay in trusted seed SQL; public signup still creates students.
- Account, assignment, rubric, submission and grade foreign keys must match the current schema.
- Fixture IDs and `pnpm db:seed` behavior must be repeatable and local-only.
- Synthetic sources must remain stored examples and must never execute in Next.js/Node.

## Tasks

- [x] Enable the configured Supabase seed file and add deterministic accounts plus linked assignments, rubrics, submissions and mixed grade states.
- [x] Add `db:seed`, explain its destructive local reset behavior, seeded-account password-reset path and schema-change maintenance in contributor documentation.
- [x] Run fresh local startup/reset and inspect account/assignment/related-record counts; run applicable static/spec checks and record any unavailable checks.
- [x] Update the dated session log and link issue, OpenSpec, branch, checks and any eventual PR.
