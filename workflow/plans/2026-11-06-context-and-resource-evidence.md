# Context Engineering & Resource-Aware Evidence Implementation Plan

Issue [#102](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/102). Branch `eval/102-context-and-resource-evidence` from `develop`.
Active OpenSpec: `build-programming-platform`, engineering-and-delivery, task 6.2.

## Problem Statement

The university module rubric requires strong evidence of **Context Engineering** and **Resource-aware Use** in both the **application** and the **development process**.
Currently, the codebase has the architectural foundations (role-aware context isolation, token preflights, DB quotas, multi-factor caching, browser execution constraints, and subagent configurations), but:
1. `docs/Reflections.md`, `docs/JohnReflections.md`, and `docs/PaulReflections.md` explicitly label controlled context/delegation comparisons as "proposed work, not a completed experiment".
2. `workflow/scripts/run-context-experiment.mjs` measures token sizes only, without evaluating output quality, rubric compliance, latency, or caching effects.
3. There is no empirical benchmark documenting the resource/noise impact of development context engineering (focused spec-driven handoffs vs unconstrained context dumps).
4. Task 6.2 in OpenSpec and the context item in `workflow/AssignmentChecklist.md` remain unchecked.

## Plan Goals

1. **App Context & Resource Experiment**:
   - Implement an automated empirical evaluation harness (`workflow/scripts/evaluate-context-strategies.mjs`) comparing **Focused (Role-Optimized) Context** vs. **Broader Authorized Context** across synthetic student and instructor tasks (Python and Java, positive solutions, negative bugs, adversarial prompt injection, and edge cases).
   - Evaluate input token footprint, output validation, rubric fidelity, injection resistance, cache hits, and quota consumption.
   - Persist findings in `workflow/experiments/2026-11-06-context-strategy-evaluation.md` and `.json`.

2. **Development Context & Resource Experiment**:
   - Implement an empirical benchmark (`workflow/scripts/evaluate-development-context.mjs`) comparing **Condition A (Focused Spec-Driven Context)** vs. **Condition B (Monolithic Full-Context Dump)** for typical development agent tasks.
   - Measure serialized token size, signal-to-noise ratio, obsolete contract hallucination risk, and tool call overhead.
   - Persist findings in `workflow/experiments/2026-11-06-development-context-experiment.md` and `.json`.

3. **Documentation & Reflections Update**:
   - Update `workflow/evidence/2026-11-02-reflection-observations.md` to resolve historical observation prompts with concrete experiment results.
   - Update `docs/JohnReflections.md` to replace "proposed work" placeholders with actual findings, metrics, and nuanced conclusions while preserving honest boundaries (PaulReflections.md left untouched per user instruction).
   - Update `docs/DeveloperGuide.md` (Sections 6 & 9) and regenerate documentation site assets.
   - Check off Task 6.2 in `openspec/changes/build-programming-platform/tasks.md` and the Context/Resource item in `workflow/AssignmentChecklist.md`.

4. **Verification & Delivery**:
   - Run unit tests, typechecks, linters, local link checks, and strict OpenSpec validation.
   - Record session log in `logs/2026-11-06-context-resource-evidence.md`.
   - Push branch, ensure CI passes, and open PR linked to Issue #102.

