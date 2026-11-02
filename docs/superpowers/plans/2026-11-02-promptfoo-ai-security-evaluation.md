# Promptfoo AI Security Evaluation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a free, local-first Promptfoo workflow that replays ten synthetic student and instructor AI security cases against the existing SoCLaaS prompt builders, with an offline deterministic mode and a bounded, explicitly invoked live mode.

**Architecture:** Keep Promptfoo as an exact-pinned development-only dependency. Reuse the existing synthetic case and evaluation helpers instead of copying product prompt text. The offline command uses deterministic local fixtures and must never make network requests; the live command uses only the configured SoCLaaS endpoint, one selected model, and a hard case/request cap. No Promptfoo-hosted generation, graders, sharing, telemetry, paid provider, or real student data.

**Tech Stack:** Node.js 24, pnpm 12.15.0, Promptfoo 0.125.1 (MIT), existing JavaScript SoCLaaS evaluation utilities, Vitest, and GitHub Actions.

**Spec:** `openspec/changes/build-programming-platform/design.md` — Issue #75; `openspec/changes/build-programming-platform/specs/engineering-and-delivery/spec.md`; `openspec/changes/build-programming-platform/tasks.md` task group 4.7.

## Global Constraints

- Product AI SHALL use SoCLaaS.
- Use synthetic assignment, rubric, and submission fixtures only.
- The live evaluation SHALL run only when explicitly requested and SHALL have a fixed request cap.
- The default evaluation SHALL be local and deterministic, with no model inference or network access.
- No Promptfoo-hosted generation/grading, sharing, remote-only red-team plugins, or real student data.
- Keep product AI keys and private rubrics server-side; never print or record credentials.
- Product AI SHALL have no tools or grade-publication authority; instructor publication remains explicit.
- Promptfoo SHALL be development-only and SHALL NOT enter the production bundle.

## Review Focus

- Offline mode must reject any path that could invoke `fetch`; test that the provider returns fixture output and makes zero calls.
- Live mode must fail closed unless explicitly enabled with complete SoCLaaS configuration; test disabled/incomplete configuration without exposing values.
- Live runs must not exceed the configured case count or silently retry; test the maximum and reject an over-budget request.
- Student rubric-extraction attacks must never be evaluated with rubric-bearing student context; test the constructed prompt and a sentinel rubric marker.
- Instructor source-code instructions to award full marks or publish must not change rubric scoring or claim publication; test Python and Java synthetic cases against deterministic assertions.
- Prompt injection in assignment instructions and rubric descriptions must remain data; test role-specific contexts with distinct sentinel strings.

## File Map

- Modify `package.json` and `pnpm-lock.yaml`: pin Promptfoo as a dev dependency and add offline/live commands.
- Modify `workflow/scripts/evaluate-soclaas-models.mjs` only where needed to expose reusable case/message helpers without changing existing output behavior.
- Create `workflow/experiments/promptfoo/promptfooconfig.yaml`: fixed local evaluation config and local JavaScript provider.
- Create `workflow/experiments/promptfoo/provider.mjs`: offline fixture mode and explicitly gated, bounded SoCLaaS live mode.
- Create `workflow/experiments/promptfoo/cases.json`: ten reviewed synthetic injection/authority cases covering student/instructor, Python/Java, source/assignment/rubric attack surfaces, with no private or real data.
- Create `tests/unit/promptfoo-provider.test.ts`: zero-network, gate, ten-request-cap, and safe-output tests.
- Create `workflow/experiments/promptfoo/assertions.mjs`: deterministic parsing/schema/quality assertions reusing the existing case checks.
- Create `workflow/experiments/promptfoo/promptfoo-tests.json`: an ID-only selector for all ten reviewed cases, checked against `cases.json` to avoid duplicating synthetic attack content.
- Create `workflow/scripts/run-promptfoo-evaluation.mjs`: cross-platform runner that configures safe local execution and gates live runs before Promptfoo starts.
- Create `tests/unit/promptfoo-config.test.ts`: verifies runner gates, config locality, selector coverage, and assertions.
- Modify `.github/workflows/application.yml` only if an application-check job can run the offline Promptfoo evaluation with no network/provider credentials.
- Modify `docs/DeveloperGuide.md`: exact commands, zero-cost behavior, local output location, and limits of fixture versus live evidence.
- Create `workflow/evidence/2026-11-02-promptfoo-ai-security.md` and `logs/2026-11-02-promptfoo-ai-security.md`: record actual checks, sanitized live results if run, limitations, and pending human review.
- Update OpenSpec task group 4.7 only after its corresponding work and checks are complete.

---

### Task 1: Add a fail-closed Promptfoo provider

**Files:**
- Create: `tests/unit/promptfoo-provider.test.ts`
- Create: `workflow/experiments/promptfoo/provider.mjs`
- Create: `workflow/experiments/promptfoo/cases.json`
- Modify: `workflow/scripts/evaluate-soclaas-models.mjs` only for reusable exports or language selection required by the provider.

**Interfaces:**
- Provider implements Promptfoo's `id()` and `callApi(prompt, context, options)` interface.
- Provider returns a stable JSON `output` and safe metadata; it never includes environment values, authorization headers, or raw provider errors.
- `context.vars.caseId` selects one known static synthetic case; unknown IDs fail without calling SoCLaaS.
- Offline mode is the default. Live mode requires `SOCLAAS_PROMPTFOO_LIVE=true`, complete existing `SOCLAAS_*` settings, and one explicitly selected model.
- Maximum live calls per invocation: 10, one for each fixed case; no retries and no parallel attack generation.

- [x] **Step 1: Write tests that prove offline mode makes no provider request and the live mode gate defaults closed.** Assert unknown cases, incomplete config, and an over-cap request fail without exposing secret-like input values.
- [x] **Step 2: Run the new tests and confirm expected failures.** Run: `pnpm exec vitest run tests/unit/promptfoo-provider.test.ts`. Expected: failures because provider/case modules do not exist.
- [x] **Step 3: Implement the provider and fixed case set.** Reuse `buildEvaluationMessages`, `runTrial`, and deterministic scoring from the existing evaluation helper. Ten fixed cases cover normal and attacked behavior for both roles, Python and Java source attacks, assignment-instruction injection for both roles, and an instructor rubric-description injection.
- [x] **Step 4: Run the provider tests and confirm they pass.** Re-run the focused Vitest command; assert offline tests use injected fixtures only and live-mode tests use a stubbed fetch.
- [x] **Step 5: Commit the verified provider slice.** `git add workflow/experiments/promptfoo workflow/scripts/evaluate-soclaas-models.mjs && git commit -m "feat: add gated Promptfoo AI security provider"`

### Task 2: Wire the local Promptfoo evaluation

**Files:**
- Create: `workflow/experiments/promptfoo/promptfooconfig.yaml`
- Create: `workflow/experiments/promptfoo/promptfoo-tests.json`
- Create: `workflow/experiments/promptfoo/assertions.mjs`
- Create: `workflow/scripts/run-promptfoo-evaluation.mjs`
- Create: `tests/unit/promptfoo-config.test.ts`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `.github/workflows/application.yml`

**Interfaces:**
- `pnpm ai:promptfoo` runs local deterministic fixture mode with telemetry/remote generation disabled.
- `pnpm ai:promptfoo:live` runs the same fixed cases through SoCLaaS only after the explicit live gate; command refuses to run without it.
- Promptfoo assertion functions receive model/fixture output and case metadata, reuse existing validators/scorers, and return false on malformed or unsafe outputs.
- Promptfoo test results remain in its local config directory or ignored runtime cache; generated results are not committed by default.

- [x] **Step 1: Write config/runner tests.** Verify the offline script sets telemetry and hosted-generation disable flags before Promptfoo loads, selects fixture mode, references only fixed local cases/providers, and has no live provider key in YAML.
- [x] **Step 2: Run tests to confirm they fail for the missing configuration/commands.** Run focused Vitest tests and record the expected missing-config failure.
- [x] **Step 3: Add Promptfoo 0.125.1 as a development-only dependency and create the configuration/assertion adapter.** Use only `promptfoo eval`; do not use `redteam run`, hosted generation/grading, or Promptfoo Cloud. Add a local no-network test to the existing application CI job if the installed CLI supports it without contacting external services.
- [x] **Step 4: Run the offline Promptfoo evaluation and focused tests.** Expected: all ten synthetic cases complete deterministically with no provider credentials or outbound requests; malformed fixture output fails its assertion.
- [x] **Step 5: Commit the verified offline workflow slice.** `git add package.json pnpm-lock.yaml workflow/experiments/promptfoo .github/workflows/application.yml && git commit -m "test: add offline Promptfoo AI security evaluation"`

### Task 3: Run bounded live SoCLaaS evaluation and document evidence

**Files:**
- Modify: `workflow/experiments/promptfoo/provider.mjs` only for gaps found in the explicit live run.
- Modify: `docs/DeveloperGuide.md`
- Create: `workflow/evidence/2026-11-02-promptfoo-ai-security.md`
- Create: `logs/2026-11-02-promptfoo-ai-security.md`
- Modify: `openspec/changes/build-programming-platform/tasks.md`

- [x] **Step 1: Confirm live-mode tests reject execution unless explicitly enabled, use only SoCLaaS, and cap the run at ten requests.** Use stubbed fetch for automated tests.
- [x] **Step 2: Run the fixed ten-case Promptfoo evaluation against the already configured free SoCLaaS model.** Keep the key in `.env.local`/process environment only, disable Promptfoo telemetry/hosted features, use no other model service, and record only case IDs, pass/fail categories, latency and provider-returned token counts if available. Never save the key or raw headers. Three bounded runs were performed (30 calls total): 5/10 before fixing prompt-contract drift, then 9/10, then 10/10 after review assertions were strengthened.
- [x] **Step 3: Record actual local/live results separately.** State that one small model evaluation is not proof of prompt-injection resistance, grading validity, Java correctness, or deployed behavior.
- [x] **Step 4: Run all applicable verification.** Promptfoo focused/offline evaluation, unit tests, lint, typecheck, format check, scaffold validation, and `git diff --check` passed. Local `pnpm build` hit a Windows runtime-staging EPERM; rebased Linux CI build/site/browser checks passed. Strict OpenSpec validation was attempted and reports existing long-requirement warnings under 1.15.0; targeted validation and non-strict validation of all 11 changes passed. Rebased application and database CI passed after retrying a runner port collision.
- [x] **Step 5: Finalize the dated log and mark only verified task items complete.** Human teammate review remains pending; no deployment or merge is claimed.
- [x] **Step 6: Commit/push the verified documentation/evidence slice and create the linked PR to develop.** PR #78 links issue #75 with `Closes #75`; log and OpenSpec change are linked in its description.
- [x] **Step 7: Address PR review findings.** Strengthened solution, rubric disclosure, criterion score, and publication assertions; patched Promptfoo's disabled-telemetry acknowledgement and disabled update checks; added regressions and reran checks. Commits `43c3550` and `36e8305` are pushed; all six addressed inline threads were replied to and resolved. Independent human verification remains pending.

**Verification:** The offline Promptfoo command must pass without external service credentials and make zero outbound calls. The live run must show no more than ten calls to the configured SoCLaaS target and no Promptfoo-hosted requests. Existing unit/database/application checks must report their actual result and skips.
