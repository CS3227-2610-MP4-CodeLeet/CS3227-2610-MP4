## Why

The repository currently has a secure local student preview and browser practice runner, but not the authenticated student/instructor workflows described by the selected CodeMentor plan. Implementing those workflows as one tested MVP turns the planned platform into a usable assignment-review application while making its role-specific AI, privacy, and resource controls observable.

## What Changes

- Add cookie-based Supabase authentication with public student registration, trusted instructor provisioning, verified roles, and role-specific dashboards.
- Add instructor-owned Python assignment management with public instructions/learning objectives separated from private rubrics; add student browsing, bounded text submissions, immutable revisions, and authorized instructor review.
- Add two SoCLaaS-backed features: student educational feedback using public context, and instructor-only rubric evaluation that remains advisory until an instructor edits and publishes a grade.
- Add role-specific context builders, token estimates/budgets, structured prompt separation, output validation, scoped PostgreSQL response caching, atomic daily quotas, usage records, and an instructor context comparison view.
- Enforce RLS and route authorization, privacy-safe responses, same-origin writes, bounded provider timeouts, safe text rendering, and security-focused unit/database/browser tests.
- Add a concise deployment/readiness and grading-evidence package with actual measured fields and explicit limitations. Preserve the existing isolated browser-only Python/Java practice preview; submitted work is analyzed statically and is never executed on the server.

The implementation follows the selected assignment-reviewer plan and its P0 requirements. The instructor context comparison and evidence experiment are included from P1. Analytics beyond AI usage, uploads, badges, plagiarism checks, GitHub integration, multi-course administration, queues, vector search, and alternate project ideas are excluded. Real hosted deployments/provider measurements require the team's own environment and credentials and must be reported only when actually performed.

## Capabilities

### New Capabilities

- `user-authentication`: Cookie-based Supabase Auth, trusted role assignment, profile access, and protected role routes.
- `programming-assignments`: Instructor-owned assignment and private-rubric management, student-visible assignments, source submissions, revisions, and protected grade publication.
- `role-aware-ai-review`: Student learning feedback and instructor rubric suggestions via server-only SoCLaaS with strict authorization and validated output.
- `resource-aware-ai`: Context selection, conservative token estimation, scoped caching, atomic quotas, usage records, and a safe context comparison.
- `mvp-evidence`: Reproducible security, measurement, deployment-readiness, and demonstration documentation.

### Modified Capabilities

None. Existing local preview and browser-only runtime behavior remain governed by the current `build-programming-platform` change.

## Impact

- Application: `src/app`, `src/features`, and `src/lib`; add auth pages, role dashboards, Route Handlers, and server-only services.
- Database: additive Supabase migrations and pgTAP tests for assignments, private rubrics, submissions, reviews, grades, quotas, cache scope, usage, RLS, and atomic operations.
- Verification: Vitest, Supabase pgTAP, and Playwright; CI remains the repository's existing GitHub Actions setup.
- Configuration/docs: example environment variables, Supabase/Vercel readiness, user/developer guides, and `workflow/` evidence artifacts. No secret values or real student data are added.
- Issue: [#13](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/13). Branch: `feat/implement-codementor-mvp`.
