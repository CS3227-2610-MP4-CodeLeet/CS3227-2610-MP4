# Shared reflection observations — historical evidence note

Status: working reflection document. The runtime feasibility section records an actual coordinated experiment; generated summaries/analysis still need team verification. Other sections remain prompts until supported by evidence.

## Multi-agent software engineering

For each example, identify the task, actual agents and human owners, coordination pattern, trigger, context, shared files, handoffs, review outcome, and supporting evidence paths.

- Why was delegation appropriate for this task?
- What was idle, blocked, duplicated, retried, or conflicting?
- How was a disagreement resolved and verified?
- What were the measured implementation benefit and coordination cost?
- When did direct single-agent work perform better?

## Context engineering and resource-aware development

The [development context experiment](../experiments/2026-11-06-development-context-experiment.md) and [dataset](../experiments/2026-11-06-development-context-experiment.json) compare bounded spec-driven task handoffs (Condition A: targeted OpenSpec requirements, scoped file paths, and explicit tool/call budgets) against monolithic repository context dumps (Condition B) across 5 core development tasks:
- **Token Volume**: Condition B consumes **20.6x more input tokens** per request (mean: 5,508 tokens vs 268 tokens in Condition A), yielding a **95.1% token savings** through focused context engineering.
- **Signal-to-Noise Ratio (SNR)**: Focused context achieves an average SNR of **95.1%** task-relevant tokens, compared to **4.9%** under monolithic context dumps.
- **Contract Collision Mitigation**: Focused context eliminates 9 distinct obsolete contract hazards (such as deprecated preview mocks, unmerged draft schemas, and discarded compiler packages).
- **Resource Control**: Setting bounded budgets (3–6 tool calls, 5–15 minutes) prevents runaway subagent exploration loops while maintaining high completion fidelity.

## Context engineering and resource-aware product AI

The [empirical context strategy evaluation](../experiments/2026-11-06-context-strategy-evaluation.md) and [dataset](../experiments/2026-11-06-context-strategy-evaluation.json) evaluate Focused (Role-Optimized) Context against Broader Authorized Context across 8 representative synthetic student and instructor tasks in Python and Java:
- **Token Overhead**: Focused context saves an average of **22.1% input tokens** per request (mean: 361 tokens vs 441 tokens for broader context), compounding significant bandwidth and provider cost reductions.
- **Grading & Hint Quality**: Broader metadata (`createdAt`, `updatedAt`, `publicationStatus`, `revision`) adds zero measurable improvement to rubric scoring accuracy or educational hint clarity.
- **Security & Privacy**: 100% of adversarial prompt injections remain trapped in JSON user data; 100% of student context payloads exclude private rubric criteria.
- **Caching & Quota Economics**: Multi-factor deterministic cache hits require **0 provider tokens** and consume **0 daily quota slots**. Over-budget preflight rejections (>8,000 tokens) consume zero quota slots, preserving the 5 student / 20 instructor daily limits.

## Browser runtime experiment

Compare candidates for Python and Java against browser-only compilation/execution, isolation, cancellation, output limits, cold/warm performance, licensing, and supported browsers. Record rejected candidates and the reason for the final choice.

## Observed experiment: browser runtime feasibility (27 October)

See [coordination](../../workflow/evidence/runtime-feasibility/coordination.md) and the [measurement/decision report](../../workflow/evidence/runtime-feasibility/README.md). This is generated evidence for team review, not a completed personal reflection.

The coordinator owned the prototype, a Java researcher owned candidate/API/licensing research, a separate security reviewer owned the threat review and an independent browser tester owned adversarial assertions. Narrow file ownership avoided overlapping code writes. The security review found an async preparation race and unbounded empty messages/ready replays that happy-path runs had not exposed. The tester then found a functional output-limit status bug; the coordinator repaired it, and independent replay verified the fix. This provides concrete handoff/failure/review evidence rather than merely listing agent roles.

The original independent boundary suite passes 11/11 on its recorded source hashes. The initial functional matrix confirmed nine expected behaviors and two failed Java acceptance gates. Java's documented ability to compile/run source did not imply the required input/library behavior. Keeping that failure visible prevented premature integration. Initial bootstrap failures, a corrected test-orchestration error and review/replay overhead consumed resources; the evidence does not establish a net multi-agent speedup because no matched single-agent baseline was measured.

The [subsequent input fix](../../workflow/evidence/runtime-feasibility/java-input-resolution.md) was handled directly by the coordinator, reusing the earlier narrow research and test harness rather than launching new agents. First-party classes compiled in the browser resolved stdin/UTF-8/basic Scanner support; 31 Java cases and 11 boundary replays passed. A failed direct java-package compilation, a Wasm charset incompatibility, an emoji chunking bug and a Stop-output loss required repairs. One network assertion also needed correction because browser blob imports are local module loading. This illustrates the cost of compatibility assumptions and the value of keeping regression assertions mandatory. These follow-up runs are implementation testing, not a new independent review or a measured single-agent-versus-multi-agent comparison. Actual token/cost/cache measurements remain unavailable.

Selected raw assets total about 13.53 MB for Python and 6.72 MB for Java. Parent-byte caching reduced repeat preparation to under 1 ms in this local observation, but fresh worker/runtime setup still took seconds. Warm asset caching must not be presented as warm interpreter/compiler reuse or provider prompt caching. Fresh workers trade setup cost for state separation. Token/cost/internal reasoning usage and comparative agent-context/cache-hit measurements are unavailable, so no savings percentages are claimed. These observations are inputs for the team's eventual analysis, with Chromium/local-lab and memory/deployment limitations preserved.

## Follow-up: published practice tests and integration

The requester accepted stdin/stdout tests and a bounded local student preview. The [handoff contract](../../workflow/PublishedPracticeTests.md) separates student comparison/execution from the teammate's publishing/auth/migration ownership; synthetic cases support progress without pretending that shared persistence exists. Implementation stayed with the coordinator and reused earlier specialist findings rather than spawning new agents. There is no new independent review or measured comparison of delegation strategies for this slice.

Website integration exposed a contract mismatch that standalone tests missed: Stop during preparation returned a result without an executionMs field, and the bridge validator rejected it, leaving the UI waiting. A consistent executionMs:null response and an outer teardown fallback fixed the issue. The first full website run reported 15 successes and one failed scenario; the corrected 16-test run passed with exit 0. This is evidence for testing the consumer/producer boundary together, rather than equating separate passing components with a working journey.

Java compilation originally counted toward execution time. Separating the execution-start event from preparation both changes feedback semantics and preserves a separate preparation watchdog. A malicious replayed event must not reset the budget; the extended boundary replay tests this explicitly. One local timing sample showed roughly 1,171 ms of sandbox lifetime but 0.4 ms in the program itself. These figures are a single synthetic observation, not a benchmark or evidence that Java is faster than Python. Recompiling Java per case remains an explicit resource trade-off in exchange for fresh state.

Sandboxed Windows web-server teardown stalled despite passing browser scenarios; manual owned-server sessions allowed the same suite to finish cleanly. The exact OS/sandbox cause is unproven. Those retries and setup costs are part of the workflow evidence, not hidden as a clean first attempt. Full runtime website cases remain opt-in because the reviewed runtime binaries are not redistributed in the repository; default CI therefore does not establish runtime acceptance. Token counts, internal reasoning percentages and cache-hit metrics remain unavailable.

## Evidence audit: merged journeys and security (2 November)

The [security evidence map](../../workflow/evidence/2026-11-02-security-testing.md) connects role isolation, AI context/output boundaries, quotas, revision privacy and browser execution to concrete tests. This audit was direct coordinator work, not a new multi-agent experiment or independent review. The existing specialist runtime experiment remains the source for actual delegation evidence.

### Observation: green CI has a scope

The merged `develop` workflow at `0a26127` passed 147 database assertions and 80 unit-test files, but its browser run had 29 passes and 45 prerequisite skips. The earlier local deadline run recorded 67 browser passes with seven skips. These totals are not a quality or performance comparison: they used different trees and available credentials/opt-ins. A green workflow cannot establish authenticated or actual-runtime behavior that it skipped. A useful handoff must include the commit, environment, mocked services and skipped prerequisites, not merely “tests pass.”

### Observation: retrieved context can contradict itself

The User Guide retained early preview-only claims that forums were unavailable and hosted execution was disabled, alongside later forum instructions. Checking current routes, runner environment selection and test assertions exposed the contradictions. Reorganizing the guide around current user journeys and moving security/reproduction detail to a linked report keeps normal usage concise without losing the evidence needed for review. This is a qualitative observation; no controlled retrieval-quality, token or latency comparison was run, so no measured improvement is claimed.

### Observation: model quality needs assertions beyond valid JSON

The [SoCLaaS experiment](../../workflow/experiments/2026-11-01-soclaas-model-evaluation.md) recorded 3/4 schema-valid outputs for `llama3.1:8b`, but only 1/4 passed all configured task/security checks. `qwen3-coder-next` passed 4/4 in the corrected four-case synthetic comparison. An initial pilot exposed a missing `totalScore` prompt requirement; a contract test and instructor prompt version update made the expected interface explicit. This supports testing the prompt/validator contract and keeping cache keys versioned, rather than accepting a parseable response as correct. Four cases per model cannot establish general grading accuracy or prompt-injection resistance; the experiment did not evaluate Java feedback.

### Resource decisions and remaining work

This audit reused saved CI/experiment records and existing tests and made no live provider calls. It did not spawn new agents for a bounded documentation task. Avoiding duplicate evaluations limits calls, but actual token/cost savings cannot be calculated without a matched baseline. The first local test attempt also revealed stale DOM-test dependencies, followed by a Node patch incompatibility during installation. These setup failures belong in the session log rather than being erased from a clean final total.

Runtime byte caching, application AI response caching, provider prompt caching and agent context reuse are different mechanisms. Available evidence must not be used to infer savings for another mechanism. Provider prices/rate-limit verification, development token/cache metrics, internal reasoning percentages, a controlled context/delegation comparison and member-authored reflection remain pending. Team members should validate these generated observations and add their own decisions and contribution links before submission.

## Individual reflections

### Member A: <name>

Contribution links, decisions, observed failures, measured findings, and lessons: pending.

### Member B: <name>

Contribution links, decisions, observed failures, measured findings, and lessons: pending.

## Evidence and limitations

Link actual experiments and verified session summaries. Separate observation from inference, record sample size and confounders, and state what the evidence cannot establish.

