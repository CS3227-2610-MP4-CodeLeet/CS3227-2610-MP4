## Purpose

Makes AI context selection, request budgets, cache reuse, daily quotas, and actual usage visible and enforceable for both role-specific review workflows.

## ADDED Requirements

### Requirement: AI context is role-specific, measured, and budgeted
Each AI workflow SHALL include only fields authorized for its role and relevant to its task. Before a provider call, the system SHALL estimate the serialized context size and reject an over-budget request rather than silently truncating submitted code. The system SHALL distinguish estimated token counts from provider-reported usage.

#### Scenario: Student context is built
- **WHEN** a student review request is prepared
- **THEN** the context includes the published problem, student-visible criteria, and that student's source, and excludes private rubric and unrelated records

#### Scenario: Instructor context is built
- **WHEN** an owner-authorized instructor evaluation is prepared
- **THEN** the context includes the assignment rubric and selected submission while excluding unrelated assignments and other students' submissions

#### Scenario: Context exceeds the budget
- **WHEN** serialized role-authorized context exceeds the configured input budget
- **THEN** the system rejects it before a provider call and preserves the full source without silent truncation

### Requirement: Daily AI quotas are enforced atomically
The system SHALL enforce, per authenticated user and UTC calendar day, a maximum of 5 student feedback requests and 20 instructor evaluation requests. Concurrent requests SHALL NOT exceed the applicable limit. Failed provider or validation requests SHALL be recorded but SHALL NOT permanently consume a successful-request quota slot.

#### Scenario: Request reaches the daily limit
- **WHEN** a user has completed the maximum requests for that role and day
- **THEN** another request is rejected before a provider call with a safe rate-limit response

#### Scenario: Concurrent requests contend for the final quota slot
- **WHEN** multiple requests concurrently attempt to use the final available slot
- **THEN** no more than the remaining allowance is accepted for provider execution

#### Scenario: A reserved provider request fails
- **WHEN** a provider request fails or times out after reservation
- **THEN** the failure is logged and the slot is released or otherwise excluded from the successful-request count

### Requirement: Cached reviews are deterministic and authorization-scoped
The system SHALL reuse a successful review only when its task type, authenticated cache scope, assignment version, applicable rubric version, exact submission source, prompt version, and model identifier match. Cache reads SHALL independently enforce current ownership and role authorization.

#### Scenario: Identical authorized request is repeated
- **WHEN** a user repeats a successful request with the same authorized inputs and versions
- **THEN** the system returns the cached validated result, records a cache hit, and avoids a provider call

#### Scenario: Input or version changes
- **WHEN** source, assignment version, rubric version, role/task, prompt version, or model differs
- **THEN** the prior result is not returned as a valid cache hit

#### Scenario: Another user requests a cache entry
- **WHEN** a user attempts to access a review cached for a different authorization scope
- **THEN** the cache entry is not disclosed

### Requirement: AI usage records provide truthful resource evidence
Every AI attempt SHALL record its authenticated user, task, completion/error status, cache-hit status, latency, and input/output token counts when available. Records SHALL identify whether counts are provider-reported or estimated and SHALL not store API keys or raw provider diagnostics. Users SHALL view only their own usage records.

#### Scenario: Provider reports token usage
- **WHEN** a provider response contains usage data
- **THEN** the matching record stores those reported input and output counts

#### Scenario: Provider omits token usage
- **WHEN** a provider response omits usage data
- **THEN** any local estimate is marked as estimated rather than reported as actual

#### Scenario: User views usage history
- **WHEN** a student or instructor opens the usage view
- **THEN** only that user's records and derived metrics are returned

### Requirement: Context comparison uses only authorized information
An instructor SHALL be able to compare a broader but still authorized context with the optimized role-aware context and view measured token estimates and the responses' quality-evaluation fields. The comparison SHALL NOT send other students' work or data that the instructor is not authorized to read.

#### Scenario: Instructor compares context strategies
- **WHEN** an authorized instructor runs the context comparison for an owned assignment/submission
- **THEN** both strategies use only data that instructor can access and display their measured input size and evaluation outcome

#### Scenario: Comparison is requested by a student
- **WHEN** a student requests the instructor context comparison
- **THEN** access is denied and no private context is returned
