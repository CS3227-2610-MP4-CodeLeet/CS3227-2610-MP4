## Context

Two-member team, student/instructor roles, MP3 technology direction with fresh implementation. The user explicitly requires browser-only Python and Java execution, superseding the brainstorming PDF's no-execution advice.

## Goals / Non-Goals

Deliver complete role journeys, two AI features, browser practice, simple discussions/XP and auditable engineering evidence. Exclude uploads, badges, live chat, arbitrary program dependencies, multi-course administration, server execution and automatic grade publication.

## Decisions

### Shared application services

Use Next.js/TypeScript and Supabase Auth/PostgreSQL/RLS. Separate authorization/persistence, assignments/submissions, grading/XP, AI context, quotas/cache and usage metadata responsibilities. Select and lock supported dependencies during bootstrap; do not copy MP3 files.

Bootstrap delivered locally on 26 October 2026: Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3, Tailwind 4.3.3, shadcn 4.22.1 configuration, Node 24 and pnpm 12.15.0, with exact dependency pins/lockfile, lint/format/type/build commands, Vitest configuration and one real Chromium production smoke test. No auth/data/AI/runner features were implemented. ESLint 9.39.5 is retained for compatibility with the Next config's React/import/accessibility plugin peers; version 10 produced peer conflicts. Record dependency review and upgrade when the plugin stack supports it. Unit runner currently has no tests and explicitly permits that state.

### Agreed ownership and first student contract

On 26 October 2026 the requester confirmed ownership of student features and Next.js/shared-tooling initialization. Their teammate implements shared authentication, database migrations (including RLS changes), assignment creation and the shared AI gateway. Student work consumes these services and contributes acceptance/security tests; it must not introduce competing auth, migrations or AI infrastructure. Instructor grading ownership still needs confirmation.

| Concept | Agreed fields | Trust boundary |
| --- | --- | --- |
| Assignment | ID, title, instructions, language, publication status | Only published student-visible data is returned; private rubrics remain separate |
| Submission | Assignment ID, student ID, source code, language, revision, timestamp | Bind student ID to the verified session and allocate revisions/timestamps on the server/database |

The requester authorized Codex to decide the following contracts on 26 October 2026. This records an actual requester decision, not a claimed teammate discussion. Send the contract to the migration/auth owner for implementation acknowledgment; reconcile any existing teammate interfaces before integration. Public criteria, if later added, must be explicitly student-visible. No private rubric or unpublished grade belongs in a student response.

#### Student contract v1: identity

The teammate supplies a request-scoped cookie-backed Supabase server client under `src/lib/supabase/server.ts` using `@supabase/ssr`, and a server-only `requireStudent()` helper under `src/lib/auth/require-student.ts`. The helper calls `supabase.auth.getUser()` to obtain a server-confirmed user, reads the current protected role for that user and returns `{ studentId, supabase }` only for role `student`. Missing/invalid sessions give 401; a verified non-student gives 403; an unavailable auth/database dependency gives 503. Never take identity or role from request JSON or mutable user metadata. Do not trust getSession alone or rely only on page/proxy guards.

Use the signed-in client's JWT and publishable key for data operations, preserving RLS; no service-role bypass for student reads/writes. Do not share authenticated clients between requests. Cookie refresh handling is shared auth infrastructure owned by the teammate. Mark authenticated student responses `Cache-Control: private, no-store`, including error responses.

This intentionally chooses getUser's up-to-date Auth lookup at the cost of a network call. Supabase documents cookie clients through [its SSR guide](https://supabase.com/docs/guides/auth/server-side/nextjs) and authentic user retrieval through [getUser](https://supabase.com/docs/reference/javascript/auth-getuser). No SDK implementation has been added here.

#### Student contract v1: public types and operations

Use snake_case JSON fields. IDs are UUID strings. Language values are exactly `python` and `java`. Assignment publication status is `draft` or `published`; student assignment responses contain only `published` records.

- Assignment detail: `{ id, title, instructions, language, publication_status }`. A list item omits instructions.
- Submission detail: `{ id, assignment_id, student_id, source_code, language, revision, submitted_at }`. A history item omits source_code; use the own-revision detail route for source.
- Submission ID is a server-generated UUID; revision is a positive integer allocated per student/assignment; submitted_at is a database-generated UTC ISO 8601 timestamp. Persist exact source without trimming or line-ending normalization.
- These DTOs constrain behavior, not final physical table names. The teammate maps them to migrations and supplies protected student-role/ownership checks.

| Method and route | Input | Success contract |
| --- | --- | --- |
| GET `/api/student/assignments` | Optional page and page_size | 200 `{ data: AssignmentSummary[], pagination: { page, page_size, has_more } }` |
| GET `/api/student/assignments/[assignmentId]` | UUID path | 200 `{ data: AssignmentDetail }`; missing/unpublished uses 404 |
| POST `/api/student/assignments/[assignmentId]/submissions` | Strict JSON `{ source_code, language, request_id }` | 201 `{ data: SubmissionDetail }` for creation; 200 for an identical successful replay |
| GET `/api/student/assignments/[assignmentId]/submissions` | UUID path; optional page/page_size | 200 `{ data: SubmissionSummary[], pagination: { page, page_size, has_more } }`, scoped to the signed-in student |
| GET `/api/student/submissions/[submissionId]` | UUID path | 200 `{ data: SubmissionDetail }`; absent/not-owned uses the same 404 |

All routes call requireStudent independently. Client components use these routes; server-rendered pages call the same server-only student services rather than issuing HTTP calls back into the app. The requester owns student route/service integration; the teammate owns shared auth and the atomic persistence operation/policies. Student pages are `/student/assignments`, `/student/assignments/[assignmentId]` and `/student/submissions/[submissionId]`.

Pagination uses page 1/page_size 20 by default; explicit values must be single positive safe integers, with page_size at most 50. Reject unknown, duplicate or invalid query values with 400. Assignment order is id ascending; own history is revision descending. Fetch one extra row to calculate has_more; no total count is required. New submissions may shift offset pages, so history refresh restarts at page 1. Own history remains readable after assignment unpublication without returning hidden assignment fields. For an unpublished/nonexistent assignment with no own history, return the same 404; a published assignment with no own history returns an empty list.

#### Student contract v1: validation and errors

Validate with strict Zod request schemas and mirrored database invariants where applicable. Source must be a Unicode string, nonblank under a whitespace check, contain no NUL or unpaired surrogate values, and encode to at most **32,768 UTF-8 bytes**. The UI can use TextEncoder to count bytes; the server independently checks and the database enforces the byte bound. A source exactly at the byte limit is allowed if otherwise valid. Python/Java language must match the current assignment. Validation never executes or silently truncates source.

Require application/json on POST and bound the raw request body to 262,144 bytes before parsing, including streamed/chunked bodies. Reject unknown keys such as student_id, revision, submitted_at, scores or run results. UUID request_id is mandatory. POST also requires an Origin matching the configured app origin; reject missing/foreign origins before mutation, with no permissive cross-origin credential policy.

All API errors use `{ error: { code, message, field_errors } }`, where message is safe plain text and field_errors is a map of known field names to string arrays (empty when not field-specific). Do not echo source, keys, raw database/provider errors or private grading data.

| Status | Stable codes | Use |
| --- | --- | --- |
| 400 | INVALID_JSON, INVALID_ID, INVALID_QUERY | Malformed JSON, path UUID or pagination |
| 401 | UNAUTHENTICATED | Missing/invalid verified session |
| 403 | FORBIDDEN, INVALID_ORIGIN | Non-student identity or rejected POST origin |
| 404 | NOT_FOUND | Missing/nonvisible assignment or absent/not-owned revision |
| 409 | IDEMPOTENCY_CONFLICT, SUBMISSION_CONFLICT | Request ID reused for different content or bounded transaction contention failure |
| 413 | SOURCE_TOO_LARGE, REQUEST_TOO_LARGE | Decoded source or raw body bound exceeded |
| 415 | UNSUPPORTED_MEDIA_TYPE | POST is not application/json |
| 422 | VALIDATION_ERROR | Unknown/missing fields, blank/invalid source, invalid body UUID/language or language mismatch |
| 503 | SERVICE_UNAVAILABLE | Auth/data dependency unavailable; no write success claimed |
| 500 | INTERNAL_ERROR | Sanitized unexpected failure |

#### Student contract v1: revisions and retries

Each intentional submission creates one request_id using crypto.randomUUID. Retain that ID and exact source/language for retries until the result is known; a new deliberate submission gets a new ID. Disable duplicate clicks while pending, but enforce idempotency on the server/database too.

The teammate's transaction scopes idempotency by student_id + assignment_id + request_id. An identical committed replay returns the original revision without an additional write; changed source/language with the same ID returns 409. Verify current identity and ownership before replay. A replay may return the existing own revision after unpublication but must not create new source; a fresh write requires the assignment still be published at its transaction's serialization point.

Serialize revision allocation per student/assignment, enforce uniqueness on that tuple plus revision, and commit the retry mapping with the immutable source row. Coordinate assignment publication/language changes with the same transactional visibility check so stale client state cannot authorize a new write. Concurrent distinct requests get distinct revisions; concurrent identical retries get one stored revision. No raw max(revision)+1 calculation without locking or equivalent atomic protection. If a response is lost, retry with the original request_id. Do not add unbounded automatic retries.

### Issue #5 student implementation plan

Tracking: [issue #5](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/5), branch `feature/5-student-submissions`, PR base `develop`. This section refines the student portions of tasks 3.1, 3.3 and 3.5; task group 7 is its implementation checklist.

**Deliverable:** a student can open a published assignment, enter source, submit it and read their own immutable revisions. Browser execution and AI are separate milestones, so this flow must not depend on either being available. Seeded assignments allow work before the instructor creation UI is complete.

#### Dependency gates

| Dependency | Owner/status at planning time | Required handoff |
| --- | --- | --- |
| Shared app bootstrap, package versions and integration layout | Requester-owned; initialized and locally checked on 26 October 2026 | See package.json, lockfile, src/app, @/* alias and Developer Guide for commands/layout |
| Verified student identity/session | Teammate-owned; not delivered here | Server session lookup, student role handling and unauthenticated error behavior |
| Assignment/submission schema, policies and revision allocation | Teammate-owned; not delivered here | Concrete field/types, scoped reads/writes, immutable revision keys and local migration/test instructions |
| Shared assignment creation | Teammate-owned; UI may arrive later | Synthetic published/draft fixtures matching the agreed schema; no production data |
| AI gateway | Teammate-owned; later milestone | Not required by issue #5; do not implement a replacement |

These are pending delivery dependencies, not evidence that teammate work is blocked or incomplete on another branch. The contract above is requester-authorized; confirm teammate implementation compatibility at the handoff before integration.

#### Contract handoff before persistence work

The student contract v1 sections above select paths, transport, DTOs, limits and retry semantics. Use those shared interfaces rather than inventing a parallel API. The table below summarizes their purpose.

| Operation | Student input | Authorized result |
| --- | --- | --- |
| List published assignments | page/page_size | Public assignment summaries, with empty/loading/error states |
| Read assignment | Assignment ID | Published public details or a safe unavailable response |
| Create submission revision | Assignment ID, source_code, language, request_id | Stored own revision and authoritative metadata |
| Read own revision history | Assignment ID and page/page_size | Only the session student's stored revisions |

At the handoff, verify the teammate's actual schema/session helpers implement student contract v1, record any necessary reconciliation and obtain the local migration/test instructions. Validate both server routes and direct RLS/database paths; route-only guards are insufficient. The migration owner supplies persistent invariants and the atomic submission operation. This plan specifies required behavior without implementing teammate-owned migrations.

#### Implementation sequence

1. Record the shared app/session/persistence handoff and file ownership. Bring missing policy/migration changes to the teammate. Budget this milestone as one bounded task per checklist item, with targeted checks per step; revise estimates from actual work rather than inventing usage metrics.
2. Create synthetic published Python/Java assignments, a draft assignment and two student identities from the agreed contract. A temporary fixture adapter can support UI/unit work, but must stay test/development-only and cannot bypass production authorization.
3. Implement published assignment list/detail and loading, empty, unavailable and error states. Consume shared sign-in/session handling rather than building a student-specific authentication system.
4. Implement source entry with the assignment language, agreed input validation, pending/success/failure feedback and safe text rendering. Preserve entered code on failure; never execute it as part of submission or render it as active markup.
5. Integrate the shared authenticated submission operation and own revision history. Show only a server-confirmed success, allocate immutable revisions through the agreed persistence contract, and handle retry/concurrent requests as specified.
6. Verify real local auth/RLS and both supported source languages. Student A submits and reads their source; Student B cannot read or mutate it through routes or direct database access. Verify public/private assignment boundaries, hidden grading data, forged identity/revision fields, invalid source/language, resubmission and concurrent writes.
7. Record independent review if performed, actual checks/limitations, and a session summary. Update the user guide only for verified functionality; open a feature PR to `develop` referencing issue #5 when ready.

**Completion gate:** the complete journey passes against shared auth/schema, including direct access-control tests. Fixture-only UI results do not close issue #5. Missing shared services may permit partial UI work but remain explicit integration blockers. No application implementation or specialist review has occurred in this planning update.

### Browser runner feasibility first

Evaluate runtimes with `workflow/templates/RuntimeEvaluation.md`. Pyodide is a Python candidate, not a selected dependency. Java candidates must compile source in-browser as well as run classes; remote compilation is prohibited. Record licenses and distribution size before adoption.

Design a credential-free execution origin separated from the authenticated app origin, restrictive frame/worker boundaries, CSP/network policy and a minimal validated message bridge. Verify message source/origin and per-run identity. An opaque frame may require wildcard delivery; if used, verify the source window and per-run channel token and document the design. Workers help responsiveness but do not themselves isolate network, storage or credentials. Never provide application tokens, private data or arbitrary RPC access to the runner.

Support buffered stdin, stdout/stderr, compile/runtime errors, stop, bounded output and execution deadlines. Use one source file and Java public Main entry class, without dependencies. Measure browser support, startup cost, cancellation and rerun behavior. Browser memory/process enforcement differs from OS sandboxes: document actual guarantees and reject unsuitable candidates. Allow controlled runtime asset loading without granting student programs arbitrary network access. Do not claim offline operation before testing it.

Browser results are practice feedback; the server does not use client-reported success to determine grades or XP.

### Access and revision contracts

Public sign-up grants student only. Trusted administration provisions instructors. Store private rubrics/draft grades separately from student-visible records; RLS alone does not hide individual columns in a readable row. Instructors access owned assignments; students access own revisions.

Freeze submitted code revisions and reference exact assignment/rubric/code versions in feedback and grades. Preserve previously evaluated revisions on resubmission. Reject stale grade publication with an expected-version check.

Agree entities and contracts before migrations: profiles, assignments, private rubrics, submission revisions, grades, threads/replies, XP awards, AI cache, quota reservations and usage metadata. Specify keys, constraints, RLS and race behavior.

### Role-specific AI gateway

Server retrieves authorized data by submission ID. Student prompts receive public instructions/criteria and the student's chosen code revision; private rubrics never enter student context. Instructor prompts may receive the owned assignment's rubric. Neither needs other students' code. Models have no tools or publication authority.

Validate inputs, estimate token budgets, reject oversized code without silent truncation, reserve quotas atomically and call SoCLaaS with bounded output/timeouts. Verify actual key-specific requests-per-minute limits; do not inherit MP3 observed limits. Any retries/backoff must fit a defined request budget and respect valid provider retry guidance. Fail without leaking raw provider bodies or exhausting quotas silently.

Validate JSON/score ranges and render text safely. Cache scope includes actor/authorized resource, role/task, code/assignment/rubric revisions, prompt/schema version and model configuration. Recheck authorization on every cache hit. Record exposed token counts, latency, cache status, reservation outcome and sanitized errors; do not log raw prompts, code, results or keys in usage metadata.

### Grades, XP and community

Instructor approves AI suggestions before publishing. Commit grade publication and XP adjustment atomically. Unique award keys prevent duplicates; corrections apply a defined delta rather than a new full award. Choose an XP formula before implementation. Do not award XP for practice runs or forum spam.

Leaderboard exposes display names/XP with documented deterministic ties, not emails. Seed synthetic students for testing. Forum is plain text threads/replies with access checks, length/rate limits and safe rendering, without attachments or live chat.

### Evidence and deployment

Record actual specialist triggers, bounded context, owned files, handoffs and independent reviews. Generated roles/skills do not establish executed coordination. Compare safe context strategies using real usage and quality evidence.

Use separate development/production Supabase projects and Vercel environments, release from master, reviewed migrations and synthetic test fixtures. Publish the product site with GitHub Pages. Scaffold CI does not establish application security or deployment. No deployment exists yet.

## Risks / Trade-offs

- Browser Java compilation and licensing may constrain package choice: prove source compilation first.
- Runtime JS bridges can expose network/app data: isolate and test before running untrusted source.
- Large runtimes affect cold starts: lazy load and measure.
- Provider availability/limits vary: verify before enabling AI and implement safe failure.
- Community scope competes with evidence collection: prioritize core role journeys and security.

## Migration Plan

No existing application data. Bootstrap tooling, prove runtimes, implement reviewed schema/RLS, deliver tested vertical slices, then stage/deploy. Record recovery steps before production migrations. Archive specs only when implementation and evidence match.

## Open Questions

- Personal names and remaining shared/instructor task allocation; confirmed requester-owned bootstrap and student/shared-service division are recorded above.
- Runtime versions/licenses, supported browsers, isolation headers and tested limits.
- SoCLaaS endpoint/model/key limits.
- XP formula, grade correction, deadlines and resubmission rules.
- Product name and deployment URLs.
