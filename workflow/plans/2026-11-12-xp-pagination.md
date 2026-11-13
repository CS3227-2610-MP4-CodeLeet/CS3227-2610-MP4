# XP pagination implementation plan

Issue #169; branch `fix/169-xp-pagination`; approved design: [XP pagination consistency](2026-11-12-xp-pagination-design.md). Execute inline with regression-first database and application changes.

1. Add failing database regressions for stale/missing revisions, unchanged pages and authorization; reproduce before migration.
2. Add a forward migration computing authorized revision and effective page from one statement snapshot, retaining bounded page inputs and private data boundaries.
3. Add failing application regressions; implement strict shared revision parsing, RPC transport, returned metadata, links and restart notices across API and rendered pages.
4. Verify database/unit/browser behavior, lint/types/build and specs; document current behavior after verification.
5. Reconcile nine original tasks with precise evidence and unresolved gates. Obtain independent review where required, then commit, run branch CI, push and open the issue-linked PR to develop.

Review focus: concurrent changes between reads; student name/membership changes; unauthorized revision reuse; missing/malformed/duplicate revision inputs; totals/ranks/links agreeing with returned first-page data.
