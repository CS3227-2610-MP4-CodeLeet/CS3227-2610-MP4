# Reflections

Status: working reflection document. The runtime feasibility section records an actual coordinated experiment; generated summaries/analysis still need team verification. Other sections remain prompts until supported by evidence.

## Multi-agent software engineering

For each example, identify the task, actual agents and human owners, coordination pattern, trigger, context, shared files, handoffs, review outcome, and supporting evidence paths.

- Why was delegation appropriate for this task?
- What was idle, blocked, duplicated, retried, or conflicting?
- How was a disagreement resolved and verified?
- What were the measured implementation benefit and coordination cost?
- When did direct single-agent work perform better?

## Context engineering and resource-aware development

Compare narrow task handoffs with a safe broader-context baseline on comparable work. Record available tokens/tool calls, elapsed time, repeated reads, review defects, and model configuration. Mark unavailable metrics explicitly, including internal reasoning tokens and provider caching details when not exposed.

## Context engineering and resource-aware product AI

Use the experiment template to compare role-safe baseline and optimized prompts on representative synthetic submissions. Measure token usage, latency, feedback quality, application cache behavior, and errors. Include quota/concurrency evidence and provider limit handling. Do not report illustrative PDF numbers as measurements.

## Browser runtime experiment

Compare candidates for Python and Java against browser-only compilation/execution, isolation, cancellation, output limits, cold/warm performance, licensing, and supported browsers. Record rejected candidates and the reason for the final choice.

## Observed experiment: browser runtime feasibility (27 October)

See [coordination](../workflow/evidence/runtime-feasibility/coordination.md) and the [measurement/decision report](../workflow/evidence/runtime-feasibility/README.md). This is generated evidence for team review, not a completed personal reflection.

The coordinator owned the prototype, a Java researcher owned candidate/API/licensing research, a separate security reviewer owned the threat review and an independent browser tester owned adversarial assertions. Narrow file ownership avoided overlapping code writes. The security review found an async preparation race and unbounded empty messages/ready replays that happy-path runs had not exposed. The tester then found a functional output-limit status bug; the coordinator repaired it, and independent replay verified the fix. This provides concrete handoff/failure/review evidence rather than merely listing agent roles.

The original independent boundary suite passes 11/11 on its recorded source hashes. The initial functional matrix confirmed nine expected behaviors and two failed Java acceptance gates. Java's documented ability to compile/run source did not imply the required input/library behavior. Keeping that failure visible prevented premature integration. Initial bootstrap failures, a corrected test-orchestration error and review/replay overhead consumed resources; the evidence does not establish a net multi-agent speedup because no matched single-agent baseline was measured.

The [subsequent input fix](../workflow/evidence/runtime-feasibility/java-input-resolution.md) was handled directly by the coordinator, reusing the earlier narrow research and test harness rather than launching new agents. First-party classes compiled in the browser resolved stdin/UTF-8/basic Scanner support; 31 Java cases and 11 boundary replays passed. A failed direct java-package compilation, a Wasm charset incompatibility, an emoji chunking bug and a Stop-output loss required repairs. One network assertion also needed correction because browser blob imports are local module loading. This illustrates the cost of compatibility assumptions and the value of keeping regression assertions mandatory. These follow-up runs are implementation testing, not a new independent review or a measured single-agent-versus-multi-agent comparison. Actual token/cost/cache measurements remain unavailable.

Selected raw assets total about 13.53 MB for Python and 6.72 MB for Java. Parent-byte caching reduced repeat preparation to under 1 ms in this local observation, but fresh worker/runtime setup still took seconds. Warm asset caching must not be presented as warm interpreter/compiler reuse or provider prompt caching. Fresh workers trade setup cost for state separation. Token/cost/internal reasoning usage and comparative agent-context/cache-hit measurements are unavailable, so no savings percentages are claimed. These observations are inputs for the team's eventual analysis, with Chromium/local-lab and memory/deployment limitations preserved.

## Follow-up: published practice tests and integration

The requester accepted stdin/stdout tests and a bounded local student preview. The [handoff contract](../workflow/PublishedPracticeTests.md) separates student comparison/execution from the teammate's publishing/auth/migration ownership; synthetic cases support progress without pretending that shared persistence exists. Implementation stayed with the coordinator and reused earlier specialist findings rather than spawning new agents. There is no new independent review or measured comparison of delegation strategies for this slice.

Website integration exposed a contract mismatch that standalone tests missed: Stop during preparation returned a result without an executionMs field, and the bridge validator rejected it, leaving the UI waiting. A consistent executionMs:null response and an outer teardown fallback fixed the issue. The first full website run reported 15 successes and one failed scenario; the corrected 16-test run passed with exit 0. This is evidence for testing the consumer/producer boundary together, rather than equating separate passing components with a working journey.

Java compilation originally counted toward execution time. Separating the execution-start event from preparation both changes feedback semantics and preserves a separate preparation watchdog. A malicious replayed event must not reset the budget; the extended boundary replay tests this explicitly. One local timing sample showed roughly 1,171 ms of sandbox lifetime but 0.4 ms in the program itself. These figures are a single synthetic observation, not a benchmark or evidence that Java is faster than Python. Recompiling Java per case remains an explicit resource trade-off in exchange for fresh state.

Sandboxed Windows web-server teardown stalled despite passing browser scenarios; manual owned-server sessions allowed the same suite to finish cleanly. The exact OS/sandbox cause is unproven. Those retries and setup costs are part of the workflow evidence, not hidden as a clean first attempt. Full runtime website cases remain opt-in because the reviewed runtime binaries are not redistributed in the repository; default CI therefore does not establish runtime acceptance. Token counts, internal reasoning percentages and cache-hit metrics remain unavailable.

## Individual reflections

### Member A: <name>

Contribution links, decisions, observed failures, measured findings, and lessons: pending.

### Member B: <name>

Contribution links, decisions, observed failures, measured findings, and lessons: pending.

## Evidence and limitations

Link actual experiments and verified session summaries. Separate observation from inference, record sample size and confounders, and state what the evidence cannot establish.
