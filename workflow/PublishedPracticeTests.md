# Published practice test contract

Issue [#74](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/74). Requester accepted stdin/stdout tests on 27 October and approved the concrete authoring design on 2 November 2026. The implementation links instructor authoring and the existing student browser runner. Teammate review and hosted migration/acceptance remain separate gates; this document does not claim acknowledgment from another person.

## Authoring and publication

Owning instructors open Practice tests for an assignment and edit up to five ordered cases. Save draft retains private changes; Publish tests atomically saves/publishes them; Unpublish tests removes public cases while preserving the draft. A later draft save leaves the previous public set unchanged. Empty drafts are valid; publishing requires at least one case. A published set never makes a draft assignment visible.

Separate draft/public tables and existing assignment ownership/RLS prevent draft leakage. The database RPC serializes writes and requires an expected edit version. Concurrent stale writes return a conflict instead of overwriting work. Case IDs and order persist in each saved array; public set revisions advance on publish/unpublish. Only instructors owning the assignment may write, including trusted admins with ownership.

## API contract

Owner GET/PATCH `/api/assignments/[id]/practice-tests` returns private draft and publication metadata only to its verified owner. PATCH accepts a strict action with expectedVersion: save/publish require cases; unpublish does not accept cases. Raw JSON is capped at 400,000 bytes to accommodate escaped valid strings; logical limits below remain enforced. Origin, role, identifiers, fields and database ownership are checked independently.

Student GET `/api/student/assignments/[assignmentId]/test-cases` requires a verified student and published assignment. Response:

```json
{
  "data": {
    "assignment_id": "assignment UUID",
    "assignment_revision": 1,
    "test_set_revision": 1,
    "cases": [
      {
        "id": "case UUID",
        "name": "Positive numbers",
        "stdin": "2 3\n",
        "expected_stdout": "5\n"
      }
    ]
  }
}
```

The assignment and embedded public set come from one database statement snapshot. An available assignment with no published cases returns an empty array; missing/unpublished assignments return non-disclosing 404. A failed query returns an error rather than empty/example data. Responses are private/no-store. Student projections exclude draft data, private rubrics, grades and source.

Maximum five cases, distinct UUIDs, nonblank trimmed names up to 120 Unicode code points, stdin at most 4,096 UTF-8 bytes and expected stdout at most 8,192 bytes per case. Input/output remain literal, including whitespace and empty strings. Reject malformed Unicode/NUL; PostgreSQL text/JSON and the shared schemas enforce corresponding bounds. Production case IDs are UUIDs; historical preview fixture IDs remain synthetic labels.

## Browser execution and results

Each test run fetches current public cases, then captures one source/case snapshot. It runs sequentially in fresh Python interpreters or Java compiler/program workers; reviewed asset bytes may be cached. Leaving the page aborts pending case loads and prevents later execution. Refreshing changed cases hides old verdicts while preserving source/custom input. Source edits likewise make results stale. Refresh is disabled during execution.

Compare stdout after normalizing CRLF/lone CR to LF and ignoring at most one final newline. Preserve other spaces, blank lines and case. Runtime/compile errors and timeouts never pass even if partial output matches. Stderr is diagnostic text. No return-value harness or numeric tolerance is implemented.

Existing limits remain: five seconds of execution per case, separate 20-second preparation/Java compilation watchdog, bounded runtime loading, 8,192 combined output bytes per case and 90-second suite deadline. No hard browser memory quota or fair performance ranking is claimed. Browser results are inspectable, untrusted practice feedback and never official grades/XP; execution does not submit a revision or call an execution service.

## Examples, setup and rollout

Normal development uses real accounts and assignments. Explicit development examples may be offered only after a successful empty published set, with separate provenance and opt-in. Production and failed reads never receive example fallback. Legacy preview flags are not used.

`pnpm dev` prepares reviewed assets and starts the loopback static file server; Vercel Preview/Production selects the same-project runtime when assets are built. Node only fetches/serves assets and orchestrates tests; submitted code compiles/executes in the browser. Runtime provenance/licensing, deployed credential/network isolation and supported-browser verification remain release gates.

Apply `20261102023345_published_practice_tests.sql` before the new app reads its relations. No local reset/seed is required. Hosted migrations follow the team's reviewed rollout. Reproduction and exact results are in the [summary](../logs/2026-11-02-published-practice-tests.md), [plan](plans/2026-11-02-published-practice-tests.md) and [Developer Guide](../docs/DeveloperGuide.md); user steps are in the [User Guide](../docs/UserGuide.md).
