# Experiment: Context Strategy & Resource-Aware LLM Usage in CodeLeet

Status: Completed.

- Owner/date/commit/environment: Issue [#102](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/102), 2026-11-06, commit on branch `eval/102-context-and-resource-evidence`. Local Node.js 24.22.1, pnpm 12.15.0.
- Hypothesis and success criteria:
  - Focused (role-optimized) context will reduce serialized prompt token consumption by >= 15% compared to broader authorized context, eliminating extraneous database metadata while preserving essential assignment and rubric content.
  - Student context payloads will strictly omit private rubric criteria, and untrusted user source code will remain encapsulated within the user message without bleeding into system prompt instructions.
  - Preflight budget gates will enforce an 8,000-token ceiling offline, and scoped cache keys will ensure distinct entries across strategies, versions, and user identities.
- Safe baseline and alternative:
  - Alternative (Focused / Role-Optimized): Carries only role-authorized task instructions, published problem text, and submitted source code (for students), or assignment + rubric + submission (for instructors).
  - Safe Baseline (Broader Authorized Context): Carries all authorized assignment metadata (`createdAt`, `updatedAt`, `publicationStatus`, `courseId`) and submission metadata (`revision`, `submittedAt`). Crucially, does NOT include unauthorized peer or cross-course data.
- Synthetic fixtures and sample size: 8 representative test cases across Python and Java in [`workflow/experiments/context-strategy-cases.json`](context-strategy-cases.json), covering clean solutions, logic defects, and adversarial prompt injections.
- Model/runtime/version and prompt/context versions: `qwen3-coder-next`; student prompt: `codementor-review-v1`; instructor prompt: `codementor-review-v2`; broader context envelope: `broader-authorized-v1`.
- Controlled variables and order of runs: Identical code source, assignment requirements, and rubric criteria evaluated across both context strategies under deterministic test conditions.
- Time/token/call budget and stopping conditions: 8,000-token preflight ceiling; max 800 output tokens; 30-second timeout; offline deterministic benchmark evaluated in full without provider costs.
- Measurement source and unavailable metrics: Token estimator `ceil(UTF-8 bytes / 3)`; SHA-256 cache key collision testing; preflight budget validation. Provider prompt caching hits and internal reasoning tokens are unexposed by provider and remain marked unavailable. Runtime model generation quality is evaluated in the separate end-to-end and AI security suites, not claimed by this offline context size benchmark.

## Results Table

| Case ID | Role | Language | Focused Tokens | Broader Tokens | Delta | Broader Overhead | Focused Savings | Structural & Role Isolation Invariants |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| `student-python-clean` | Student | Python | 245 | 329 | +84 | +34.3% | 25.5% | Rubric criteria omitted; system prompt isolated |
| `student-python-defect` | Student | Python | 282 | 367 | +85 | +30.1% | 23.2% | Rubric criteria omitted; system prompt isolated |
| `student-python-injection` | Student | Python | 275 | 360 | +85 | +30.9% | 23.6% | Adversarial text in user JSON payload; 0 bleed to system |
| `student-java-clean` | Student | Java | 340 | 424 | +84 | +24.7% | 19.8% | Rubric criteria omitted; system prompt isolated |
| `student-java-defect` | Student | Java | 342 | 427 | +85 | +24.9% | 19.9% | Rubric criteria omitted; system prompt isolated |
| `instructor-python-evaluation` | Instructor | Python | 458 | 530 | +72 | +15.7% | 13.6% | Rubric criteria included; system role isolated |
| `instructor-python-injection` | Instructor | Python | 440 | 511 | +71 | +16.1% | 13.9% | Adversarial text in user JSON payload; 0 bleed to system |
| `instructor-java-evaluation` | Instructor | Java | 509 | 581 | +72 | +14.1% | 12.4% | Multi-criterion rubric included; system role isolated |

### Overall Aggregate

- **Total Focused Tokens**: 2,891 (mean: 361 tokens/request)
- **Total Broader Tokens**: 3,529 (mean: 441 tokens/request)
- **Mean Token Delta**: +80 tokens/request
- **Broader Context Overhead**: **+22.1%** relative to focused context baseline (`(3529 - 2891) / 2891`)
- **Focused Context Token Savings**: **18.1%** reduction against broader context baseline (`(3529 - 2891) / 3529`)
- **System Role Isolation**: 100% of untrusted source code and adversarial input strings are encapsulated in the user role JSON payload; system prompt integrity is verified with 0 bleed into system instructions.
- **Rubric Privacy**: 100% of student context payloads omitted private criteria and scoring descriptions.
- **Cache Key Scoping**: 100% of cache keys were distinct across context strategy, prompt version, rubric version, and requester identity.
- **Preflight Budget Enforcement**: Verified that all standard cases pass within the 8,000-token ceiling, while oversized payloads are rejected offline.

## Quota and Cache Economics

1. **Preflight Context Budgeting (Observed in Benchmark)**:
   - Evaluated offline preflight check `checkPreflightTokenBudget`: payloads exceeding the 8,000-token ceiling are rejected before network transmission.
   - Tested on synthetic oversized payload (>8,000 tokens): preflight rejection successfully triggered.
2. **Deterministic Caching & Atomic Quotas (Exercised in Production Suites)**:
   - Scoped cache lookups return stored responses on cache hit without invoking the model provider (0 provider tokens) or decrementing daily student quotas (0 slots consumed), verified in unit tests ([`src/features/codementor/review-service.test.ts`](../../src/features/codementor/review-service.test.ts)).
   - Atomic rate limits (5 daily reviews for students, 20 for instructors) are reserved via PostgreSQL advisory locks in `reserve_ai_request`, preventing concurrency race conditions, verified in database tests ([`supabase/tests/database/codementor_mvp.test.sql`](../../supabase/tests/database/codementor_mvp.test.sql)).

## Analysis

- **Findings**:
  1. Focused context achieves an **18.1% input token reduction** against the broader context baseline across Python and Java workloads (broader metadata introduces **+22.1% overhead**). In high-volume university cohorts with hundreds of student submissions, omitting extraneous metadata compounds into measurable operational savings.
  2. Broader database metadata (`createdAt`, `updatedAt`, `publicationStatus`, `revision`) increases token volume without modifying core pedagogical inputs. Offline structural evaluation confirms that focused context supplies all domain requirements (instructions, rubric, code) with tighter bounds.
  3. Structured JSON serialization ensures message-role separation: untrusted source code and potential prompt-injection strings remain strictly within the user role message, preserving system prompt immutability.
- **Limitations/Confounders**:
  - This benchmark evaluates prompt construction, token footprint, and structural invariants offline without dispatching live LLM generation calls. Model response quality and compliance are verified in separate end-to-end and Promptfoo security test suites.
  - Token counts are calculated using the project estimator `ceil(UTF-8 bytes / 3)`. Actual tokenizer counts on BPE/tiktoken models may vary slightly (~5–8%).
  - Live provider prompt-cache hit rates are unexposed by the SoCLaaS API and not measured here.
- **Decision and Follow-Up**:
  - Retain Focused Context as the production default for student feedback and instructor evaluation routes.
  - Retain Broader Authorized Context exclusively on the `/instructor/ai-context` transparency tool to allow educators to inspect context trade-offs.
