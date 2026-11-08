# User Guide and security evidence plan

Issue: [#70](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/70). Branch: `docs/user-guide-security-evidence`, from `develop` at `0a26127`.

OpenSpec: [engineering and delivery](../../openspec/changes/build-programming-platform/specs/engineering-and-delivery/spec.md), particularly accurate release artifacts and reproducible security/context evidence.

## Scope and decisions

The requester authorized updating the User Guide and recording security-testing/reflection evidence. Audit existing behavior and evidence; do not build features, change schemas, contact users, make live AI requests or deploy. Keep personal reflections and human verification pending. Historical experiment results must retain their dates, sample sizes and limitations. Do not infer missing measurements or mark broad release tasks complete from documentation work.

Use normal student/instructor journeys in `docs/UserGuide.md`, reproducible checks and remaining gates in `workflow/evidence/2026-11-02-security-testing.md`, and evidence-backed analysis in `docs/Reflections.md`. Link the report from the Developer Guide and evidence index. Preserve unrelated `next-env.d.ts` changes. No new implementation tests are needed for prose changes; run existing relevant checks instead.

## Tasks

- [x] Audit routes, controls, test assertions, historical experiments and merged CI against the guide; link issue and OpenSpec before editing.
- [x] Replace stale guide claims, index security evidence and append scoped reflections with measurement limitations.
- [x] Verify documentation links/format/spec/scaffold, run applicable existing tests and record actual outcomes and prerequisite failures.
- [x] Commit/push focused documentation, verify branch CI and create linked [PR #71](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/pull/71) to develop. Branch workflow 41375618030 passed; final-head checks are monitored/reported on the PR before handoff. Human review and release remain separate.

## Follow-up: individual reflection structure

The requester supplied MP3 reflection material as a structural reference, not MP4 evidence. Keep `docs/Reflections.md` as a short MP4 index linking `PaulReflections.md` and `JohnReflections.md`. Draft different role-focused analyses of actual MP4 evidence; cover Multi-Agent SE, Context Engineering, Resource-aware Use, AI/development security and SDD. Preserve previous shared observations in `workflow/evidence/2026-11-02-reflection-observations.md`. Attribution and personal wording require each member's review; do not copy MP3 implementation, workflow prose, counts or outcomes.

PR #71 merged before this follow-up was included. Its publication/checks now use [issue #72's plan](2026-11-02-individual-mp4-reflections.md) on a fresh branch from merged develop; the earlier PR remains the evidence audit baseline.

- [x] Verify individual draft claims/links and index structure, format and validate artifacts: 142 links across 11 documents, member/theme structure, formatting/scaffold/11-item strict OpenSpec validation. Continue issue #70 / PR #71; final-head CI is monitored/reported before handoff. Member review remains pending.

## Review focus

- Distinguish current implementation, past local experiments, mocked tests and deployed verification.
- Keep example tests separate from instructor-authored cases and official grades.
- Distinguish absent test credentials/skips from passing access-control checks.
- Never present a prompt-injection sample or coverage percentage as a security guarantee.
- Keep SoCLaaS usage, provider caching, token/cost data and actual agent participation attributable to evidence.
