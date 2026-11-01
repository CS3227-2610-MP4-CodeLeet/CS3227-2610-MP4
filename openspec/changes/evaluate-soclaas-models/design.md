## Context

See `proposal.md` for motivation. The existing CodeMentor service already separates student and instructor prompts, scopes context to authorized records, validates JSON output, enforces server-side quotas, caches by identity and version, and records usage. The existing `run-context-experiment.mjs` measures synthetic prompt size only and makes no provider calls. The local checkout has server-only SoCLaaS configuration, while the official documentation host was not reachable during planning.

## Goals / Non-Goals

**Goals:** verify PDF sections 3–6 against the live repository; add reproducible provider-backed model evidence using synthetic inputs; select a configured example model only when results support that choice; close confirmed security test gaps.

**Non-Goals:** rebuilding existing AI features, using real student data, adding a second provider or model router, changing grading authority, or executing submitted source.

## Decisions

### Preserve the current application gateway

Use the existing SoCLaaS OpenAI-compatible chat-completions configuration and role-specific output validators. Alternatives were a second benchmark-only provider client (duplicate auth/protocol logic) or a new model-routing layer (outside MP4 scope). The evaluation harness will call SoCLaaS directly with synthetic cases and the same request/output limits as the product.

### Bound model discovery and experiments

Model IDs must come from the configured SoCLaaS model catalog or explicit operator arguments. Do not guess IDs. Keep the candidate and trial count capped, use synthetic data, timeout each request, and stop at the configured total-call budget. Record IDs, prompt version, latency and returned tokens, while redacting provider error bodies and all credentials.

### Select conservatively

Use fixed test cases for ordinary feedback, rubric scoring, and prompt-injection attempts. Validate structured outputs with the production schemas, then compare task-specific correctness and usefulness with an explicit rubric. Choose only among models that pass output and security checks; include resource and latency results. A small evaluation is evidence for a default, not proof of model safety.

### Keep context and access boundaries intact

Do not change the student/instructor context builders or authorized comparison baseline unless audit results prove a defect. Security cases must assert the student path receives no rubric and instructor paths require assignment ownership before the provider call. Existing PostgreSQL cache/quota behavior remains authoritative.

## Risks / Trade-offs

- A small synthetic suite may overfit to its cases -> report sample size, prompts, and limitations and retain deterministic pipeline tests.
- The provider catalog and limits may change -> discover candidates at run time and cap requests locally; cite current provider evidence when accessible.
- One unauthorized or sensitive fixture could reach SoCLaaS -> include only synthetic cases and fixed public test rubrics.
- Provider outages can prevent selection -> preserve a reproducible opt-in harness and explicitly leave selection pending rather than substituting mock results.

## Migration Plan

No database migration is expected. Keep AI disabled unless normal server-side settings enable it. The evaluation script is an explicit developer command and does not alter the running deployment configuration.
