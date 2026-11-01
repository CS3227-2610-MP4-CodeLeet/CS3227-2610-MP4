# Session: 1 November 2026 assignment deadlines

- Timezone: Asia/Singapore
- Participants: user and primary Codex agent; no specialist delegation
- AI tools/model: Codex; exact model/hidden reasoning/cache measurements unavailable
- Issue: https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/59
- OpenSpec: build-programming-platform, assignments-and-grading, task group 24
- Branch: feat/assignment-deadlines from develop 039c51d
- Plan: workflow/plans/2026-11-01-assignment-deadlines.md
- PR: pending
- Human verification: pending
- Verifier/date: pending

## Prompt and interaction summaries

1. User requested optional assignment deadlines and submission status, explicitly noting late-rule agreement/shared schema work. Read current brief/process/spec status, instructor forms/API and student submission RPC. Asked one necessary product-rule question using async input while investigating read-only. User selected accepting late submissions and marking them Late, with no automatic penalty. No teammate agreement/review was asserted.
2. Selected optional finite UTC instants with SGT input/display, database-stamped new-revision time and captured deadline/late flags, exact-deadline on time, stable historic metadata/retries, latest-own-revision status and current RLS/version guards. Read Supabase/Postgres skills and primary timestamp/locking/security docs, plus planning/TDD/OpenSpec skills. Chose simple read-on-refresh status rather than polling. Created issue #59, independent branch from updated develop (PR #58 unmerged) and an empty forward migration through the pinned CLI. Preserved existing next-env.d.ts and .env.local. Shared schema changes requested by user; teammate review remains pending. No agents delegated, data reset, migration application or implementation claimed yet.

## Work and verification

- Planned boundaries: no blocked late saves, automatic grade penalty, browser execution/AI authority changes, new privileged app key or hosted mutation.
- Actual checks/results: pending.
- Human/independent verification: pending.

3. Test-first helpers failed for missing code, and pgTAP failed on the three absent deadline columns. Added forward migration 20261101141715 through the existing CLI-created file: finite optional due date/read grant, captured deadline/late fields and consistency constraint, clock_timestamp default, row-share-locked insert trigger and compatible eight-argument authorized assignment RPC. Kept old signatures and retries, existing RLS/write revokes/version/language guards. Applied only this pending migration locally, without reset/seed; all 147 database assertions (23 new) passed. Tests cover both languages, accepted late saves, exact equality, trigger override, real DB time, metadata write denial, extensions, stable retries/history, clearing, legacy RPCs and role/privacy. Updated fresh seed examples with relative future/past/no-deadline dates; did not execute seed against existing data.

4. Added failing API deadline/SDK metadata/render regressions, implemented strict optional/null ISO contract, SGT conversion/status helpers, source-free latest-own embedded metadata query and safe timing components. Source query retains explicit student/publication filters and one revision per assignment. New UI wiring in progress. Existing history projection assertions needed their two new public timing columns, with private/source columns still excluded. Extracted optional RPC arguments and instructor timing presentation to meet lint limits. Two patch context failures were atomic with no partial product edits. Unit validation/render and SQL tests passed; final full-suite and browser evidence pending.
