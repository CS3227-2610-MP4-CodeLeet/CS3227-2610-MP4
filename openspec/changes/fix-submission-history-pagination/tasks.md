## 1. Reproduce and implement

- [x] 1.1 Reproduce the insert-between-pages duplicate in local database-backed Chromium with synthetic fixtures before changing production code.
- [x] 1.2 Add failing-first cursor validation, forward/backward query, metadata/privacy and navigation regressions; implement strict timestamp/ID cursors with no offset fallback.
- [x] 1.3 Integrate filter-preserving Next/Previous/Latest navigation, legacy URL reset and route validation; verify inserts, timestamp ties, refresh and backward browsing with local database-backed browser tests.

## 2. Verify and publish

- [ ] 2.1 Run full units, applicable lint/type/build, browser regressions, scaffold and strict OpenSpec; update guides only with verified behavior and maintain the dated log.
- [ ] 2.2 Commit verified milestones, push the issue-linked branch and open a PR to develop after branch CI; verify final-head checks and leave human review pending.
