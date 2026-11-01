# SoCLaaS Model Evaluation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Verify MP4 Plan AI requirements and select a SoCLaaS model using bounded synthetic evaluations.

**Architecture:** Keep the existing server-only SoCLaaS gateway and production schemas. Add an opt-in script using synthetic test cases, a fixed local budget, production response validation, and a sanitized Markdown/JSON evidence report. Correct only confirmed gaps.

**Tech Stack:** TypeScript/Node 24, existing SoCLaaS API, Zod, Vitest, Supabase local tests.

**Spec:** `openspec/changes/evaluate-soclaas-models/`

## Global Constraints

- SoCLaaS is the only product AI provider.
- Never place provider keys or private rubrics in client code.
- Never execute submitted source in Next.js/Node or a remote service.
- Use synthetic data for live evaluations.
- Do not add model routing, dependencies, uploads, or public grade authority.
- Keep existing Python and Java execution in the browser.

## Review Focus

- Student prompts contain no private rubric -> assert the serialized student context omits rubric-only fields.
- Unauthorized submission IDs do not reach SoCLaaS -> assert service/route rejects before provider invocation.
- Prompt-injection text remains data -> assert fixed system instructions stay separate and validated output is not treated as an instruction.
- Provider failures are sanitized -> assert logs/results omit response body and credential values.
- Model comparison remains resource-bounded -> assert candidate and call limits stop additional fetches.

---

### Task 1: Audit and gap tests

**Files:** Existing `src/features/codementor/*` tests and `src/app/api/ai/*` route tests.

- [ ] Map each PDF requirement to current source/tests/docs and add regression tests only for evidence-backed gaps.
- [ ] Run focused tests to confirm any new regression fails before the fix.
- [ ] Implement minimal corrections and rerun the tests.

### Task 2: Synthetic evaluation data and harness

**Files:** Create `workflow/experiments/soclaas-model-cases.json`, `workflow/scripts/evaluate-soclaas-models.mjs`, update `package.json` only for an explicit command.

- [ ] Define fixed student, instructor, and injection cases with expected outcomes and no production data.
- [ ] Add a bounded evaluator that accepts candidate IDs or discovers `/models`, calls the configured SoCLaaS chat endpoint with a timeout, validates product JSON contracts, and captures returned usage and latency.
- [ ] Add deterministic tests for call-budget handling, response validation, unsafe error redaction, and missing configuration.
- [ ] Verify tests fail before implementation and pass after.

### Task 3: Live comparison and decision

**Files:** Create `workflow/experiments/2026-11-01-soclaas-model-evaluation.md`; update `.env.example` only if evidence justifies a default.

- [ ] Run the opt-in harness with synthetic data and a capped set of available candidates.
- [ ] Compare output validity, task usefulness, score consistency, injection behavior, latency, and reported tokens.
- [ ] Record actual values, failures, sample size, and limits. Select a model only if criteria are met; otherwise leave the choice open.

### Task 4: Verify and close out

**Files:** OpenSpec tasks/specs, dated log, relevant user/developer docs.

- [ ] Run focused AI tests, full applicable checks, database checks, build, and strict OpenSpec validation.
- [ ] Review the diff for secret exposure, accidental student data, and runtime-boundary regressions.
- [ ] Synchronize/validate OpenSpec, update the log, commit verified milestones, push, and open/update the PR to `develop` with issue #48 and evidence linked.
