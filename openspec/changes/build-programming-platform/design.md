## Issue #80: trusted XP leaderboard planning

Requester authorized leaderboard work after the XP feature. The [proposed design](../../../workflow/plans/2026-11-02-leaderboard-design.md) recommends live totals from trusted awards, shared ranks for equal XP, stable private tie ordering, positive-XP membership and a narrowly projected signed-in username/XP page with own position. Requester explicitly approved shared ranks and the concrete design on 2 November 2026; the implementation plan is workflow/plans/2026-11-02-leaderboard.md. [Summary](../../../logs/2026-11-02-leaderboard.md); branch `feat/leaderboard` from develop `00ae158`. XP PR #79 subsequently merged into develop a42179d and was brought into this branch, preserving both planning sections. Leaderboard implementation and verification are in progress.

## Issue #77: instructor-configured XP

Requester approved the [concrete XP design](../../../workflow/plans/2026-11-02-assignment-xp-design.md) on 2 November 2026. [Implementation plan](../../../workflow/plans/2026-11-02-assignment-xp.md), issue #77 and [summary](../../../logs/2026-11-02-assignment-xp.md) track required 0–100,000 integer assignment maximums, floor(score / captured rubric maximum × assignment XP), best currently published revision, transactional corrections/unpublication/recalculation, private score basis and own-only paged totals. Existing assignments start at zero; older grades require review/republishing. Preserve accepted fractional score precision, serialize on the assignment row before grading/configuration, deny client awards, and record only actual amount deltas. Leaderboard and hosted acceptance remain separate.

## Issue #74: instructor-authored public practice cases

The requester approved implementing the accepted stdin/stdout handoff and the concrete design on 2 November 2026. Dedicated owner-only Practice tests page; separate private drafts/public snapshots; atomic version-checked publish/unpublish; students load only published cases for published assignments and use the existing browser-only runner. Case bounds/comparison and non-grading behavior stay unchanged; names count Unicode code points consistently. Single embedded queries provide coherent visibility/version snapshots, and a captured full-case signature invalidates refreshed verdicts. See the [approved design](../../../workflow/plans/2026-11-02-published-practice-tests-design.md), [session summary](../../../logs/2026-11-02-published-practice-tests.md) and [independent review record](../../../workflow/evidence/2026-11-02-practice-test-review.md). Independent findings are resolved within their scope; teammate/human review and hosted migration/acceptance remain separate gates.

## Issue #70: User Guide and security/reflection evidence audit

Audit merged develop `0a26127` against current routes, control labels, tests and dated experiment records. Replace obsolete preview-only user instructions with normal role journeys; keep developer setup in its guide and threat/test reproduction in a dated workflow evidence report. Link assertions to source tests and distinguish historical/local, mocked, live synthetic and hosted evidence. Append generated reflection observations without inventing personal experiences, agent runs or unavailable token/cost/cache measurements. No product behavior, schema, dependency manifest or deployment changes. See the [plan](../../../workflow/plans/2026-11-02-user-guide-security-evidence.md) and [session summary](../../../logs/2026-11-02-user-guide-security-evidence.md). Broad release gates remain pending.

Follow-up: the requester supplied MP3's reflection layout only as a structural example. Use a short `docs/Reflections.md` index with `PaulReflections.md` and `JohnReflections.md`, tailored to MP4's Multi-Agent SE, Context Engineering, Resource-aware Use, security and SDD evidence. Preserve shared observations separately; keep individual contribution attribution and personal verification pending. Reuse no MP3 implementation/workflow prose or experimental outcomes.

PR #71 merged before the individual-file update. Track the reflection-only follow-up in issue #72 using the [dedicated plan](../../../workflow/plans/2026-11-02-individual-mp4-reflections.md) and [summary](../../../logs/2026-11-02-individual-mp4-reflections.md) on `docs/individual-mp4-reflections` from updated develop.

## Issue #59: optional assignment deadlines

Requester chose accepting late submissions with a Late marker and no automatic grade penalty. Add optional finite assignments.due_at plus database-owned submissions.due_at_submission/is_late. Preserve old records with null/false, stamp new creation defaults with clock_timestamp(), capture the deadline under an assignment share lock on insert and compare strictly greater-than. Existing submit_code retries return the original captured record. Add an 8-argument save_assignment overload reusing the 7-argument ownership/version/language path; old signatures preserve dates, explicit null clears them. Keep RLS/read grants and source/grade boundaries. Use fixed SGT datetime input conversion and ISO instants in the API; server reads expose current dates/latest-own status without source or N+1 queries, and revision/instructor views show historical timing. Status refreshes on load/save, no polling. See [plan](../../../workflow/plans/2026-11-01-assignment-deadlines.md) and [summary](../../../logs/2026-11-01-assignment-deadlines.md). Teammate review remains pending.

## Issue #56: compare owned saved revisions

Use a server-rendered unified line diff anchored at an owned revision, with URL-backed From/To revision numbers and no source URL or browser persistence. Authenticate first, validate numeric inputs/UUID, load projected own anchor/latest metadata, then at most two selected sources with explicit student/assignment/language filters and existing RLS. Hidden assignment titles retain the neutral history label. Reuse the existing 8,000-character/NUL source contract. Preserve saved source, grades, AI and execution boundaries. Default predecessor/current or first/latest; same sources and single revisions have helpful states. Number both sides, render code as escaped text and mark changes with labels/colour. Normalize line endings for comparison only, preserve whitespace/final blank lines and trim common edges. Limit LCS middle storage/work to 250,000 cells, falling back to conservative removed/added middle blocks; diffs need not be globally minimal. See [plan](../../../workflow/plans/2026-11-01-compare-revisions.md) and [summary](../../../logs/2026-11-01-compare-revisions.md). Include the previously verified runtime retry prerequisite from still-open PR #55, not its forum feature. Wait for final-head PR CI before handoff, per the requester.

## Issue #46: Java compatibility diagnostics

Keep raw browser results and submitted source unchanged. A shared result-presentation helper recognizes anchored TeaVM unsupported-target and missing-annotation diagnostics only for compile-error status and shows a concise unsupported-feature message in custom/practice outputs. Preserve ordinary compiler/location text and literal stderr for successful/runtime-failing programs. The pinned diagnostic API exposes no placeholder arguments, so no source heuristic or unresolved class name can justify a Thread-specific explanation. Runtime worker, binary/provenance inventory, output limits, grade/XP behavior and execution isolation stay unchanged. Document confirmed Thread.start (including join examples) and Thread.sleep limitations separately from sequential Runnable/Thread.run support. See [plan](../../../workflow/plans/2026-11-01-java-runner-diagnostics.md) and [summary](../../../logs/2026-11-01-java-runner-diagnostics.md).

## Issue #44: student list search and filters

Share bounded URL parsing and concise filter controls between Assignments and My submissions. Use Next.js Form string actions for GET/client navigation, with title/language keyed inputs and an explicit Apply filters button. Clear links target the unfiltered list; applying/clearing resets page one. Next/Previous retain URL-encoded applied filters. Native GET forms were initially evaluated but browser history restored edited controls inconsistent with the applied URL, so the implementation uses the framework's navigation-aware form.

Search is case-insensitive literal substring, trimmed and bounded to 160 characters; regex syntax is escaped for PostgREST imatch so LIKE wildcard aliases are not interpreted. Reject duplicate query values, control characters and unsupported languages. Assignment results retain publication/RLS constraints. History retains verified student identity, safe projection and stable 25-row pagination, applying language/title constraints before range. Search uses a visible-title inner join; without title search, retain the outer join and neutral metadata for own unpublished-assignment revisions. No schema/dependency/AI/runtime changes. See [plan](../../../workflow/plans/2026-11-01-student-list-filters.md) and [summary](../../../logs/2026-11-01-student-list-filters.md).

## Issue #40: unsaved assignment code

The real student SubmissionForm compares current source to its last successfully submitted snapshot, initially empty. Exact equality clears dirty state; execution does not. A pending save captures source/request ID, and success acknowledges that snapshot only, leaving newer edits dirty. Failed saves preserve draft and retry ID; changed source gets a fresh ID. Source stays in component memory without local/session storage or autosave. The assignment key isolates forms across assignments.

While dirty, a focused browser guard captures ordinary same-tab app links, asks before sign-out mutates Auth, requests native unload confirmation and checks cancelable same-document history traversal. It excludes hash-only links, downloads and new-tab gestures and removes listeners when clean/unmounted. Browser dialog suppression, unsupported/noncancelable history and forced mobile process termination remain documented limits. No history sentinels, Next internals, persistence, AI, grading or runtime boundary changes. See [plan](../../../workflow/plans/2026-11-01-unsaved-code-guard.md) and [summary](../../../logs/2026-11-01-unsaved-code-guard.md).

## Issue #27: local development seed data

Keep `supabase/seed.sql` as the deterministic fixture source, but disable Supabase CLI automatic seed loading in `supabase/config.toml`; linked resets must never load local fixtures. Explicit local pnpm commands reset with `--local --no-seed`, print a destructive-data warning, then apply the seed file through `db query --local`. Set Auth `instance_id` to the zero UUID and initialize GoTrue token/string fields so seeded users can request and complete local password recovery. Create 12 synthetic student Auth users and 3 synthetic instructor Auth users, then set instructor roles only from the trusted seed. Add 12 Python/Java assignments across the instructors (10 published, 2 draft), matching rubrics, 24 synthetic submissions, and one published or unpublished grade per student to cover both visibility states. Do not seed AI outputs, community, or XP tables that are not in the current schema.

Expose `pnpm db:seed` as an explicit local-only rebuild and seed command; it deletes the local database. Keep `pnpm db:reset` rebuilding local fixtures as before. Document seeded account email patterns and the local Mailpit password-reset path without committing passwords. Include a contributor reminder to update fixtures when schema changes affect seed requirements. No new table, migration, dependency, hosted operation, or change to application authorization is needed.

**Acceptance:** explicit local reset/seed reaches the required record counts; all assignment relationships and rubric/grade data satisfy the schema; repeated supported seed workflows produce one copy of the deterministic fixture set; seeded accounts complete local password recovery; reset commands warn before deleting data; `pnpm db:seed` is explicitly local; a linked reset cannot automatically load local fixtures.

## Context

Issue #17 extends real assignment/submission workflows to Python and Java; see `workflow/plans/2026-10-29-java-assignments.md`. Store assignment language on each immutable revision using a DB-derived value and prohibit assignment language changes after submissions. Preserve 8,000-character source, identity/revision/idempotency, private grading and browser-only execution rules. New instructor payloads carry language while omitted language remains Python for compatibility. The forward migration preserves local records; the existing six-argument save RPC stays available and a validated seven-argument overload adds language. UI and AI context use validated stored language rather than Python constants. This branch depends on unmerged PR #16 until integration catches up.

Issue #15 / PR #16 password recovery: see `workflow/plans/2026-10-29-password-recovery.md`. Request email via existing Supabase PKCE with a fixed same-origin recovery destination and a generic acknowledgement. The callback verifies exchanged identity and allowlists only `/reset-password`; reset page access uses server `getUser`. Confirmation/eye controls update only the authenticated user's password. Attempt Auth sign-out after success and report update/sign-out failures distinctly. Invalid/replayed links request another email. Preserve provider quotas and existing role/RLS contracts; hosted SMTP/environment URL setup remains a release gate.

Issue #15 / PR #16 indentation follow-up: shared native input handles four-space Tab/Shift+Tab, Python/Java Enter indentation, matching delimiters and Java closing-brace dedent. Pure edit calculations use a small unfinished-buffer string/comment mask, separate from DOM application and undo. Escape then Tab releases focus. Composition/modifier shortcuts and source-size/persistence/runtime rules remain unchanged. See `workflow/plans/2026-10-29-editor-indentation.md`; this is not full VS Code language-service parity.

Issue #15 / PR #16 Run copy refinement: remove the Run details disclosure and redundant normal-completion message at the requester's direction. Show output and test verdicts directly, retaining progress and actionable failures. Runtime policies and comparison behavior remain documented and enforced; this is presentation-only.

Issue #15 / PR #16 branding correction: the product name is CodeLeet. Registration labels the existing display-name profile value as Username and maps it to unchanged `display_name` storage. This is a presentation correction, without a unique-handle contract or username-based sign-in. Internal module paths and historical change/log names remain evidence identifiers.

Issue #15 / PR #16 editor follow-up uses a shared native textarea, aria-hidden syntax layer rendered as safe React token text, and synchronized line gutter for real Python submissions and Python/Java practice. See `workflow/plans/2026-10-29-code-editor.md`. Pin existing website-resolved Prism packages as direct app dependencies. Theme changes do not change source or selection; validation, submission and browser runtime data flow remain unchanged. Highlighting falls back to plain text beyond 32,768 characters, and the gutter is capped at 32,769 labels (covering every valid practice line); oversized input remains editable for correction. Forced-colors mode shows native text without the token overlay.

Issue #15 account/workspace refinement: see `workflow/plans/2026-10-29-account-workspace-controls.md`. Account and authenticated assignment pages share theme state. Signup requires matching confirmation with independent visibility controls; sign-out reports failure without falsely redirecting. Authenticated workspace navigation omits redundant Home and fixture notices. The existing browser runner can be used by the authenticated Python editor only in opt-in development, retaining all current isolation/deadline limits; hosted runtime selection remains unapproved. This change does not alter Python-only/8,000-character MVP persistence or add teacher test persistence.

Two-member team, student/instructor roles, MP3 technology direction with fresh implementation. The user explicitly requires browser-only Python and Java execution, superseding the brainstorming PDF's no-execution advice.

On 28 October 2026, the requester clarified that the work split is indicative of primary responsibility only; either member may implement any task. Coordinate shared contracts and service changes, and record the actual implementer/reviewer. No implementation is prohibited solely because it was initially assigned to the other member.

## Goals / Non-Goals

Deliver complete role journeys across multiple course workspaces, two AI features, browser practice, simple discussions/XP and auditable engineering evidence. Exclude uploads, badges, live chat, arbitrary program dependencies, server execution and automatic grade publication.

## Decisions

### Shared application services

Use Next.js/TypeScript and Supabase Auth/PostgreSQL/RLS. Separate authorization/persistence, assignments/submissions, grading/XP, AI context, quotas/cache and usage metadata responsibilities. Select and lock supported dependencies during bootstrap; do not copy MP3 files.

Bootstrap delivered locally on 26 October 2026: Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3, Tailwind 4.3.3, shadcn 4.22.1 configuration, Node 24 and pnpm 12.15.0, with exact dependency pins/lockfile, lint/format/type/build commands, Vitest configuration and one real Chromium production smoke test. No auth/data/AI/runner features were implemented. ESLint 9.39.5 is retained for compatibility with the Next config's React/import/accessibility plugin peers; version 10 produced peer conflicts. Record dependency review and upgrade when the plugin stack supports it. Unit runner currently has no tests and explicitly permits that state.

#### ESLint maintainability thresholds

Add only the requested core ESLint and SonarJS rules; do not enable SonarJS's full recommended preset. Use cyclomatic complexity 10, cognitive complexity 15, max file lines 500 (warning severity, enforced by the existing `--max-warnings=0` command), max function lines 75 (ignoring blank/comment-only lines), block depth 3, parameters 4, statements 20 and duplicate-string threshold 3. Keep SonarJS 4.2.2 as an exact development-only dependency (LGPL-3.0-only; not bundled into the app). These are repository guardrails, not a claim that any one threshold is a universal industry standard. The initial lint run found 56 violations in 18 files; refactor those sites to meet the limits while preserving behavior, then verify lint and the existing tests.

#### Developer runtime and package manager

Use Node.js 24.22.1, the latest Node 24 LTS patch available on 28 October 2026, as the exact repository pin in `.node-version`. CI reads that file; `package.json` keeps the compatible `>=24 <25` engine range. Update the pin deliberately as new supported Node 24 patches are released and rerun applicable checks. Use pnpm directly. Corepack command wrappers are unnecessary because contributors install the exact pnpm version directly and CI's pnpm action reads the exact `packageManager` field. Keep `packageManager: pnpm@12.15.0` as the version source; remove Corepack invocations from scripts and documentation.

#### Issue-driven implementation and session summaries

For each material change, link a scope-matched open GitHub issue or create one before implementation. Link that issue to the active OpenSpec artifacts. Use relevant repository-local Superpowers skills for planning, TDD, debugging, verification, review and closeout, while respecting explicit authorization for delegation. Create focused incremental Conventional Commits on the corresponding branch. Maintain a dated, sanitized interaction summary in `logs/` throughout work and finalize it before pushing/opening a PR. Summarize each prompt and interaction chronologically, capturing requests/steering, decisions, actual participants/handoffs, files, checks and limitations; do not store full transcripts, secrets, credentials, real student data or sensitive prompt contents. Keep human verification pending until a teammate has checked the summary. Push and create/update a PR only after implementation, checks and summary are complete; do not imply a merge, deployment or release.

### Agreed ownership and first student contract

On 26 October 2026 the requester identified primary responsibility for student features and Next.js/shared-tooling initialization, while the teammate's primary responsibility was shared authentication, database migrations (including RLS changes), assignment creation and the shared AI gateway. The 28 October clarification makes those responsibilities non-exclusive. Coordinate common contracts, migrations and service boundaries; do not build competing implementations.

| Concept | Agreed fields | Trust boundary |
| --- | --- | --- |
| Assignment | ID, title, instructions, language, publication status | Only published student-visible data is returned; private rubrics remain separate |
| Submission | Assignment ID, student ID, source code, language, revision, timestamp | Bind student ID to the verified session and allocate revisions/timestamps on the server/database |

The requester authorized Codex to decide the following contracts on 26 October 2026. This records an actual requester decision. Reconcile the contracts with any existing shared interfaces before integration and record compatibility changes. Public criteria, if later added, must be explicitly student-visible. No private rubric or unpublished grade belongs in a student response.

#### Student contract v1: identity

The shared foundation supplies a request-scoped cookie-backed Supabase server client under `src/lib/supabase/server.ts` using `@supabase/ssr`, and a server-only `requireStudent()` helper under `src/lib/auth/require-student.ts`. The helper calls `supabase.auth.getUser()` to obtain a server-confirmed user, reads the current protected role for that user and returns `{ studentId, supabase }` only for role `student`. Missing/invalid sessions give 401; a verified non-student gives 403; an unavailable auth/database dependency gives 503. Never take identity or role from request JSON or mutable user metadata. Do not trust getSession alone or rely only on page/proxy guards.

Use the signed-in client's JWT and publishable key for data operations, preserving RLS; no service-role bypass for student reads/writes. Do not share authenticated clients between requests. Cookie refresh handling belongs in the shared auth foundation. Mark authenticated student responses `Cache-Control: private, no-store`, including error responses.

This intentionally chooses getUser's up-to-date Auth lookup at the cost of a network call. Supabase documents cookie clients through [its SSR guide](https://supabase.com/docs/guides/auth/server-side/nextjs) and authentic user retrieval through [getUser](https://supabase.com/docs/reference/javascript/auth-getuser). No SDK implementation has been added here.

#### Student contract v1: public types and operations

Use snake_case JSON fields. IDs are UUID strings. Language values are exactly `python` and `java`. Assignment publication status is `draft` or `published`; student assignment responses contain only `published` records.

- Assignment detail: `{ id, title, instructions, language, publication_status }`. A list item omits instructions.
- Submission detail: `{ id, assignment_id, student_id, source_code, language, revision, submitted_at }`. A history item omits source_code; use the own-revision detail route for source.
- Submission ID is a server-generated UUID; revision is a positive integer allocated per student/assignment; submitted_at is a database-generated UTC ISO 8601 timestamp. Persist exact source without trimming or line-ending normalization.
- These DTOs constrain behavior, not final physical table names. The shared schema must provide protected student-role/ownership checks.

| Method and route | Input | Success contract |
| --- | --- | --- |
| GET `/api/student/assignments` | Optional page and page_size | 200 `{ data: AssignmentSummary[], pagination: { page, page_size, has_more } }` |
| GET `/api/student/assignments/[assignmentId]` | UUID path | 200 `{ data: AssignmentDetail }`; missing/unpublished uses 404 |
| POST `/api/student/assignments/[assignmentId]/submissions` | Strict JSON `{ source_code, language, request_id }` | 201 `{ data: SubmissionDetail }` for creation; 200 for an identical successful replay |
| GET `/api/student/assignments/[assignmentId]/submissions` | UUID path; optional page/page_size | 200 `{ data: SubmissionSummary[], pagination: { page, page_size, has_more } }`, scoped to the signed-in student |
| GET `/api/student/submissions/[submissionId]` | UUID path | 200 `{ data: SubmissionDetail }`; absent/not-owned uses the same 404 |

All routes call requireStudent independently. Client components use these routes; server-rendered pages call the same server-only student services rather than issuing HTTP calls back into the app. Student routes, shared auth and atomic persistence must use one agreed contract. Student pages are `/student/assignments`, `/student/assignments/[assignmentId]` and `/student/submissions/[submissionId]`.

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

The persistence transaction scopes idempotency by student_id + assignment_id + request_id. An identical committed replay returns the original revision without an additional write; changed source/language with the same ID returns 409. Verify current identity and ownership before replay. A replay may return the existing own revision after unpublication but must not create new source; a fresh write requires the assignment still be published at its transaction's serialization point.

Serialize revision allocation per student/assignment, enforce uniqueness on that tuple plus revision, and commit the retry mapping with the immutable source row. Coordinate assignment publication/language changes with the same transactional visibility check so stale client state cannot authorize a new write. Concurrent distinct requests get distinct revisions; concurrent identical retries get one stored revision. No raw max(revision)+1 calculation without locking or equivalent atomic protection. If a response is lost, retry with the original request_id. Do not add unbounded automatic retries.

### Issue #5 student implementation plan

Tracking: [issue #5](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/5), branch `feature/5-student-submissions`, PR base `develop`. This section refines the student portions of tasks 3.1, 3.3 and 3.5; task group 7 is its implementation checklist.

**Deliverable:** a student can open a published assignment, enter source, submit it and read their own immutable revisions. Browser execution and AI are separate milestones, so this flow must not depend on either being available. Seeded assignments allow work before the instructor creation UI is complete.

#### Dependency gates

| Dependency | Owner/status at planning time | Required handoff |
| --- | --- | --- |
| Shared app bootstrap, package versions and integration layout | Initialized and locally checked on 26 October 2026 | See package.json, lockfile, src/app, @/* alias and Developer Guide for commands/layout |
| Verified student identity/session | Shared foundation; not delivered at planning time | Server session lookup, student role handling and unauthenticated error behavior |
| Assignment/submission schema, policies and revision allocation | Shared foundation; not delivered at planning time | Concrete field/types, scoped reads/writes, immutable revision keys and local migration/test instructions |
| Shared assignment creation | Shared feature; UI may arrive later | Synthetic published/draft fixtures matching the agreed schema; no production data |
| AI gateway | Shared feature; later milestone | Not required by issue #5; avoid competing implementations |

These were pending delivery dependencies at planning time. The contract above is requester-authorized; verify shared implementation compatibility before integration.

#### Contract handoff before persistence work

The student contract v1 sections above select paths, transport, DTOs, limits and retry semantics. Use those shared interfaces rather than inventing a parallel API. The table below summarizes their purpose.

| Operation | Student input | Authorized result |
| --- | --- | --- |
| List published assignments | page/page_size | Public assignment summaries, with empty/loading/error states |
| Read assignment | Assignment ID | Published public details or a safe unavailable response |
| Create submission revision | Assignment ID, source_code, language, request_id | Stored own revision and authoritative metadata |
| Read own revision history | Assignment ID and page/page_size | Only the session student's stored revisions |

Before persistence integration, verify the actual shared schema/session helpers implement student contract v1, record any necessary reconciliation and retain local migration/test instructions. Validate both server routes and direct RLS/database paths; route-only guards are insufficient. The shared schema must supply persistent invariants and an atomic submission operation.

#### Implementation sequence

1. Record the shared app/session/persistence interfaces and implementation handoffs. Coordinate policy/migration changes across affected contributors. Budget this milestone as one bounded task per checklist item, with targeted checks per step; revise estimates from actual work rather than inventing usage metrics.
2. Create synthetic published Python/Java assignments, a draft assignment and two student identities from the agreed contract. A temporary fixture adapter can support UI/unit work, but must stay test/development-only and cannot bypass production authorization.
3. Implement published assignment list/detail and loading, empty, unavailable and error states. Consume shared sign-in/session handling rather than building a student-specific authentication system.
4. Implement source entry with the assignment language, agreed input validation, pending/success/failure feedback and safe text rendering. Preserve entered code on failure; never execute it as part of submission or render it as active markup.
5. Integrate the shared authenticated submission operation and own revision history. Show only a server-confirmed success, allocate immutable revisions through the agreed persistence contract, and handle retry/concurrent requests as specified.
6. Verify real local auth/RLS and both supported source languages. Student A submits and reads their source; Student B cannot read or mutate it through routes or direct database access. Verify public/private assignment boundaries, hidden grading data, forged identity/revision fields, invalid source/language, resubmission and concurrent writes.
7. Record independent review if performed, actual checks/limitations, and a session summary. Update the user guide only for verified functionality; open a feature PR to `develop` referencing issue #5 when ready.

**Completion gate:** the complete journey passes against shared auth/schema, including direct access-control tests. Fixture-only UI results do not close issue #5. Missing shared services may permit partial UI work but remain explicit integration blockers. No application implementation or specialist review has occurred in this planning update.

#### Development-only assignment preview

Continue UI work independently on feature/5-student-assignment-preview, branched from the bootstrap commit d8dd1c6 while PR #6 is reviewed. Compose reusable list/detail views from explicit public DTO projections and a separate server-only synthetic adapter. Do not implement replacement authentication, public fixture APIs or a production fixture fallback.

The temporary student assignment pages require both NODE_ENV=development and STUDENT_PREVIEW_ENABLED=true; otherwise they call notFound before reading preview scenarios/data. Check this at the layout and data-adapter entry points. Production must deny the pages even with the flag set. Real authenticated reads will replace this temporary adapter only after shared services and access-control tests are ready.

Synthetic fixtures cover published Python/Java assignments and a draft. Display only explicit public fields; render instructions as plain text. Local list query scenarios preview=empty, preview=error and preview=slow exercise empty/error/loading views; these are preview controls, not production API query contracts. Navigation and unavailable states are tested in Chromium, including a narrow mobile viewport. This work does not close tasks 7.2/7.3, which still require shared-schema fixtures and authenticated integration.

### Development-only source entry

Continue issue #5 on feature/5-student-code-entry from develop after preview PR #7 merged. Add a client-side code-entry section to the existing guarded synthetic assignment detail pages. Keep instructions server-rendered; pass only the assignment language to the interactive component and key it by assignment ID so another assignment cannot receive the same editor state.

Use a labeled plain textarea, fixed Python/Java language, a live UTF-8 byte counter and a local Check code action. Mirror the contract's nonblank, valid-Unicode/no-NUL, 32,768-byte input rules in a reusable pure validator, preserving exact editor contents through checks. Include exact-limit and multibyte tests. Oversized input is retained with an error, not truncated. Plain input text is never interpreted as HTML or executed.

This preview intentionally has no native form submission, network call, request ID, persistence or server action. Submit code is disabled and explanatory copy says submission is not connected. Valid local checks must say nothing was saved/submitted/run. Validation errors focus the editor and use associated accessible messages. The production guard remains unchanged. Shared server/database validation is still required at integration; this local UI cannot complete task 7.4's real submission states or close issue #5. No auth/gateway/migrations or browser runner are implemented.

### Browser runner feasibility first

The 27 October coordinated local experiment is recorded in [runtime feasibility evidence](../../../workflow/evidence/runtime-feasibility/README.md). Pyodide 314.0.7 passed Python stdin/output/error and independent Chromium boundary tests. The initial hash-pinned TeaVM-javac snapshot lacked Scanner and usable System.in. The [follow-up input adapter](../../../workflow/evidence/runtime-feasibility/java-input-resolution.md) resolves those failures using first-party input/UTF-8 reader/basic Scanner classes compiled inside the browser, with 31 Java checks and 11 coordinator-replayed boundary checks passing. Only helper class names are relocated into SDK/runtime namespaces; student source and bytecode are untouched. This is a documented library subset, not full JDK compatibility. Runtime exception detail, independent review of new code, distribution provenance and actual app/deployment integration remain gaps.

The prototype preloads verified asset bytes into a trusted parent and uses an opaque iframe supervisor with a dedicated classic blob worker/dynamic ES imports, connect-src none and bounded messages/output/deadlines. Module-worker initialization failed under the tested opaque context; isolated unsafe-eval was required by the runtime loaders. These changes apply only to the separate local static lab, never to app CSP. Independent testing passed 11 assertions on final-source hashes, including recovered native network APIs and Stop/rerun. No hard browser memory quota or production/cross-browser guarantee is claimed. Keep actual app integration and task 1.3 pending.

Evaluate runtimes with `workflow/templates/RuntimeEvaluation.md`. Pyodide is a Python candidate, not a selected dependency. Java candidates must compile source in-browser as well as run classes; remote compilation is prohibited. Record licenses and distribution size before adoption.

Design a credential-free execution origin separated from the authenticated app origin, restrictive frame/worker boundaries, CSP/network policy and a minimal validated message bridge. Verify message source/origin and per-run identity. An opaque frame may require wildcard delivery; if used, verify the source window and per-run channel token and document the design. Workers help responsiveness but do not themselves isolate network, storage or credentials. Never provide application tokens, private data or arbitrary RPC access to the runner.

Support buffered stdin, stdout/stderr, compile/runtime errors, stop, bounded output and execution deadlines. Use one source file and Java public Main entry class, without dependencies. Measure browser support, startup cost, cancellation and rerun behavior. Browser memory/process enforcement differs from OS sandboxes: document actual guarantees and reject unsuitable candidates. Allow controlled runtime asset loading without granting student programs arbitrary network access. Do not claim offline operation before testing it.

Browser results are practice feedback; the server does not use client-reported success to determine grades or XP.

### Student workspace presentation (27 October)

Requester supplied Coursemology screenshots and requested an adapted layout with the problem above code/run controls. Reference its public student/instructor guide and the supplied screenshots for navigation, compact assignment rows and the description/answer sequence, not implementation or assets. Keep CodeLeet identity and only current working destinations. Use a narrow desktop sidebar and an accessible compact mobile menu, white problem/editor panels, teal actions, a line-numbered plain-text editor and public-test summaries/details. Preserve source and outputs as text. No imported student names, course content, logos, badges, attachments, fabricated XP/grades, submission status or unavailable feature navigation. Existing dev-only gates and runtime boundaries remain unchanged. No new editor dependency is necessary.

Workspace theme is a client-side preference scoped to the student shell. Use a native accessible action button, no new package, and a stable server snapshot for hydration. Resolve light/dark from a validated browser-local key or device preference, update on system/storage changes, and retain an in-memory fallback when storage is blocked. Persist only the theme value, never source or results. Theme updates do not remount the editor or runtime. Neutral surfaces/text, semantic success/error states and the editor use theme-aware colors; the public home and isolated runtime document are unaffected.

Requester refinement: simplify the workspace, remove the visible Stop button, and place the theme control at the far-right edge immediately after an always-visible Menu. Use a compact editor/run toolbar, shorter input/output surfaces and collapsible run explanations; retain problem-before-code ordering. Runtime stop API, execution/preparation/suite deadlines and unmount cancellation remain implemented; removing a UI action does not remove those safeguards. Browser integration tests use navigation cancellation instead of a Stop click. Keep extra service/runtime details in Run details rather than repeated primary-page paragraphs.

### Published practice tests (requester decision, 27 October)

Use stdin/stdout tests for both languages: at most 5 published cases, each with id, name, stdin and expected_stdout. Normalize CRLF/lone CR to LF and ignore at most one final LF on each output; preserve all other spaces, case and blank lines. A passing case requires successful completion plus matching stdout. Stderr is displayed separately and never treated as expected output. Outcomes distinguish mismatch, compile/runtime error, timeout, output overflow, cancellation and infrastructure failure.

Execution budget: 5 seconds per case after the interpreter/program starts, separate from a 20-second Java compile/helper preparation deadline, runtime loading deadlines and a 90-second suite deadline. Each case uses a fresh sandbox/program state; source is snapshotted for the suite and execution is sequential, cancellable, practice-only. Input/output bounds remain 4 KiB/8 KiB. Timings are approximate local wall time, never official grades or performance rankings. Recompilation per Java case is acceptable initially; measure before optimizing.

Deliver an additional opt-in local preview with STUDENT_RUNNER_PREVIEW_ENABLED=true, only inside the existing development-only fixture preview, using the reviewed local static runner at fixed http://127.0.0.1:3130. Validate bridge origin, source window, nonce, request ID, result shape/size and lifetime. The outer bridge runs on the separate loopback origin; all student source stays in its inner opaque worker. This is synthetic-data development testing only, not an approved credential-free production deployment (cookies are not isolated by port). Production pages remain denied. Runtime binaries stay ignored/local pending distribution and provenance review.

Test-case authoring, publishing, schema/migrations/RLS and student display/checker/browser execution must share an agreed contract; either member may implement any part. Do not build competing teacher persistence. Agree GET /api/student/assignments/[assignmentId]/test-cases returning only public cases for published assignments, with assignment/test-set revision; drafts/private rubrics/hidden tests excluded. The current slice uses explicit synthetic cases, never a production fallback. Hidden browser tests and client results cannot establish trusted grades/XP.

### Access and revision contracts

Platform administration remains a global trusted role. Course membership grants student or instructor access independently for each course; a user may have different roles across courses. Public registration alone grants no course membership. Invite acceptance and student join-code acceptance require a verified signed-in email. Store private rubrics/draft grades separately from student-visible records; RLS alone does not hide individual columns in a readable row. Active-course instructors access course assignments; students access published assignments in enrolled courses and their own revisions. The archived Legacy course preserves former ownership rules.

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

### Issue #75: zero-cost Promptfoo security evaluation

Add Promptfoo as a pinned development-only CLI using its MIT-licensed open-source package; the project's Node 24 runtime meets its documented Node 22.22 minimum. Keep the scope on fixed, reviewed synthetic cases for the existing student and instructor prompt builders. Reuse the established model-case source and role-specific context builders where practical, so the evaluation does not become a second source of prompt text.

The default evaluation must run locally without provider credentials, model inference, or Promptfoo network requests. Pass an explicit checked-in comment-only `--env-file` so Promptfoo cannot discover or reload repository `.env` files; live secrets are loaded into the parent runner only when the live command is explicitly selected. Use ten deterministic local cases covering both roles and both source languages, including source-code, assignment-instruction and rubric-description injection. Check that student prompts omit private rubric markers, instructor prompts include only the synthetic owned rubric, untrusted text remains data, rubric point allocations stay private, replacement code is withheld, criterion scores reflect correctness, and fixture outputs cannot authorize grade publication. Keep the existing Vitest, route, RLS, output-schema, and bounded SoCLaaS model tests as separate controls; a fixture-backed Promptfoo pass is structural evidence and does not show model resistance.

Do not use Promptfoo Cloud, hosted probe generation or grading, remote-only red-team plugins, sharing, or real student data. Promptfoo 0.125.1's telemetry opt-out normally sends an opt-out acknowledgement, so pin a local patch that suppresses telemetry events when disabled and set its separate update-check opt-out in the runner. The explicit empty env file prevents the CLI from loading a root `.env`; live mode receives the intentionally loaded `.env.local` values from the parent process. The fixed local config uses only checked-in providers/assertions; this versioned path suppresses its known telemetry/update requests but is not a general sandbox for future untrusted plugins or configs. The requester confirmed the configured SoCLaaS endpoint is free. A manually invoked, explicitly opt-in SoCLaaS-backed run may evaluate the same ten cases against one selected model; never run it in pull-request CI. Do not add a paid API key or provider.

Alternatives considered: keep only the bespoke harness (no added dependency, but no Promptfoo workflow); use Promptfoo's hosted dynamic red-team features (richer probes, but external data flow and possible paid services); or use Promptfoo's local fixed-case workflow (selected because it adds a free, reproducible development check without external inference). See issue [#75](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/75). Promptfoo references: [MIT package and Node support](https://github.com/promptfoo/promptfoo/blob/main/package.json), [installation/runtime requirements](https://www.promptfoo.dev/docs/installation/), and [data handling](https://www.promptfoo.dev/docs/red-team/troubleshooting/data-handling/).

## Risks / Trade-offs

Issue #23 adds real My submissions history using the existing student session/RLS. The server selects only submission metadata and public assignment title, filters by verified student ID, orders created_at/ID descending and fetches 26 rows for 25-entry paging. Bounded page parameters never supply identity. Hidden assignment joins use a neutral label while own revisions remain visible. Authenticated sidebar/Menu gains My submissions; shared submissions layout covers list/detail, loading and safe retry/error UI. Existing detail source/feedback/published-grade behavior and immutable submission writes remain separate. No migrations, private fields in list responses, synthetic history fallback, AI calls or remote deployment are introduced.

Issue #21 refines the student workspace on PR #20: sidebar/Menu keep only Assignments and the brand gets a nonshrinking padded block. Real submissions place Run code immediately after source, input/output next, test cases/action below, Submit revision/status at the bottom and history last. Shared runner/results use ReactNode slots for the example selector and test action rather than duplicate runner state or indirect DOM button triggers. Preserve explicit button types, source, deadlines, fixture gates and save payloads. Verify desktop/mobile layout and real Python/Java actions.

Issue #19 prepares real student assignment practice cases while teacher authoring/publication/storage remains pending. The [contract](../../../workflow/contracts/published-practice-cases.md) and linked team issue share the existing public-case DTO and limits. A server-only adapter returns standalone sum-of-two-integers examples only with development, runner and fixture flags. An unchecked client choice describes the example task and clearly says it is not the assignment's tests. Use the existing editor source and runner; label example results separately, invalidate after edits, and remount/cancel on selection changes. Do not infer published cases from missing teacher data or alter source-submission/grade/XP payloads. Production supplies no examples regardless of flags. This temporary adapter does not close teacher persistence or production runner gates.

- Browser Java compilation and licensing may constrain package choice: prove source compilation first.
- Runtime JS bridges can expose network/app data: isolate and test before running untrusted source.
- Large runtimes affect cold starts: lazy load and measure.
- Provider availability/limits vary: verify before enabling AI and implement safe failure.
- Community scope competes with evidence collection: prioritize core role journeys and security.

## Migration Plan

No existing application data. Bootstrap tooling, prove runtimes, implement reviewed schema/RLS, deliver tested vertical slices, then stage/deploy. Record recovery steps before production migrations. Archive specs only when implementation and evidence match.

## Open Questions

Issue #54 adds independent forum search using existing member-authorized thread reads; see the [plan](../../../workflow/plans/2026-11-01-forum-search.md). Search title/opening body with escaped literal case-insensitive OR before stable bounded paging; separately escape regex and PostgREST quoted-value grammar. GET q is bounded/validated, controls reset pagination, pager retains q and reply paging stays unchanged. No schema, posting, AI or dependency changes. Started independently of then-open My grades PR #53; integrate updated develop after its external merge without additional grade changes.

Issue #52 implements the accepted independent My grades page through existing RLS-protected grades/submissions. See the [plan](../../../workflow/plans/2026-11-01-student-grades.md). Project only published list/feedback fields with verified submission ownership, title/language filtering before deterministic 25-row paging and neutral hidden-assignment metadata. Reuse student workspace/filter controls and shared pagination. No schema, grading/AI mutation, XP or aggregate score contract changes.

Issue #50 adds Continue editing using the published assignment route with strict `fromRevision` UUID, projected student/assignment/language-scoped server read and revision-keyed editor. See the [plan](../../../workflow/plans/2026-11-01-continue-editing-revision.md). Initialize source and clean baseline together; keep ordinary visits blank, unsaved query-navigation protection and current edits across save refresh. No source in URLs/storage, schema change, autosave, execution service or AI changes. AI PR #49 remains unmerged and outside this branch.

- Personal names and coordination budget; the primary responsibility split is non-exclusive as recorded above.
- Runtime versions/licenses, supported browsers, isolation headers and tested limits.
- Resolve runtime source-provenance/distribution and production-origin/browser-matrix gates before selecting a production Java runtime. Buffered input is demonstrated for the documented compatibility subset; app integration remains pending. Do not substitute a remote compiler.
- SoCLaaS endpoint/model/key limits.
- XP formula, grade correction, deadlines and resubmission rules.
- Product name and deployment URLs.

Issue #25 simplifies local configuration after the requester selected real-data defaults and automatic local Run code. Remove STUDENT_PREVIEW_ENABLED and STUDENT_RUNNER_PREVIEW_ENABLED; use development mode alone for the existing runner. Preserve fixture isolation through the test-only PLAYWRIGHT_ASSIGNMENT_FIXTURES setting plus development mode, and keep standalone example cases separately opt-in. Production loopback execution stays denied. Issue #31 also makes normal `pnpm dev` verify/fetch the pinned runtime files into the ignored cache and start the static loopback server alongside Next.js; submitted source still executes only in the browser.

### Issue #31: hosted browser execution on Vercel Preview and Production

The requester requires Python and Java Run code for both students and instructors on deployed Preview and Production sites, using Pyodide and TeaVM, and selected one Vercel project for simpler branch deployments. Build versioned static runner assets into the app project's `/runtime/` path. The app project's existing Preview/Production deployments then serve the matching app, bridge and runtime bytes. The build emits only a fixed allowlisted file tree and has no function or endpoint that compiles or executes source.

The app loads a fresh sandboxed `srcdoc` bridge and requests the fixed runtime manifest/assets through relative same-origin paths. The trusted app page uses the normal same-origin browser session where Vercel Preview protection requires it, verifies exact byte lengths/SHA-256 values and transfers public runtime bytes into the opaque sandbox. This keeps assets on the current app deployment and avoids a browser request to another origin. Every Preview and Production build stages the reviewed runtime inventory; the build fails if approval metadata/notices are incomplete, downloads fail, or asset bytes differ from the pinned inventory. No deployment environment switch is required. Versioned asset paths use immutable caching. No source or results are sent in the asset requests.

The iframe uses `sandbox="allow-scripts"` without `allow-same-origin`, which gives it an opaque origin while retaining script execution. The parent validates the exact iframe window, opaque `event.origin === "null"`, fresh nonce, protocol/run ID and bounded results. It posts to `*` only for that exact opaque iframe target and sends no secrets. Runtime code and user code execute only within the sandbox/worker CSP; the authenticated app CSP receives no eval allowance. Same-origin manifest/asset requests may carry the normal browser session only to this app deployment, while source remains in parent memory and crosses into the sandbox solely through validated messages. Student runs use only current editor state. Instructor runs use only the source/language already returned by the authenticated, owner-authorized submission review page and require an explicit Run action. Neither run path submits data, writes grades or awards XP.

Same-project preview smoke on 2026-10-31 exposed inherited sandbox CSP failures: the nested supervisor had a different nonce, Pyodide WebAssembly compilation was blocked, and TeaVM's Java path required JavaScript string evaluation. Pass the outer per-run nonce to the nested frame and permit `'unsafe-eval'` only in the opaque sandbox document's CSP; keep the authenticated app CSP unchanged, with sandbox network access denied.

On 2026-10-31 the requester reported successfully running Python and Java in the updated Vercel Preview. This is user-reported hosted smoke evidence; the report did not specify browser or role. Production and role-specific hosted checks remain separate.

On 2026-10-31 the user confirmed the completed distribution review covers the existing asset inventory and requested that reviewed runtime files always be included in deployments. A checked-in approval record binds that review to the exact manifest entries and generated notices; every build stages those assets and rejects changed bytes. There is no Vercel distribution flag to configure. The existing Chromium-only prototype results do not establish deployed or cross-browser security. Do not claim the live Vercel capability until actual Preview and Production smokes pass.

## Issue #38 independent Profile settings

PR #39 CI follow-up: the mobile-menu browser check must await the destination URL and Java editor before opening the menu, and await the destination again before testing its closed state. Next.js Link clicks may return while a client transition is still pending; the pathname-keyed menu intentionally resets on navigation. Preserve that behavior and synchronize the test to the rendered workspace rather than adding sleeps, retries or forced clicks.

The requester selected profile editing as independent work after Forums. Follow the [profile plan](../../../workflow/plans/2026-11-01-profile-settings.md). Reuse existing private profiles and column/RLS permissions, with a session-derived strict same-origin PATCH and shared account page. Edit only the trimmed 1–80-character username; readonly email comes from verified Auth and role from protected role lookup. No migration, uniqueness change, public profile endpoint, upload, privileged application key or dependency on open Forums/admin-role work. Maintain mobile/theme support, draft retention and truthful success/errors. Account Menu/header links limit overlap with pending navigation work.
Issue #25 simplifies local configuration after the requester selected real-data defaults and automatic local Run code. Remove STUDENT_PREVIEW_ENABLED and STUDENT_RUNNER_PREVIEW_ENABLED; use development mode alone for the existing runner. Preserve fixture isolation through the test-only PLAYWRIGHT_ASSIGNMENT_FIXTURES setting plus development mode, and keep standalone example cases separately opt-in. Production loopback execution stays denied. Runtime assets/service prerequisites remain separate.

## Issue #82 browser draft autosave and recovery

The requester approved [same-device browser drafts](../../../workflow/plans/2026-11-02-draft-autosave-design.md) on 2 November 2026. Follow the [implementation plan](../../../workflow/plans/2026-11-02-draft-autosave.md) and task group 29. Keep the server-verified account/assignment/language/starting-revision context separate from official immutable submissions. Bounded versioned local records, explicit recovery/conflict choices, Web Locks, source-bound acknowledgement and auth invalidation preserve work without adding a draft endpoint or altering grades/XP. Full storage/API denial cannot guarantee persistence or cleanup; preserve visible code and navigation protection. Hosted acceptance remains separate.

## Issue #30 independent shared forum

The requester selected forum work to proceed independently of teammate AI/deployment/test-case integration. See the [forum plan](../../../workflow/plans/2026-10-31-forums.md). Deliver persistent plain-text threads/replies scoped to the active course, trusted username/course-role snapshots, course-aware navigation, stable bounded newest-first pages, retry-safe posting and atomic per-user quotas. Use RLS-protected read projections and an unexposed privileged RPC implementation behind a public invoker wrapper; never broaden profile/submission/grade access. UI supports creation/reading only. No editing/deletion, uploads, live chat, Markdown/HTML, AI or XP. Local seed adds three threads/two replies; migration is additive and verified without resetting existing data. Independent teammate/log review and hosted deployment remain separate gates.


## Issue #85: multi-course workspaces

Adopt the user's approved course workspace model. Courses have a title, description, one owner, instructor/student memberships, active/archived lifecycle and per-course switches. Membership role is scoped to the course, so one account may be a student in one course and instructor in another. Keep platform administration global and separate. The owner and instructors can add instructors and add/remove students; only the owner can remove instructors, transfer ownership or archive. Ownership transfer is atomic, requires an existing instructor member as recipient, and retains the previous owner as an instructor.

Email invitations and student join codes both require signed-in verified email before membership is granted. Store pending invite target/role/course and compare normalized target email with Supabase's server-verified email at acceptance; join codes grant student membership only and are hashed, rate limited, revocable and rotatable. Use Supabase Auth email sign-in links for both existing and new addresses, then accept pending course invitations after verified sign-in. Supabase Auth's local SMTP inbox supports development; hosted delivery to arbitrary recipients requires SMTP configuration. See the official [signInWithOtp reference](https://supabase.com/docs/reference/javascript/auth-signinwithotp), [users and invitations guide](https://supabase.com/docs/guides/auth/users), and [custom SMTP guide](https://supabase.com/docs/guides/auth/auth-smtp).

For active courses, course membership plus feature setting governs route, API, RPC and RLS access for assignments, rubrics, submissions, grades, practice cases, AI, forums, XP and leaderboard. A disabled feature is unavailable to direct calls but its records remain. Initially expose switches only for implemented assessments, AI, discussions, XP and leaderboard. Do not add uploads or unsupported Levels/Statistics functionality.

Archive retains data and permits existing members to read history, while rejecting enrollment and all new/changed activity. Delete only an empty course (owner alone, no assignments/submissions/grades/AI/forum/XP records) through a transaction that serializes with activity. Legacy is the sole owner-pending exception: one archived Legacy course has no owner and displays Unassigned until a platform admin assigns an instructor owner; it remains archived/read-only after assignment. Preserve per-record legacy permissions rather than granting all archive instructors shared grading access.

Stage implementation in separate verified commits: (1) course/membership schema, policies and Legacy backfill; (2) enrollment/management APIs and course navigation; (3) assignments/grading/AI; (4) forum; (5) XP/leaderboard; (6) feature controls/lifecycle UI and final integration. Keep this approved scope in issue #85 and the dated summary.

### Issue #131: course access and ownership decisions

Keep the platform-admin role separate from course membership. A dedicated admin-only overview route may display course title, description, lifecycle and Legacy/unassigned status for a nonmember admin; it must not load membership, invitations, feature settings or course activity, and the ordinary course layout and activity routes continue to require membership. Direct ownership transfer accepts only a verified instructor already enrolled in the selected course; a student must first be separately invited or promoted by an authorized instructor. Join codes remain non-reversibly hashed and are shown only to course instructors after create/rotation in the current management session, with a copy action; no student-facing read path is added.

## Issue #144: signup email confirmation result

The ordinary `/auth/callback` signup path exchanges its one-time code, confirms the server-returned user has `email_confirmed_at`, then redirects to a dedicated result page. The result page independently checks the cookie-backed server identity and confirmed-email timestamp. A valid platform role offers Courses; a missing role still acknowledges verification but directs the user to administrator help. Direct, signed-out or unconfirmed visits redirect to sign-in without a false success state. Invalid or expired codes redirect to sign-in with a bounded status marker rendered as an actionable message. Password recovery and course-invitation callbacks keep their current destinations. No email, token, code or provider error appears in the result URL or visible copy.
## Issue #150: reflection depth and MP4 rubric audit

Audit the two individual reflections against actual coordination, test, context and resource records. Strengthen Paul’s decision/alternative/result/lesson analysis; correct unsupported causal language in John’s AI-assisted draft while keeping his first-person approval pending. Add a dated rubric evidence and gap matrix, not a grade prediction. No product behavior, schema or dependency changes. See `workflow/plans/2026-11-11-reflection-rubric-audit.md` and the dated summary in `logs/`.
