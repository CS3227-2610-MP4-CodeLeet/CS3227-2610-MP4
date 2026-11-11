## Purpose

Provides a bounded and reproducible way to compare available SoCLaaS models on synthetic educational programming tasks and record an evidence-based model choice without sending real student data.

## ADDED Requirements

### Requirement: Model evaluation uses bounded synthetic cases
The evaluation SHALL use only synthetic assignment, rubric, submission, and adversarial content. It SHALL compare explicitly selected models through the configured SoCLaaS endpoint, impose a fixed request and timeout budget, validate every response against the product's role-specific output schema, and record failures without exposing credentials or raw provider diagnostics.

#### Scenario: Evaluation runs with explicit candidate models
- **WHEN** an operator runs the opt-in evaluation with one or more candidate model IDs
- **THEN** each model is tested against the same versioned synthetic cases and the report records its ID, response validity, quality/security assessment, latency, and token usage when returned by SoCLaaS

#### Scenario: Evaluation exceeds its request budget
- **WHEN** the configured request, timeout, or candidate limit is reached
- **THEN** the harness stops issuing provider requests and records incomplete trials without exceeding the configured bound

#### Scenario: Provider returns invalid or unsafe output
- **WHEN** a model response is malformed, violates the expected schema, or follows an untrusted source-code instruction
- **THEN** that trial is marked failed and cannot be counted as a successful result

#### Scenario: Evaluation credentials are missing
- **WHEN** the provider is disabled or the server-only SoCLaaS configuration is incomplete
- **THEN** the evaluation exits with a clear configuration status and prints no credential values

### Requirement: Model selection is supported by measured evidence
The selected default model SHALL be supported by the recorded evaluation results across output validity, task quality, adversarial behavior, latency, and provider-reported resource use. The report SHALL distinguish provider measurements from local estimates, identify unavailable measurements, and state the sample size and limitations.

#### Scenario: A model is selected after evaluation
- **WHEN** one candidate satisfies the required output and security checks and compares favorably on task quality and resource use
- **THEN** the report records the measured basis for the choice and the configured example model matches the selected candidate

#### Scenario: No candidate meets the criteria
- **WHEN** no tested candidate satisfies the evaluation criteria or live provider testing cannot be completed
- **THEN** no model is described as experimentally selected and the report records the unresolved decision and the next required evidence
