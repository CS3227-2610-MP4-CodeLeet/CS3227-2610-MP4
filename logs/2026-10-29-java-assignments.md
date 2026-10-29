# Session: 29 October 2026 Java assignments and submissions

- Timezone: Asia/Singapore
- Participants: requester and primary Codex agent; no specialist delegation
- Issue: [#17](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/17), refs #5
- OpenSpec: build-programming-platform, task group 8
- Branch: feat/java-assignments; rebased onto origin/develop 71c0e6a after prerequisite PR #16 merged
- PR: pending; prerequisite [PR #16](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/pull/16) merged as 71c0e6a; publication will use the updated develop base
- Human verification: pending

## Prompt and interaction summaries

1. Requester explicitly asked for instructor Python/Java selection, database/API acceptance, real editor/runner language, immutable saving and private revision history for both languages.
2. Inspection found Python restrictions in schema/RPC, UI projections and AI context. Chosen design snapshots assignment language on each revision and prevents changing language after submissions. Preserve existing source bounds, role/RLS, idempotency and browser-only execution. Add a forward local migration without resetting data. Baseline aggregate submission count: 15; no source or identity data was read for that count.
3. Created issue #17 and a branch from develop, then incorporated the existing unmerged editor/account prerequisite by fast-forward so the local UI remains available. A sandboxed Supabase help invocation failed on its telemetry file; escalated CLI discovery succeeded. PostgreSQL/Supabase primary docs and relevant local schema/RLS/locking guidance were read. CLI created migration 20261029032830_java_assignments_and_submissions.sql.
4. Added contract/context tests, observed rejection of the new explicit assignment language before implementation, then implemented shared language validation, instructor choice, real editor/runner/history and revision-aware AI context. Added an atomic compatible RPC overload and database triggers to derive language and prevent historical relabeling. Applied the forward local migration without reset: the aggregate count stayed 15 and all revisions had a language.
5. Browser testing exposed a transient undefined enum in an existing development process; a separate fresh development process and production build did not reproduce it. Exact label selectors then stalled on select options; added an explicit language accessible name and used the status combobox role. A test expected an empty grade array, but the existing one-to-one API relation returns null for hidden/missing grades; corrected that assertion without changing access rules. Timeout cleanup may have left synthetic accounts from early failed runs; no real records were deleted.
6. Requester said the session was interrupted and asked to continue. Docker and servers were no longer running; restarted Docker Desktop hidden and resumed the existing Supabase containers without reset. Repeated both language journeys including browser stdin/output, two revisions, retry, forged field rejection, two-student privacy and instructor language lock: 2 passed. Existing account/recovery and authenticated Python/rubric/grade journey: 6 passed (AI responses mocked).
7. Added an explicit unpublished Java-grade privacy fixture; database suite now passes 59 assertions across three files. Security advisor returned no issues. No live AI request, hosted runtime or deployment was tested. No specialist was delegated; author review is not independent review. PR #16 was observed merged, and origin/develop fetched for removing duplicate prerequisite commits from this branch.

8. Rebasing only the two Java commits onto merged develop succeeded; generated Next declarations had no uncommitted change at that moment, so a scoped stash was unnecessary (no stash created). Final full browser regression included preview editing/layout, all four runtime scenarios and production fixture denial: 32 passed, 4 explicit local-service opt-ins skipped. No production runner was enabled. Author inspected data locks, DB derivation/grants, fixed language mapping, strict DTOs and text rendering; independent human review remains pending.

## Work and verification

- Plan: workflow/plans/2026-10-29-java-assignments.md
- Checks/results: 99 unit tests; 59 database assertions; two real Python/Java browser journeys with execution; six account/recovery/MVP regression browser checks; ESLint, Prettier, production build, scaffold and strict OpenSpec validation passed. Additional full browser suite: 32 passed, 4 local-service opt-ins skipped; the MVP and both language opt-ins passed separately above. The local email opt-in was not repeated. Type generation/strict TypeScript and git diff --check passed.
- Independent review, live AI and hosted deployment: not performed
- Resource/token measurements: unavailable
