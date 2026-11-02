# Published practice tests implementation plan

Issue #74; branch `feat/published-practice-tests`. [Approved design](2026-11-02-published-practice-tests-design.md). Requester approved 2 November 2026; teammate review is separate.

Implement inline with existing tools; preserve unrelated edits and browser-only execution. No uploads, official results/grades/XP writes, package additions or real data.

- [x] Contracts/persistence: failing-first strict case tests and pgTAP; separate RLS draft/public tables, bounded JSON, atomic expected-version save/publish/unpublish. Forward migration only; no reset. All 180 database assertions/eight files passed.
- [x] API: failing-first owner/student route tests; verified roles/ownership, same-origin bounded writes, safe/no-store errors and single-snapshot published assignment/version/case projection. Concurrent API/browser denial checks pass.
- [x] Instructor: own-assignment Practice tests page, five-case editor, explicit save/publish/unpublish with retained failures/conflicts and accessible responsive/theme controls. Python/Java authoring journeys pass.
- [x] Student: existing practice runner, real-case loading/retry, fresh suite snapshot, invalidated stale results, empty versus failure states and separated examples. Actual Python/Java runs and mobile recovery pass; scoped independent findings resolved.
- [x] Verification: 526 unit tests/coverage, 180 DB assertions, normal runtime/app build, lint/format/types, links/scaffold/spec pass. Browser run 70 passes/seven skips plus one corrected harness startup replay pass; all four new real-language journeys pass. Docs/handoff/logs and independent review disposition recorded with limitations.
- [ ] Commit verified milestones; branch CI, linked PR to develop and final-head CI. Hosted migration/acceptance remains pending.
