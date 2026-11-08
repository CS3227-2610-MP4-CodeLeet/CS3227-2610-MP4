# Vitest Coverage Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Enforce the approved Vitest coverage minimums across maintained application source.

**Architecture:** Add the Vitest 5.0.5 V8 provider, generate text and JSON reports, and measure maintained source files rather than tests or generated assets. First inspect the baseline, then add behavior tests for uncovered production paths and set 80% statements, lines, and functions plus 70% branches as global minimums.

**Tech Stack:** Node 24, pnpm 12.15.0, Vitest 5.0.5, `@vitest/coverage-v8` 5.0.5, React Testing Library 16.3.3, jsdom 30.1.3.

**Spec:** [Approved design](../specs/2026-11-01-test-coverage-and-dependency-updates-design.md)

## Global Constraints

- Keep Python execution and Java compilation/execution in the browser; never run submitted code in Next.js/Node or add a remote execution service.
- Keep product code in `src/`, tests in existing test locations, workflow artifacts in `workflow/`, and OpenSpec artifacts under `openspec/`.
- Do not cover tests, generated types/build output, vendored runtime distributions, declarations, or `src/runtime-lab/**` as application source. The runtime lab is a separate browser-only boundary; never import its execution worker into Node for coverage.
- Do not pad coverage with assertions about mocks; tests must prove observable behavior.
- Keep report generation available when tests fail so CI can still publish coverage.

## Review Focus

- Source files that Vitest does not discover by default: include maintained `.ts`, `.tsx`, and `.mjs` application source, while excluding tests, generated artifacts, and the browser-only `src/runtime-lab/**` implementation.
- Branch-heavy authorization and validation code: add behavior assertions for meaningful allow/deny and valid/invalid outcomes.
- Error paths that invoke server or browser boundaries: test stable responses without executing student code in Node.
- Coverage output on failed tests: confirm `reportOnFailure` leaves a readable JSON summary for the reporting workflow.
- Threshold semantics: verify all four global minima are enforced and the report scope matches the intended source set.

---

### Task 1: Configure and measure Vitest coverage

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `vitest.config.ts`
- Test: all current Vitest suites under `src/` and `tests/unit/`

**Interfaces:**
- Produces: `pnpm test:unit:coverage`, reports at `coverage/coverage-summary.json` and `coverage/coverage-final.json`.

- [x] Add `@vitest/coverage-v8@5.0.5` as a development dependency and add `test:unit:coverage` running `vitest run --coverage`.
- [x] Configure provider `v8`, `include` for maintained `src/**/*.{ts,tsx,mjs}`, explicit exclusions for tests, declarations, generated/build output, and runtime distributions; enable `text`, `json-summary`, and `json` reporters plus `reportOnFailure`.
- [x] Run `pnpm test:unit:coverage` and record the baseline per-file and aggregate coverage. Do not set thresholds yet.
- [x] Inspect the uncovered source report and identify observable behaviors in maintained code that lack assertions. Add focused tests for those existing behaviors and run them; these are test-only additions, so passing immediately is expected. If a test exposes a real defect, record it and scope a regression fix separately before changing production code.
- [x] Run the full coverage command after each test batch and add behavior tests until the suite can meet the approved thresholds without excluding maintained source solely to improve percentages.
- [x] Configure global minimums: 80 statements, 80 lines, 80 functions, 70 branches. Confirm a temporary local lowering of a threshold causes the expected failure, then restore the approved values.
- [x] Run `pnpm test:unit:coverage`, `pnpm lint`, `pnpm typecheck`, and `git diff --check`.
- [x] Commit the verified coverage and test changes as `test: enforce Vitest coverage thresholds`.

---
