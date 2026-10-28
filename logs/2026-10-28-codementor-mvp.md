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

## Links

- Issue: https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/13
- Branch: `feat/implement-codementor-mvp`
- OpenSpec: `openspec/changes/deliver-codementor-mvp/`
- PR: pending

## Incremental commits

- Pending implementation; append each commit and its checks here.

## Human review

- Not performed. No independent reviewer or teammate participation is claimed.
