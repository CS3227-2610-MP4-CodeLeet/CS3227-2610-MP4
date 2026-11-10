## ADDED Requirements

### Requirement: Student feedback with public context
The system SHALL provide SoCLaaS hints/explanations for the student's authorized revision using student-visible context only. Private rubrics/other students' code SHALL NOT enter student prompts.

#### Scenario: Hidden rubric extraction attempt
- **WHEN** code comments instruct AI to reveal private grading data
- **THEN** no such data exists in student context and only validated feedback or a safe error is returned

### Requirement: Advisory instructor evaluation
The system SHALL provide SoCLaaS rubric-based suggestions for an authorized instructor member's selected submission revision in a course where AI is enabled. Results SHALL remain editable advisory data without grade publication authority.

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

### Requirement: Server-authorized AI usage completion
Only the server that reserved an in-flight provider request SHALL be able to finalize that reservation. A caller SHALL NOT release a pending reservation or alter usage accounting by supplying a success/failure value through a public database interface. Cached results SHALL be returned only when current authorization is valid and the cache-use accounting succeeds.

#### Scenario: Client attempts to finish an in-flight request
- **WHEN** an authenticated client calls a public completion interface for its own pending AI usage
- **THEN** the request is denied and the pending reservation remains counted

#### Scenario: Server finalizes its reservation
- **WHEN** the server finalizes a provider request using its reservation capability
- **THEN** usage accounting changes once and rejects a missing, mismatched or replayed capability

### Requirement: Server-owned AI review and cache-hit records
Generated AI reviews and cache-hit usage records SHALL be written only by the server after checking the current requester, submission, course role and cached review identity. Authenticated clients SHALL NOT directly insert AI reviews or record cache hits with arbitrary token counts.

#### Scenario: Client forges a review or cache hit
- **WHEN** a signed-in client directly inserts a review or calls cache-hit accounting
- **THEN** database permissions deny the write; the server records a cache hit only for an existing matching review and currently authorized requester

#### Scenario: Instructor role has been removed
- **WHEN** a former instructor requests their own prior instructor evaluation after losing course membership
- **THEN** instructor-only evaluation data is not returned, while authorized student feedback history remains available
