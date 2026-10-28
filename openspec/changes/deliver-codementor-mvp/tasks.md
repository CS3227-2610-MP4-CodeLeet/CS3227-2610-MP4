## 1. Authentication and request boundaries

- [x] 1.1 Add Vitest coverage for strict request schemas, bounded JSON bodies, same-origin writes, safe error envelopes, and role resolution from `getUser()` plus `user_roles`.
- [x] 1.2 Implement server/browser Supabase clients and the Next 16 `proxy.ts` cookie-refresh flow using the repository's installed Next/Supabase APIs.
- [x] 1.3 Implement sign-up, sign-in, callback, sign-out, role-aware route guards, and student-only public registration; document trusted instructor provisioning.
- [x] 1.4 Verify auth flows and ensure production routes never fall back to development fixtures.

## 2. Database model and access control

- [x] 2.1 Add migration tests first, then additive tables, constraints, indexes, grants, and RLS for assignments, private rubrics, submissions, grades, reviews, and usage.
- [x] 2.2 Add and test atomic `submit_code`, AI quota reservation/finalization, and version-checked grade publication functions.
- [x] 2.3 Add pgTAP coverage for direct Data API access, student/instructor ownership, hidden rubrics, revision idempotency, publication visibility, quota reservation boundaries, and role escalation denial; verify concurrent quota reservations with the local 12-request harness.
- [x] 2.4 Run local Supabase migration/reset and pgTAP; resolve all failures before building feature routes.

## 3. Assignment and submission vertical slice

- [x] 3.1 Write service/route tests for published assignment lists, owner-only draft access, Python/8,000-character validation, request idempotency, revision immutability, and private no-store responses.
- [x] 3.2 Implement assignment and submission services plus `GET/POST /api/assignments`, `PATCH /api/assignments/[id]`, `POST /api/submissions`, and `GET /api/submissions/[id]`.
- [x] 3.3 Build student browse/detail/history/submission screens and instructor assignment create/edit/publish/submission screens.
- [x] 3.4 Verify authenticated student and instructor flows against local Supabase using synthetic records; keep the existing browser practice runner isolated.

## 4. SoCLaaS and AI review

- [x] 4.1 Add tests for student/instructor context separation, 15 synthetic prompt-injection inputs, strict model-output schemas, XSS-safe rendering, payload size, token estimates, and provider failure handling.
- [x] 4.2 Implement versioned context builders and a server-only SoCLaaS client with explicit enablement, timeout, no retry/tools, and output-token cap.
- [x] 4.3 Implement scoped cache hashing, atomic daily quotas, attempt/success usage records, and usage reads that expose only the current user's metrics.
- [x] 4.4 Implement student and owner-authorized instructor review endpoints and screens; validate all output before persistence and keep instructor grades editable/unpublished.
- [x] 4.5 Implement explicit grade editing/publication and instructor context comparison with actual context estimates and validated output fields.
- [x] 4.6 Verify mocked provider flows, context/cache separation, quota behavior, model error handling, and no client exposure of secrets or private rubric content.

## 5. End-to-end security and evidence

- [x] 5.1 Add Playwright scenarios for student sign-up/submission/revision/feedback/grade visibility and instructor assignment/review/grade publication against local Supabase and mocked SoCLaaS.
- [x] 5.2 Add synthetic 10-case context experiment harness, clearly labeled report template, architecture/data/access diagrams, threat-model-to-test map, and local/Vercel/Supabase setup documentation.
- [x] 5.3 Run the focused Vitest, pgTAP, lint, typecheck, build, and Playwright suites available in this environment; record skipped checks and the tested commit.
- [x] 5.4 Update verified user documentation, create sanitized dated interaction/change summary under `logs/`, and ensure no secrets, prompts, or real student data are recorded.
- [ ] 5.5 Review the final diff against the PDF and OpenSpec requirements, update issue #13, push the branch, and open a PR with checks, limitations, and external deployment/provider gates stated accurately.
