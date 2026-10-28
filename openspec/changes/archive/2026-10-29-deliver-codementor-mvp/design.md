## Context

See [proposal.md](proposal.md) for motivation and scope and [`specs/`](specs/) for the observable contracts. The repo is a Next.js 16.4.3 App Router application with Tailwind, Supabase Auth scaffolding (`profiles`, protected `user_roles`), an unauthenticated development-only student preview, and a local-only browser practice runner. No production application route, assignment/submission schema, or AI service exists yet.

Constraints: use the existing Next.js/Supabase/SoCLaaS stack; public signups are students; instructor roles are provisioned by trusted administration; keep API keys and rubrics server-side; all database access is RLS-protected; never execute submitted source in Next.js, Node, a remote runner, or an AI tool; preserve the independent opt-in browser Python/Java practice lab; no uploads or real student data.

## Goals / Non-Goals

**Goals:** Deliver a complete, testable student/instructor assignment-review flow, secure AI review services, measurable context/resource controls, and truthful deployment/security evidence. Keep the MVP usable with local Supabase and deterministic mock AI responses when no provider key is configured.

**Non-Goals:** Replace the existing browser practice lab; provide server execution/autograding, arbitrary dependencies, Java submissions, multiple courses, social features, XP/badges, plagiarism checks, GitHub integration, RAG/vector search, queues, or broad submission analytics. Do not claim production deployment, live-model security, or real-provider measurements without the needed access and evidence.

## Decisions

### Application and authentication boundaries

- Keep one Next.js App Router application. Add `src/lib/supabase/{client,server}.ts`, a Next 16 `src/proxy.ts` refresh path, and server-only authorization helpers. Server components and Route Handlers verify the user through the repository's authorized `getUser` contract, then read `user_roles`; they never authorize from `getSession`, user-editable metadata, query parameters, or client role fields.
- Public registration creates student accounts through the existing database trigger. Instructor provisioning remains a trusted SQL/admin operation documented separately; no registration selector or public role-upgrade endpoint is added.
- Keep JSON Route Handlers for state changes so Origin, body-size, Zod, and error-envelope checks are explicit. Supabase SSR server clients use request cookies and the publishable key; database requests run as the verified user so RLS applies. Any privileged role provisioning stays outside ordinary app routes.
- Preserve the `/student/assignments` preview paths. In development with the explicit preview flag, they continue using synthetic fixtures and may expose the isolated browser runner. Production routes use authenticated database services and never fall back to fixtures. Actual assignment submissions are static-analysis inputs; the AI service receives a stored submission ID only.

### Database and authorization model

- Use imperative Supabase migrations. Keep the existing `profiles`/`user_roles` tables and add `assignments`, `assignment_rubrics`, `submissions`, `grades`, `ai_reviews`, and `ai_usage` with UUID keys, foreign keys, check constraints, timestamps, indexes, and RLS. Rubrics are split from public assignment rows so the student Data API projection cannot accidentally return rubric columns. No service-role client is used for normal application reads/writes.
- RLS policies permit students to list published assignment fields and read only their own submissions, student reviews, published grades, and usage. Instructor access is limited to assignments they own and the related submissions, rubrics, evaluations, grades, and usage. Revoke broad grants and grant only what each route requires.
- Create an atomic `submit_code` database function bound to `auth.uid()`. Under a per-user/assignment transaction lock it checks role, publication, Python language, source length, and request idempotency, then creates the next immutable revision. Identical retries return the original revision; conflicting request IDs fail. The API cannot set student identity, version, or timestamp.
- Create atomic AI quota reservation/finalization functions bound to `auth.uid()`. Serialize concurrent reservations per user/task/day; allow at most 5 student and 20 instructor requests per UTC day. Pending reservations are bounded by the provider timeout and stale reservations expire. Only successful calls count against the quota; failed calls remain auditable and release their reservation.
- Use a version-checked grade upsert/publication function. Only the assignment owner can edit; publication is explicit, and client or model fields cannot claim approval. XP is outside this PDF MVP.

### AI request and resource pipeline

- Implement one server-only SoCLaaS client over its OpenAI-compatible `/v1/chat/completions` endpoint, configurable through the existing `SOCLAAS_*` environment variables. Require `SOCLAAS_AI_ENABLED=true`, URL, key, and model; otherwise return a safe unavailable response. Use a bounded timeout, one request per interaction, no retries, no tool/function calling, and an 800-token output cap. Never send secrets or raw provider errors to clients.
- Each endpoint accepts only a strict `{ submissionId }` body, verifies identity/role/ownership first, then loads authorized assignment/submission context itself. Student context uses public fields and never queries `assignment_rubrics`; instructor context includes the owner's rubric. System instructions are fixed, while code and assignment text are JSON-serialized in a separate user message and identified as untrusted data.
- Use Zod contracts for feedback and evaluation. Require bounded strings/arrays and exact rubric criterion IDs; suggested scores must be within criterion bounds and totals must reconcile. Reject malformed output before persistence. Render all generated content as plain React text; no `dangerouslySetInnerHTML` or model tools.
- Estimate prompt tokens with a documented conservative UTF-8 size estimator (`ceil(serialized UTF-8 bytes / 3)`) and reject above 8,000 estimated tokens. Separately enforce the plan's hard 8,000-character source limit. Do not trim source to fit. Record provider-reported usage when supplied; otherwise record a separately labeled estimate.
- Hash a canonical payload containing user/cache scope, review type, assignment version, rubric version when applicable, exact source, prompt version, and model. Store only validated successful results. RLS and user-scoped keys prevent cross-user or cross-role cache disclosure. Cache hits create usage events but do not call SoCLaaS or count against daily successful-request quotas.
- Record each attempt with task, status, safe error category, latency, input/output counts and provenance, cache hit, submission/review link, and timestamp. Expose only the current user's usage. Do not log prompts, source, API keys, or full provider payloads.
- Add an instructor-only context inspector that compares the optimized context with a broader baseline containing only fields that same instructor is authorized to read. It displays actual context token estimates and validated response quality fields. A separate reproducible synthetic evaluation script covers 10 representative Python snippets; actual SoCLaaS measurements are optional at execution time and must be labeled pending if credentials/network are unavailable.

### Routes and screens

- Authentication: `/sign-in`, `/sign-up`, `/auth/callback`, and sign-out action; registration never offers instructor role.
- Student: `/student/assignments`, `/student/assignments/[assignmentId]`, and `/student/submissions/[submissionId]`; browse published work, submit/re-submit source, view revisions, request learning feedback, and see own grades only after publication. The existing preview-mode branch remains visibly labeled and separate.
- Instructor: `/instructor`, `/instructor/assignments/new`, `/instructor/assignments/[assignmentId]/edit`, `/instructor/assignments/[assignmentId]/submissions`, and `/instructor/submissions/[submissionId]`; create/edit/publish assignments, view owned submissions, generate/edit rubric advice, save grade drafts, and explicitly publish.
- Resource views: `/ai/usage` is owner-scoped for both roles; `/instructor/ai-context` provides the safe context comparison.
- APIs: `GET/POST /api/assignments`, `PATCH /api/assignments/[id]`, `POST /api/submissions`, `GET /api/submissions/[id]`, `POST /api/ai/student-review`, `POST /api/ai/instructor-review`, `PATCH /api/grades/[id]`, and `GET /api/ai/usage`. Use consistent `{ error: { code, message, requestId } }` responses; private responses use `Cache-Control: private, no-store`.

### Validation and tests

- Use Zod strict schemas, same-origin checks on cookie-authenticated writes, JSON-only content type, and a bounded raw body before parsing. Enforce Python only for real assignments, 8,000 Unicode characters, nonblank well-formed source with no NUL, and safe UTF-8 persistence.
- TDD each validation, authorization, context, cache, quota, route, and UI state. Vitest tests use real pure services and deterministic provider/database fakes only at external boundaries. pgTAP covers grants, RLS, hidden rubrics, ownership, atomic revision/idempotency, grade publication, and quota races. Playwright covers full local sign-up/student submission/AI feedback and instructor assignment/review/grade workflows against local Supabase with a mocked SoCLaaS server.
- Create 15 synthetic prompt-injection cases. Deterministic tests prove the context builder excludes secrets/private rubrics and keeps attacker text out of system instructions; they do not claim that prompt wording defeats every probabilistic attack. Add tests for malformed output, XSS, cache scope, concurrent quotas, oversized input, API key response/bundle absence, and provider failures.

### Evidence and deployment

- Document local setup, trusted instructor provisioning, environment variables, provider enablement, migration/reset, and user journeys. Add Mermaid architecture/data/access diagrams and a threat model mapped to test commands.
- Add a synthetic 10-case context experiment harness and report template. Persist actual measurements only when a run produces them; label token estimates, provider usage, mocked tests, and unavailable live runs separately.
- Keep `.env.example` blank. Prepare Vercel and separate Supabase environment instructions; do not create hosted resources, upload secrets, or claim deployment from repository changes alone. Rollback uses a tested additive migration strategy and Vercel deployment rollback; do not drop production data as an automatic rollback.

## Risks / Trade-offs

- [The SoCLaaS portal and docs require NUS network access] → use the documented OpenAI-compatible contract, keep live AI disabled by default, and make deterministic mock-backed flows usable locally.
- [Role and rubric leaks could invalidate the system] → separate rubric storage, restrict grants, enforce RLS plus route ownership, test direct API/Data API access, and never load rubric data in student context queries.
- [AI suggestions can be wrong or influenced by source comments] → treat source as untrusted data, provide no tools, validate output, keep suggestions editable, and require instructor publication.
- [Concurrent retries or requests can overspend quota/create duplicate revisions] → use transaction-scoped locks, idempotency constraints, reservation/finalization, and database race tests.
- [MVP scope spans application, database, AI, evidence, and deployment] → implement end-to-end slices in verified commits; hosted credentials and probabilistic live evaluations remain explicit external gates.
- [The plan excludes execution while this repository supports an explicitly requested local runner] → leave that development-only browser lab unchanged and never route submitted code through its server or any application backend.

## Migration Plan

1. Add additive migrations and run `pnpm db:reset`/pgTAP locally before application integration.
2. Deploy the migration to a separate development Supabase project, seed only synthetic users/data, configure server-only SoCLaaS and app secrets, and run authenticated journeys.
3. Configure a separate production Supabase project and Vercel environment after team review; apply migrations forward, verify role journeys and backups, then deploy.
4. Roll back application deployment through Vercel while retaining backward-compatible tables. Use a reviewed forward-fix or explicit recovery plan for data; never automatically drop or truncate hosted records.

## Open Questions

- The team must provide and verify its own SoCLaaS key/model, current NUS network reachability, hosted Supabase/Vercel project access, and deployment URLs before live-provider and deployment evidence can be completed.
