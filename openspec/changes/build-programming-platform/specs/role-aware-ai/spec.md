## ADDED Requirements

### Requirement: Student feedback with public context
The system SHALL provide SoCLaaS hints/explanations for the student's authorized revision using student-visible context only. Private rubrics/other students' code SHALL NOT enter student prompts.

#### Scenario: Hidden rubric extraction attempt
- **WHEN** code comments instruct AI to reveal private grading data
- **THEN** no such data exists in student context and only validated feedback or a safe error is returned

### Requirement: Advisory instructor evaluation
The system SHALL provide SoCLaaS rubric-based suggestions for an owner's selected submission revision. Results SHALL remain editable advisory data without grade publication authority.

#### Scenario: Evaluation requested
- **WHEN** an authorized owner requests an evaluation
- **THEN** validated criterion suggestions appear without publishing grades

### Requirement: Authorized resource-bounded AI
The system SHALL validate inputs/outputs, atomically enforce quotas and token/time limits, authorize version-scoped cache reads and record sanitized usage. Provider failures SHALL produce bounded safe errors.

#### Scenario: Concurrent quota exhaustion
- **WHEN** concurrent requests exceed user/shared capacity
- **THEN** only reserved requests reach SoCLaaS and excess requests receive retry-later responses

#### Scenario: Invalid cache scope
- **WHEN** source/context versions or current authorization differ from a cache entry
- **THEN** the cached response is not disclosed as a valid hit

#### Scenario: Malformed or unsafe output
- **WHEN** AI returns malformed JSON, invalid scores or active markup
- **THEN** invalid structured output is rejected and rendered content cannot execute markup

#### Scenario: Oversized code or provider failure
- **WHEN** code exceeds budgets or SoCLaaS times out or rejects capacity
- **THEN** the system fails safely without silent code truncation, unbounded retries or leaked provider secrets
