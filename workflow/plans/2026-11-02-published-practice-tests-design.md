# Instructor-authored public practice tests — design for review

Issue: [#74](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/74). Branch: `feat/published-practice-tests`, from merged develop `fe04c40`. OpenSpec: `build-programming-platform`, browser-code-execution and assignments-and-grading. Status: requester approved this design on 2 November 2026. Teammate review remains separate. See the [implementation plan](2026-11-02-published-practice-tests.md).

## Goal and user journeys

An instructor opens **Practice tests** for an owned assignment and creates up to five cases with **Name**, **Input** and **Expected output**. Cases run the assignment's Python or Java program through stdin/stdout. No uploads, function-return harness, hidden cases, automatic grading or XP.

**Save draft** keeps changes private. **Publish tests** atomically saves and publishes the edited set. Saving a later draft does not replace the last published set. **Unpublish tests** removes the student-visible set while preserving the instructor's draft. A published assignment and a published test set are both required for student access. Publishing test cases does not publish a draft assignment.

Students see **Published test cases** and **Run tests** in the existing assignment workspace. Results show pass/fail, expected/actual output and errors with the current runner. Empty sets show a concise no-tests message. Loading failures show an error/retry action rather than claiming no cases exist. Running tests never submits code or changes grades.

## Approach and alternatives

Use a dedicated instructor Practice tests page linked from the assignment workspace/list. This reuses assignment ownership and avoids coupling case editing to rubric/language/deadline form saves. Embedding cases in the existing form is possible but would enlarge its shared payload and make unrelated edits/publishing harder to distinguish. A separate execution/grading service would violate the browser-only requirement and is excluded.

## Existing contract retained

- At most five cases, stable distinct UUIDs, explicit order, nonblank names up to 120 characters.
- Input at most 4,096 UTF-8 bytes and expected output at most 8,192 bytes per case. Empty input/output are valid. Preserve literal input/output whitespace; reject NUL/invalid Unicode. Mirror limits in API/database validation.
- Compare printed stdout after normalizing line endings and removing at most one final newline. Preserve other spaces/case. Runtime/compilation failure never passes, even if partial output matches.
- Existing browser-only Python execution and Java compilation/execution, fresh per-case state, output caps, five-second execution deadline, separate preparation deadline and suite timeout remain unchanged.
- Use the existing structured error envelope and private/no-store API responses. Never send client run results to grade/publication services.

## Persistence and authorization

Use additive migration(s) with separate instructor draft storage and student-visible published snapshots. Do not put draft data in a row students can select. Test-set identity belongs to the assignment; case IDs/order and a monotonically increasing published revision identify each snapshot. Existing assignments start without authored tests.

Only the verified owning instructor may read/change drafts or publish/unpublish. An atomic database operation checks current ownership/trusted role, validates all cases and applies an expected edit version; conflicting saves return a conflict and retain client input. Repeated publication and concurrent edits must not partially replace a set. Direct client writes are denied; role/ownership RLS protects reads independently of UI routes.

Students read only the public-case projection for an accessible published assignment; signed-out, wrong-role or unavailable assignment requests fail without revealing draft existence. No rubric, grade, instructor-private metadata, student source or service key is returned. A failed read is distinguished from an empty published set.

## APIs and runner integration

- Owner GET/update endpoint under `/api/assignments/[assignmentId]/practice-tests`; bounded strict bodies, verified instructor identity, same-origin write guard, expected version and explicit save/publish/unpublish action.
- Student GET `/api/student/assignments/[assignmentId]/test-cases` follows the existing [handoff contract](../PublishedPracticeTests.md): assignment ID/version, published test-set revision and ordered public cases only.
- Reuse `practice-tests.ts` and `practice-runner.tsx`. A run captures one source/test-set snapshot; later edits cannot change cases halfway through it. Fetch current published cases for a new test run; retain existing source/unsaved-save state. Navigation/unmount terminates execution.
- Existing development examples stay explicitly separate and cannot substitute for missing/failed real data. Production has no fixture fallback. Results from a replaced case set are cleared on a new run; no polling or background execution is introduced.

## Verification and rollout

Unit/route tests cover byte/Unicode bounds, preserved whitespace, strict fields, role/origin/identity denial, conflicts, safe errors, snapshot mapping and no-fixture fallback. pgTAP covers direct draft leakage, owner/peer/anonymous permissions, concurrent/version-safe publication, unpublishing, assignment visibility and existing-data compatibility.

Synthetic instructor/student browser journeys cover authoring, save-draft versus publish, editing after publication, unpublish, empty/error states, Python/Java test verdicts, source retention, unauthorized access and mobile/theme behavior. Actual runtime checks must be distinguished from mocked results and prerequisite skips. Run applicable regression/build/spec/format checks and verify final-head PR CI before handoff.

Apply the forward migration before using new app reads; no reset/seed of existing local data. Hosted migration and deployment remain separate team-managed rollout actions. Update the handoff, verified User/Developer Guides and dated logs; do not claim teammate review, hosted acceptance or a release without evidence.
