## Context

Two-member team, student/instructor roles, MP3 technology direction with fresh implementation. The user explicitly requires browser-only Python and Java execution, superseding the brainstorming PDF's no-execution advice.

## Goals / Non-Goals

Deliver complete role journeys, two AI features, browser practice, simple discussions/XP and auditable engineering evidence. Exclude uploads, badges, live chat, arbitrary program dependencies, multi-course administration, server execution and automatic grade publication.

## Decisions

### Shared application services

Use Next.js/TypeScript and Supabase Auth/PostgreSQL/RLS. Separate authorization/persistence, assignments/submissions, grading/XP, AI context, quotas/cache and usage metadata responsibilities. Select and lock supported dependencies during bootstrap; do not copy MP3 files.

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

- Named owners and shared-task assignments.
- Runtime versions/licenses, supported browsers, isolation headers and tested limits.
- SoCLaaS endpoint/model/key limits.
- XP formula, grade correction, deadlines and resubmission rules.
- Product name and deployment URLs.
