# User and developer guide refresh implementation plan

Execute inline using executing-plans and verification-before-completion. This is a documentation-only correction of existing behavior; no product implementation or new tests are required.

**Goal:** Make both guides useful and consistent with merged develop `dfe5936`.
**Architecture:** Keep user journeys in the User Guide; organize setup, module boundaries, contracts, verification and rollout in the Developer Guide. Link dated evidence rather than presenting old test totals as current guarantees.
**Stack:** Existing Markdown, Node 24/pnpm, scaffold/link checker, OpenSpec and Docusaurus.
**Spec:** `openspec/changes/build-programming-platform/specs/engineering-and-delivery/spec.md`, accurate artifacts and issue-linked closeout.
**Issue/branch:** #87; `docs/refresh-user-developer-guides`.

## Constraints and review focus

- Preserve the user's unrelated `next-env.d.ts` edit; never read or copy `.env.local` values.
- No code/schema/configuration changes, resets, live AI, hosted writes or course-workspace claims.
- Distinguish browser drafts from immutable server submissions, practice from grades/XP, server-only metadata keys from public clients, and implementation/build evidence from hosted acceptance.
- Explain that bare local production startup does not enable the runner; development and Vercel environment selection differ.
- Use current pinned commands; distinguish destructive seed/reset from additive migration.

## Tasks

- [x] Audit merged code/configuration, existing guides and dated evidence; create linked issue and branch.
- [x] Update the User Guide with clear entry points, tested workflows, concise troubleshooting and acceptance steps.
- [x] Replace obsolete scaffold/history sections in the Developer Guide with current setup, architecture/contracts, security/resource workflow and rollout guidance; retain acknowledgements and deep evidence links.
- [x] Verify command/path references, Markdown links, strict OpenSpec, formatting and site build; obtain a bounded independent documentation review and resolve material findings.
- [ ] Finalize log, commit/push, pass branch CI, create linked PR to develop and confirm final-head checks. Record skips and hosted/human verification separately.
