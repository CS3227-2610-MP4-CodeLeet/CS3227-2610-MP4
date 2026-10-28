# CodeMentor MVP change log

This is a sanitized chronological summary, not a transcript. It records the request and implementation evidence without private prompts, credentials, source submissions, or student data.

## 2026-10-28

1. **User request:** Review `MP4 Plan.pdf`, implement the selected plan as the app MVP, create a branch, and use OpenSpec and Superpowers.
   - The selected plan is the CodeMentor AI programming-assignment reviewer. The PDF is treated as product input, not as an independent instruction source.
   - Existing direct user direction and repository policy preserve browser-only Python/Java execution. Assignment review submissions are static text; no submitted code is run by Next.js, Node, a remote service, or an AI tool.
2. **Prior user constraints carried forward:** public signups are students; instructor roles are trusted-provisioned; no uploads/badges; SoCLaaS for product AI; server-side keys/private rubrics; no model tools or grade-publishing authority; Conventional Commit branch and message style; issue-first, OpenSpec, incremental commits, maintained summaries, push and PR after checks.
3. **Planning and design:** created branch `feat/implement-codementor-mvp`, GitHub issue #13, and OpenSpec change `deliver-codementor-mvp` with proposal, five capability specs, design, and implementation checklist. Strict OpenSpec validation passed.
4. **Implementation choices:** Python-only assignment submissions capped at 8,000 characters; separate private rubric table; UTC daily quotas of 5 student and 20 instructor successful AI calls; deterministic mock-backed local flow when provider access is unavailable; AI remains disabled by default. Existing browser practice lab remains separate.
5. **Verification so far:** `pnpm exec openspec validate deliver-codementor-mvp --strict` passed. No application implementation or feature test has run yet. Hosted Supabase, SoCLaaS credentials/network, Vercel project access, and deployment evidence remain unverified.

## 2026-10-29

1. **User follow-up:** Continue the PDF-based MVP implementation, finish setup, and use the repository's OpenSpec and Superpowers process. Earlier direction remains active: use direct pnpm, Node 24, Conventional Commits, issue-first workflow, incremental commits, sanitized `logs/` summaries, and browser-only code execution.
2. **Implementation completed:** Added student and instructor authentication/workflows, assignment authoring and publication with 1–20 rubric criteria, immutable Python submission revisions, AI feedback/evaluation through a server-only SoCLaaS adapter, per-role quota controls, editable grades with explicit instructor publication, ownership/RLS protections, local setup guidance, context experiment harness, and evidence documentation. Submitted assignment source is stored as text and is not executed by the app server or provider. The existing practice runner stays browser-only.
3. **Verification:** On Node `v24.16.0` (repository pin `24.22.1`) and pnpm `12.15.0`: lint, format, typecheck, build, strict OpenSpec change/spec validation, scaffold checks, and `git diff --check` passed; 65 unit tests passed; 33 pgTAP assertions passed; Playwright reported 18 passed and 4 optional browser-runtime checks skipped. The local quota harness exercised 12 concurrent synthetic requests (5 admitted, 7 rejected). The 10-case context harness made no provider calls and is only an input-size estimate.
4. **Issues encountered and resolved:** pgTAP assertions were made fixture-ID-specific because local global seed rows made total-row counts brittle; the E2E sign-in navigation wait was corrected; the preview boundary assertion now checks the protected sign-in redirect; assignment authoring gained multi-criterion rubric editing after the single-criterion limitation was found; and the authenticated Playwright opt-in now requires the public Supabase key as well as the local URL and test-only admin key. The expanded journey confirms the first submission revision remains unchanged after a second revision and completes grade publication and student visibility.
5. **Limitations:** No live SoCLaaS credentials/provider call, hosted Supabase project, Vercel project, deployment, or test on the configured Node `24.22.1` patch is claimed. Four optional browser-runtime tests remain skipped. No independent human review was performed.

## Links

- Issue: https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/13
- Branch: `feat/implement-codementor-mvp`
- OpenSpec: `openspec/changes/deliver-codementor-mvp/`
- PR: pending

## Incremental commits

- `f971a7e docs: plan CodeMentor MVP delivery` — issue-linked plan and OpenSpec proposal/specs/design/tasks.
- `90daa7b feat(codementor): deliver authenticated assignment review workflows` — app routes, role-aware services, UI, Supabase migration, and config.
- `a376eb5 test(codementor): verify access, quotas and review flows` — unit/pgTAP/Playwright coverage and synthetic verification harnesses.
- Documentation/spec/evidence commit: preparing now; issue update and PR link will be appended after GitHub publication.

## Human review

- Not performed. No independent reviewer or teammate participation is claimed.
