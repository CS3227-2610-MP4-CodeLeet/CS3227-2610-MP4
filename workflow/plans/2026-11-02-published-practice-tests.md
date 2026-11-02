# Published practice tests implementation plan

Issue #74; branch `feat/published-practice-tests`. [Approved design](2026-11-02-published-practice-tests-design.md). Requester approved 2 November 2026; teammate review is separate.

Implement inline with existing tools; preserve unrelated edits and browser-only execution. No uploads, official results/grades/XP writes, package additions or real data.

- [ ] Contracts/persistence: failing-first strict case tests and pgTAP; separate RLS draft/public tables, bounded JSON, atomic expected-version save/publish/unpublish. Forward migration only; no reset.
- [ ] API: failing-first owner/student route tests; verified roles/ownership, same-origin bounded writes, safe/no-store errors and published assignment/version/case projection.
- [ ] Instructor: own-assignment Practice tests page, five-case editor, explicit save/publish/unpublish with retained failures/conflicts and keyboard/mobile/theme controls.
- [ ] Student: reuse existing practice runner, real-case loading/retry, fresh fetch before each suite, one source/case snapshot, empty versus failure states and separated development examples.
- [ ] Verification: synthetic DB/API/browser journeys in both languages, privacy/version/limits/whitespace/error tests, regressions/build/lint/spec; docs/handoff/logs. Independent review scope must be recorded accurately.
- [ ] Commit verified milestones; branch CI, linked PR to develop and final-head CI. Hosted migration/acceptance remains pending.
