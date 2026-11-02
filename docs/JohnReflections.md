# John’s reflections

## My scope and the evidence behind this draft

AI-assisted MP4 draft, prepared 2 November 2026. The requester identified their teammate as responsible for shared authentication, database migrations, assignment creation and the AI gateway. This draft uses that proposed allocation to discuss instructor/shared-service decisions. John must verify which changes he actually implemented or reviewed and revise the first-person conclusions; the allocation is not proof of authorship of every linked feature or experiment.

The main evidence is the [project brief](../workflow/ProjectBrief.md), [SoCLaaS model evaluation](../workflow/experiments/2026-11-01-soclaas-model-evaluation.md), [MVP evidence](../workflow/evidence/codementor-mvp/README.md), [role-aware AI specification](../openspec/changes/build-programming-platform/specs/role-aware-ai/spec.md) and [current security evidence map](../workflow/evidence/2026-11-02-security-testing.md). The MVP report is a historical snapshot; its statement that live evaluation was pending was later superseded by the dated model experiment.

## 1. Multi-Agent Software Engineering

### Development agents and product AI have different responsibilities

The product has student feedback and instructor rubric suggestions, but these model calls do not by themselves establish a multi-agent development process. Development coordination must show actual specialist triggers, context, allowed writes, handoffs and verification. The [runtime coordination record](../workflow/evidence/runtime-feasibility/coordination.md) provides that evidence through separate Java research, security-review and browser-testing executions; it does not prove that I personally coordinated them or that every AI/backend change used separate agents.

That experiment used a coordinator to integrate code while specialists returned bounded evidence. The security reviewer found state/budget weaknesses, and the independent tester found an output-limit reporting defect. Reports and replay resolved the findings. File ownership avoided simultaneous prototype edits. The finding-and-recheck chain is more useful than a list of planned specialist roles.

### How I would coordinate shared-service work

Shared schema, authentication, rubric contracts and the AI gateway can block student work if their interfaces keep changing. The [practice-test handoff](../workflow/PublishedPracticeTests.md) separates local student execution/comparison from authored-case persistence/publication. Synthetic fixtures let the student flow progress while making the missing production dependency explicit. They must not silently become real instructor data or official grading evidence.

For future shared-service tasks, I would assign one owner to a migration/contract and give implementers a verified input/output interface and failure behavior. Independent security review should examine role separation, grants, quota transactions and authority boundaries, with read-only review scope. These are proposed coordination improvements; the documentation does not establish an independent reviewer for every gateway change.

There is no continuous utilization trace, matched single-agent baseline or measured delegation saving. I cannot conclude that no agent was idle or that delegation was always cheaper. The useful result is that independent findings exposed defects; its cost includes repeated positive controls, research, handoffs and integration/replay.

## 2. Context Engineering in product AI

### Role separation is a data contract

Student feedback should help learning without revealing private grading criteria. Instructor evaluation needs the owned assignment's rubric and saved submission, but must remain advisory. The [context implementation](../src/features/codementor/context.ts) builds separate role messages, serializes source as untrusted data and scopes cache keys to identity/task/source/version/model. A comment impersonating a system instruction is still code content, not an authorized change to the task.

The [context tests](../src/features/codementor/context.test.ts) include 15 injection-shaped strings. They check message construction and isolation, not a model's actual obedience. The [review route tests](../src/lib/ai/review-route.test.ts) reject foreign origins, unauthenticated/wrong-role requests and client-supplied source/rubrics before review work. Server-loaded context is essential: trusting a client-selected rubric would defeat prompt separation before the provider is even called.

### The prompt and validator must agree

The model pilot exposed an instructor prompt that did not explicitly ask for validator-required `totalScore`. The corrected experiment added a failing prompt-contract regression and bumped instructor prompt version to `codementor-review-v2`, preserving the unchanged student version. This is a concrete context failure: a structured-output validator cannot repair a contradictory or underspecified prompt after the fact.

I would keep stable role rules and output contracts in fixed prompt builders, then retrieve only the owned task's authorized assignment/submission/rubric. The instructor context comparison adds broader authorized metadata; broader must not mean other users' data. More context should be justified by improved task quality, not by available context-window size.

### Development context also needs versioning

The [documentation audit](../logs/2026-11-02-user-guide-security-evidence.md) found obsolete preview statements mixed with newer implementation descriptions. A handoff should include the active contract, baseline commit, relevant files, migrations and actual test prerequisites, plus what remains uncertain. Repeating old conclusions without their date can create false confidence. A matched experiment on different handoff layouts has not been run, so the project has qualitative evidence of stale-context risk rather than a measured optimal context arrangement.

## 3. Resource-aware Use and model choice

### What the live comparison measured

The [1 November experiment](../workflow/experiments/2026-11-01-soclaas-model-evaluation.md) used three models and four synthetic Python cases each, with sequential calls, an 800-token output cap, a 30-second timeout and at most 12 completion requests per run. An initial 12-completion pilot was followed by a corrected 12-completion comparison. Later offline rescoring made no further provider calls.

| Corrected run | Accepted cases | Mean latency | Provider input/output tokens |
| --- | ---: | ---: | ---: |
| llama3.1:8b | 1/4 | 2,845 ms | 964 / 644 |
| qwen3.5:9b | 0/4 | 12,918 ms | 1,122 / 3,200 |
| qwen3-coder-next | 4/4 | 1,767 ms | 1,114 / 1,156 |

The token totals aggregate four trials per model, not one response. Acceptance requires output-schema and configured quality/security checks. `llama3.1:8b` had 3/4 schema-valid responses but only 1/4 accepted, showing why parseable JSON is insufficient. `qwen3.5:9b` returned empty content while reporting the output cap on every case. The selected model had the best observed acceptance and latency for this small task set; the data does not establish general superiority or comparative cost.

### Bound calls and distinguish estimates from usage

The gateway preflights prompt size and bounds completion output/time. Database reservations protect role quotas and the scoped response cache avoids repeated provider work for an unchanged authorized task. A context comparison can consume two uncached request slots. The [historical quota experiment](../workflow/evidence/codementor-mvp/README.md) records 12 concurrent local requests with five accepted and seven rejected at the configured cap. It is not a fresh hosted provider rate-limit test.

Application response caching, provider prompt caching and development-agent context caching are different mechanisms. A versioned application cache key is observable in code; provider cache-hit percentages and development cache-miss reductions were not measured. Catalog prices/provider limit fields were unavailable during model evaluation, so monetary savings and verified key-specific rate limits cannot be inferred. Internal reasoning-token percentages are also unavailable.

I would compare focused/broader contexts on the same authorized synthetic cases, recording provider usage separately from estimates, task quality, latency, cache state and failed/rejected calls. The [local context-size harness](../workflow/scripts/run-context-experiment.mjs) estimates input size without calling SoCLaaS; it cannot establish model quality or provider caching savings. A future matched context experiment must control for task, model, warmed application cache and prompt version rather than presenting a smaller prompt as an automatic improvement.

## 4. AI security and Spec-Driven Development (SDD)

### The model advises; authorized code decides

Untrusted source, assignment text and model output create injection and disclosure risks. Private rubrics and keys stay server-side; students access only their own submissions, while instructors access owned assignments. Models receive no tools or publication authority. Grade editing/publication is an explicit instructor action, independent of requesting suggestions. Correct language-model output would still be unsafe if delivered to the wrong student.

The [review service tests](../src/features/codementor/review-service.test.ts) cover ownership, malformed rubrics, context limits, cache use, quota failures and invalid/unavailable provider output. [Contract tests](../src/features/codementor/contracts.test.ts) check exact rubric criteria, score ranges, reconciled totals and unsafe markup. The [SoCLaaS client tests](../src/lib/ai/soclaas.test.ts) check bounded requests and sanitized diagnostics. These are concrete controls with stated scope, not a claim that prompt injection is solved.

### Turn an informal feature into observable invariants

“AI grading” is ambiguous unless the specification separates suggestions from published grades, states who supplies the rubric and defines unavailable/malformed/quota behavior. The role-aware specification and [engineering requirements](../openspec/changes/build-programming-platform/specs/engineering-and-delivery/spec.md) make security and evidence part of acceptance. A prompt change must keep its validator/cache versions consistent; a migration must preserve authorized reads and atomic writes.

The live comparison shows why quality/security assertions must complement schemas. Even a schema-valid evaluation can incorrectly describe a negative-input bug or imply excessive authority. The four-case synthetic result supports a bounded model choice, not grading validity, Java coverage or broad adversarial resistance. Human instructors must review the actual source before publishing.

## What I would improve and verify before submission

The [security evidence report](../workflow/evidence/2026-11-02-security-testing.md) records passing local/CI tests and prerequisite skips separately. The documentation branch CI passed 147 database assertions and 29 browser cases, with 45 browser skips. That cannot establish hosted sessions, email, both authenticated runner roles or live provider failure behavior. Preview build success also does not establish production acceptance.

Before submission, I need to verify which commits/decisions belong to my contribution, revise this generated analysis into my own reflection, and add any measured personal experiments. Remaining work includes verified deployment separation/migrations/recovery, live key-specific limits, Java feedback/adversarial coverage, independent review where missing and final member sign-off. Keeping those gaps visible is more defensible than treating documents or passing mocks as completion.
