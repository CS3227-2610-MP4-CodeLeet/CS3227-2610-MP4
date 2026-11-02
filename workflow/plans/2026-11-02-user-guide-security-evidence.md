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
- [ ] Commit/push focused documentation, verify branch CI, create a linked PR to develop and wait for final-head checks. Human review and release remain separate.

## Review focus

- Distinguish current implementation, past local experiments, mocked tests and deployed verification.
- Keep example tests separate from instructor-authored cases and official grades.
- Distinguish absent test credentials/skips from passing access-control checks.
- Never present a prompt-injection sample or coverage percentage as a security guarantee.
- Keep SoCLaaS usage, provider caching, token/cost data and actual agent participation attributable to evidence.
