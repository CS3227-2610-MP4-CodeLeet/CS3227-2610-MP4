# Submission history pagination implementation plan

Use the repository executing-plans skill for inline implementation. No specialist delegation was requested; independent human review remains pending.

Goal: fix issue #171 with the requester-approved timestamp/ID cursor design.

Spec: [approved design](../../openspec/changes/archive/2026-11-13-fix-submission-history-pagination/design.md) and [behavior delta](../../openspec/changes/archive/2026-11-13-fix-submission-history-pagination/specs/assignments-and-grading/spec.md).

## Constraints and review focus

- Retain 25-row pages, literal title/language filters, current verified student/course access, RLS and metadata-only projection.
- Preserve exact timestamp precision and ID tie-breaking; do not turn cursor input into raw query syntax without validation.
- Handle Next, Previous, refresh, malformed/duplicate/conflicting values and old page-only URLs. Filter changes reset navigation.
- New rows must not shift forward pages; backward queries must select the nearest newer rows before reversing display order.
- Preserve unrelated next-env edits; no new schema, dependencies, instructor-dashboard behavior or live AI calls.

## Task 1: Cursor data access

1. Add failing unit tests for parsing/validation and real Supabase client's generated forward/backward requests. Extend existing loader tests without testing only mocks.
2. Implement a history-cursor module with validation and URL construction; update the loader to seek on timestamp/ID, limit to 26, take 25 and reverse backward results. Keep authorization filters independent of the cursor.
3. Run focused unit tests, formatting/lint and commit a verified milestone when integration is coherent.

## Task 2: Page navigation and browser reproduction

1. Add failing route/presentation tests for safe invalid inputs, legacy reset, cursor links with filters and latest-page recovery.
2. Use a history-specific pagination component. Keep other numbered lists unchanged. Disable prefetch for changing history pagination.
3. Rebuild the production test app and pass the previously failing browser reproduction, plus Previous/refresh/Latest and filter/tie cases. Update affected old tests to the approved cursor contract.

## Task 3: Verification and closeout

1. Run full units, lint, types, application build, relevant real-database browser journeys, strict OpenSpec and scaffold checks. Record failures and retries accurately.
2. Update the User/Developer Guides after behavior is verified, and update the dated session log and checked OpenSpec tasks only after their checks pass.
3. Push the issue-linked branch, require branch CI before PR creation, create a PR to develop with Closes #171 and all artifact/evidence links, then check final-head CI. No merge/deployment/release approval is implied.
