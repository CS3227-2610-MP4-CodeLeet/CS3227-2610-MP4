# Published practice test contract

Requester accepted stdin/stdout practice tests on 27 October 2026. This document is the handoff to the teammate who owns assignment authoring, authentication and migrations. It does not claim teammate acknowledgment, implemented teacher publishing or database integration.

## Shared-service interface to implement

Proposed GET `/api/student/assignments/[assignmentId]/test-cases`, protected by the same verified student session and published-assignment visibility as the student assignment routes. Response:

```json
{
  "data": {
    "assignment_id": "assignment UUID",
    "assignment_revision": 1,
    "test_set_revision": 1,
    "cases": [
      { "id": "case UUID", "name": "Positive numbers", "stdin": "2 3\n", "expected_stdout": "5\n" }
    ]
  }
}
```

The teammate chooses/maps physical schema and supplies trusted authoring/publication/RLS operations. Only the owning instructor may edit/publish cases; only published cases attached to a published assignment reach students. Exclude draft cases, private rubric/grades and hidden tests. Empty published sets return an empty array for an otherwise accessible assignment; unavailable assignments return the existing non-disclosing 404. Use the existing error envelope and no-store policy. Preserve stable ordering and version the published set so the student can identify the snapshot run.

Maximum five cases; distinct nonempty IDs; nonempty names up to 120 characters; stdin at most 4,096 UTF-8 bytes and expected stdout at most 8,192 bytes per case. Preserve literal input/output text, including whitespace, and mirror invariants in the future server/database implementation. IDs in the current fixture preview are synthetic labels, not a final UUID schema.

## Student implementation

`practice-tests.ts` owns comparison and sequential execution. `practice-runner.tsx` displays custom stdin, public inputs/expected outputs, actual output, stderr, approximate execution timing and per-case verdicts. It snapshots source/cases for a run, invalidates visible results after edits, stops unrun cases on cancellation/infrastructure/compile failure, and leaves Submit disabled. Each case starts a fresh interpreter/compiler/program/worker; only reviewed asset bytes are cached. Java recompiles per case initially.

The requester removed the visible student Stop button during UI refinement. Navigation/unmount still ends the active runner and automatic deadlines remain; the internal stop API is not removed. The student toolbar contains only Run code and Run published tests, with limits/comparison details available on demand.

Compare stdout after converting CRLF/lone CR to LF and removing at most one final LF from each side. Preserve all other spaces, case and blank lines. Nonzero/failed execution never passes even when partial output matches. Stderr is diagnostic text, not expected output. Floating-point text is compared exactly; no numeric tolerance or return-value harness is implemented.

Per case: five seconds of execution after the worker announces program execution; helper/source compilation has a separate 20-second watchdog, runtime preparation remains bounded, and the UI stops a suite after 90 seconds. The iframe supervisor owns deadlines/worker termination and message/output bounds. Worker-reported lifecycle events cannot reset the timer repeatedly. Results are untrusted practice feedback, never grades or XP. Published browser tests are inspectable; passing the samples does not prove correctness for all inputs. Browser timers and machine speed do not supply fair performance rankings or hard memory quotas.

## Local preview and remaining gates

The normal preview is development-only. Enable STUDENT_PREVIEW_ENABLED and STUDENT_RUNNER_PREVIEW_ENABLED together to expose local Run/published tests. The fixed loopback static runner on 127.0.0.1:3130 serves assets/glue only and accepts no compilation/execution requests. The app sends source as a browser message to a separate-origin trusted bridge, which creates the inner opaque supervisor/worker. Origin, window, nonce, request ID, output shape/size and deadlines are checked. The bridge accepts loopback HTTP parent origins only. No app credentials/session are deliberately passed.

This local synthetic-data setup is not a production credential boundary: cookies can be shared across ports of one hostname. Production preview routes stay unavailable; choose a separately hosted credential-free origin, complete asset/license/provenance review, independently review the changed bridge and verify the supported browser matrix before release. No migration or teacher UI has been edited for this slice.

Reproduction and verified behavior belong in [UserGuide](../docs/UserGuide.md); checks/limitations are recorded in the [session log](../logs/2026-10-27-published-practice-tests.md).
