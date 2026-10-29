# Session: 29 October 2026 student assignment practice tests

- Timezone: Asia/Singapore
- Participants: requester and primary Codex agent; no specialist delegation
- AI tool: Codex; model/token/cache measurements unavailable
- Issue: [#19](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/19), refs #5
- OpenSpec: build-programming-platform, task group 9
- Branch: feat/student-assignment-tests from develop f177b7d, after PR #18 merged
- PR: [#20](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/pull/20) to develop
- Human verification: pending; verifier/date not recorded

## Prompt and interaction summaries

1. Requester asked to connect Run tests to real student assignments, share the test-case contract, create an issue/feature branch after #18 merges, reuse browser results and use clearly separated development-only synthetic cases while awaiting teammate publication/storage. Browser results must not determine grades.
2. Verified #18 merged, fetched develop and created the feature branch while retaining the unrelated generated Next declaration edit. Read brief/process, active OpenSpec, runner/results and relevant local skills/Next docs. Created #19 with the teammate DTO/limits and explicit pending publication implementation. No external private message or teammate agreement is claimed.
3. Design decision: independently opt in to sum-of-two-integers example cases, explaining that they are not assignment tests. Gate fixture transfer at the server with development + runner + fixture flags and require an explicit unchecked example choice in the UI. Reuse existing isolation, execution deadlines, output matching and safe text rendering. No database or submission/grade payload changes.
4. Wrote a fixture-gate test first; it failed because the adapter did not exist. Implemented the adapter and all eight gate/bounds/caller-isolation cases passed. Extended real Python/Java browser journeys and observed the expected missing-checkbox failure before implementing the UI. Docker was stopped; restarted Docker Desktop hidden and existing Supabase containers without reset, capturing startup/status output without recording credentials.
5. Added the standalone server adapter, example selection wrapper, server-to-form props and example-aware runner/result labels. An initial PowerShell command used unsupported Bash brace expansion and did not execute; reran with explicit paths. Lint reported a long form/helper and duplicate test strings; extracted the props type and focused helper functions rather than disabling checks. The full unit suite passed 107 tests; ESLint, formatting, strict TypeScript/type generation, production build, scaffold/links and strict OpenSpec validation passed.
6. Real Python/Java example journeys passed twice, including match/mismatch, expected/actual output, runtime/compile errors, five-second timeouts, stale results and private immutable saves. The final run also verified active opt-out cancellation, no iframe remaining, source preservation, fresh Not run state on re-selection and no API/data writes during practice (2 passed). Production tests with all preview/runner/fixture flags true passed 9 checks including both languages with no example controls, the existing rubric/grade journey with mocked AI, account/recovery and production preview denial. These tests use synthetic accounts; no live AI, hosted deployment or SMTP verification is claimed.

7. Existing sample/editor/runtime regression passed 24 checks, preserving published-case labels, syntax/indentation, themes, mobile layout and all four runtime scenarios. Author reviewed server fixture gating/serialization, explicit provenance, runner remount cleanup and unchanged submission/grade boundaries. No independent reviewer was used under the repository delegation constraint. Committed verified integration at 3ea4eb4; documentation/PR closeout follows.

8. Pushed feat/student-assignment-tests and created PR #20 to develop, linking issue #19/#5, OpenSpec group 9, contract, plan and summary. Publication does not claim merge, deployment or teammate contract acceptance. Human verification remains pending. Temporary test servers were stopped after verification and the pre-existing local generated Next declaration paths were preserved without committing them.

## Work and verification

- Plan: workflow/plans/2026-10-29-student-assignment-tests.md
- Contract: workflow/contracts/published-practice-cases.md
- Checks/results: 107 unit tests; 2 extended authenticated browser journeys; 9 production/account regression checks; static/build/spec checks passed. Existing preview/runtime regression: 24 passed, including all four runtime scenarios.
- Independent review: not performed; human review pending
- Failures/retries: expected missing-module and missing-checkbox red checks; PowerShell syntax retry; lint-driven helper extraction. No unresolved application failure currently known.
- Resource measurements: unavailable
- Next owner: teammate for teacher persistence/publication, requester for student integration; contract acceptance pending
