## 1. Reproduce and implement

- [x] 1.1 Reproduce the insert-between-pages duplicate in local database-backed Chromium with synthetic fixtures before changing production code.
- [x] 1.2 Add failing-first cursor validation, forward/backward query, metadata/privacy and navigation regressions; implement strict timestamp/ID cursors with no offset fallback.
- [x] 1.3 Integrate filter-preserving Next/Previous/Latest navigation, legacy URL reset and route validation; verify inserts, timestamp ties, refresh and backward browsing with local database-backed browser tests.

## 2. Verify and publish

- [x] 2.1 Run full units, applicable lint/type/build, browser regressions, scaffold and strict OpenSpec; update guides only with verified behavior and maintain the dated log.
- [x] 2.2 Commit verified milestones, push the issue-linked branch and open PR #175 to develop after source-head branch CI; record actual evidence and leave human review pending.

Final PR-head CI is a handoff gate. Record its outcome in the PR after the last metadata commit; do not infer it from historical source-head CI.
