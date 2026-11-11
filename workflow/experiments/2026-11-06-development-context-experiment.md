# Experiment: Context Engineering & Resource-Aware Use in Agentic Development

Status: Completed.

- Owner/date/commit/environment: Issue [#102](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/102), 2026-11-06, commit on branch `eval/102-context-and-resource-evidence`. Local Node.js 24.22.1, pnpm 12.15.0.
- Hypothesis and success criteria:
  - Bounded, spec-driven task handoffs (Condition A: targeted OpenSpec requirements, narrow file write sets, and explicit interface contracts) will reduce input token volume by >= 80% compared to monolithic repository context dumps (Condition B).
  - Condition A will eliminate obsolete contract hallucinations and contradictory guidance (e.g. legacy preview flags vs. production runtime).
  - Task budgeting (setting explicit call caps and duration limits) will eliminate unbounded agent wandering and coordination thrash.
- Safe baseline and alternative:
  - Alternative (Condition A - Focused Spec-Driven Context): Minimal handoff containing only the target requirement, relevant TypeScript interface definitions, scoped file paths, and explicit tool permissions.
  - Safe Baseline (Condition B - Monolithic Context Dump): Supplying the entire repository tree, unpruned schema files, all test suites, and historical chat logs/transcripts.
- Synthetic fixtures and sample size: 5 representative core development tasks across the CodeLeet platform:
  1. `dev-task-01`: Assignment deadline boundary condition validation.
  2. `dev-task-02`: Atomic AI quota reservation under concurrent contention.
  3. `dev-task-03`: Web Worker Java Scanner standard input compatibility.
  4. `dev-task-04`: Case-insensitive discussion forum search.
  5. `dev-task-05`: Student progress dashboard query isolation.
- Model/runtime/version and prompt/context versions: Evaluated using repository benchmark harness [`workflow/scripts/evaluate-development-context.mjs`](../scripts/evaluate-development-context.mjs); output persisted in [`workflow/experiments/2026-11-06-development-context-experiment.json`](2026-11-06-development-context-experiment.json).
- Controlled variables and order of runs: Identical task specifications and success acceptance criteria evaluated across both context strategies.
- Time/token/call budget and stopping conditions: Explicit tool call limits (3–6 calls) and time caps (5–15 mins) configured per task.
- Measurement source and unavailable metrics: Token estimator `ceil(UTF-8 bytes / 3)` evaluated directly on serialized prompt payloads for both Condition A and Condition B; signal-to-noise ratio calculation `(focused_tokens / monolithic_tokens) * 100%`; obsolete contract hazard audit.

## Results Table

| Task ID | Task Scope | Focused Tokens (A) | Monolithic Tokens (B) | Token Multiplier | SNR (Focused in B) | Obsolete Hazards Mitigated | Budget Cap |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| `dev-task-01` | Deadline boundary condition | 267 | 5,518 | 20.7x | 4.8% | 2 | 3 calls, 5 min |
| `dev-task-02` | Quota concurrency advisory lock | 295 | 5,992 | 20.3x | 4.9% | 2 | 5 calls, 10 min |
| `dev-task-03` | Browser Java Scanner bridge | 249 | 6,601 | 26.5x | 3.8% | 2 | 6 calls, 15 min |
| `dev-task-04` | Forum case-insensitive search | 252 | 5,675 | 22.5x | 4.4% | 1 | 3 calls, 5 min |
| `dev-task-05` | Student progress RLS isolation | 294 | 6,236 | 21.2x | 4.7% | 2 | 4 calls, 8 min |

### Overall Aggregate

- **Total Focused Estimate**: 1,357 tokens (mean: 271 tokens/task)
- **Total Monolithic Estimate**: 30,022 tokens (mean: 6,004 tokens/task)
- **Constructed-input multiplier**: **22.1x** for these five synthetic packets
- **Constructed-input difference**: **95.5%** fewer estimated tokens in the focused packets
- **Focused share of constructed broad packet**: **4.5%** by the estimator. This size ratio is not a measured semantic relevance score.
- **Obsolete contract references**: 9 references deliberately placed in broader packets and omitted from focused packets. No agent-error rate was measured.

## Analysis

- **Findings**:
  1. **Input-size difference**: The monolithic packets contain 22.1x the estimated input tokens of the focused packets. This is an offline size estimate, not measured provider usage, cost, latency, cache behavior, task quality or savings across real coding sessions.
  2. **Obsolete guidance exposure**: The constructed broad packets contain nine explicitly listed obsolete references. The focused packets omit them, reducing exposure in this fixture. Whether a working agent would follow those references was not tested.
  3. **Disciplined Single-Agent vs. Subagent Delegation**:
     - The task packets specify 3–6 call budgets, but the harness did not execute agents or measure completion time, coordination overhead or budget adherence. Separate runtime coordination records document actual specialist work.
- **Limitations/Confounders**:
  - The broad condition is assembled from selected repository material and deliberately supplied distractors. It is not a random or representative sample of actual handoffs, so its multiplier should not be generalized to other repositories.
  - The byte-based estimator is not a model tokenizer. Provider prompt caching, actual agent turns, response quality and error rates were not measured.
- **Decision and Follow-Up**:
  - Enforce the Spec-Driven Development (OpenSpec) handoff protocol across all agent workflows.
  - Require all subagent dispatches to declare explicit tool boundaries, relevant file pointers, and call/time budgets before execution.
