# Session: 3 November 2026 — user/developer guide refresh

- Timezone: Asia/Singapore
- Participants: requester and coordinator Codex `/root`; read-only reviewer `/root/guide_accuracy_review`
- Issue: [#87](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/87)
- OpenSpec: `build-programming-platform`, engineering-and-delivery, task group 31
- Branch/base: `docs/refresh-user-developer-guides` from merged develop `dfe5936`
- Plan: [guide refresh](../workflow/plans/2026-11-03-guide-refresh.md)
- PR: pending
- Human verification: pending
- Model/token/cache/cost measurements: unavailable

## Prompt and interaction summaries

1. Requester asked to update the User Guide and Developer Guide after discussing readiness and postponing presentation work. Inspected current source, both guides, repository workflow, merged PR #86, pending course issue #85 and actual environment/runtime/test configuration. Created issue #87 and a branch from updated develop, preserving the original generated next-env edit. No worktree, schema change, hosted action, live AI or secrets read.
2. Audit found obsolete scaffold claims, historical test totals presented without current context, a practice-case API described as absent despite implementation, production runner denial despite Vercel support, and a claim that source never enters browser storage despite draft recovery. Chose a current contributor reference with linked detailed history, and a task-focused User Guide with clear test/hosted limits. Several guessed filenames did not exist; discovered actual paths with rg instead. No product failure or unavailable CLI was inferred from those path misses.

3. Updated the User Guide's entry table, current baseline, local setup link, simple Python/Java printing examples, draft/editor wording, AI sample limitations, troubleshooting and student acceptance procedure. Reorganized the Developer Guide around current setup/configuration, architecture/contracts, browser execution, AI/security/resources, test prerequisites, agent workflow, deployment and acknowledgements. Retained deep evidence links, distinguished destructive reset from additive migration, and made the absence of a dedicated Vercel Actions deployment workflow explicit. No product/schema/configuration or reflection changes.
4. Fresh read-only reviewer `/root/guide_accuracy_review` received both guides, baseline/constraints and narrow code/config pointers with a requested four-minute budget. It confirmed relevant setup/auth/runtime/draft/test/workflow/XP/practice boundaries and found no material issues. It ran no tests/services, used no network and accessed no secrets. Coordinator added an explicit pending authenticated-admin-browser limit and retained historical model/provider distinctions. Requested budget is not a measured token/time saving.
5. Local scaffold/Markdown-link checks, strict OpenSpec (11 items), normal formatting and diff whitespace checks passed. Documentation-site build passed; no product unit/browser/database run is claimed for a prose-only change. Branch CI and PR checks will be recorded separately.

## Verification and handoff

- Completed local checks: guide command/path audit, local Markdown links/scaffold, strict OpenSpec, formatting and documentation-site build; existing product tests remain historical until CI runs.
- No runtime/schema behavior changed; no new tests that mirror documentation.
- Unverified: hosted role/email/AI acceptance, course integration, final human verification and release/master.
