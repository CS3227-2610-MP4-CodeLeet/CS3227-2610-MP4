## Purpose

Delivers separate educational feedback for students and rubric-based evaluation assistance for instructors without giving the model access beyond the caller's authorization or authority to publish grades.

## ADDED Requirements

### Requirement: Student feedback uses only student-authorized context
The student feedback feature SHALL analyze the authenticated student's selected submission using its published assignment instructions, public learning objectives, public review criteria, and submitted source. It SHALL NOT retrieve or include private rubrics, hidden solutions, or other students' submissions in the student context.

#### Scenario: Student requests feedback for own submission
- **WHEN** an authenticated student requests feedback for one of their submission revisions
- **THEN** the system returns validated educational findings, explanations, hints, and next steps based on student-visible context

#### Scenario: Student requests feedback for another student's submission
- **WHEN** a student supplies another student's submission identifier
- **THEN** the request is denied before any provider call or private-context retrieval

#### Scenario: Source contains an instruction override
- **WHEN** submitted comments ask the model to ignore its task, reveal private grading data, or award full marks
- **THEN** source is treated as data for analysis and the student response contains no private rubric or hidden solution

#### Scenario: Student asks for a complete solution
- **WHEN** the submitted source or request asks the assistant to provide a full corrected solution
- **THEN** feedback remains learning-oriented and provides bounded hints rather than a complete replacement program

### Requirement: Instructor evaluation uses owner-authorized rubric context
The instructor evaluation feature SHALL analyze an authorized submission revision with its assignment instructions and private rubric. It SHALL return criterion-level suggested scores and rationale as editable advice, not an authoritative grade.

#### Scenario: Instructor evaluates an owned submission
- **WHEN** an instructor requests evaluation of a submission for an assignment they own
- **THEN** the system returns validated suggestions for the rubric criteria without publishing a grade

#### Scenario: Instructor evaluates an unrelated submission
- **WHEN** an instructor requests evaluation of a submission for an assignment they do not own
- **THEN** the request is denied before any provider call or rubric retrieval

#### Scenario: Student requests instructor evaluation
- **WHEN** a student calls the instructor evaluation operation
- **THEN** the request is denied without exposing rubric or evaluation data

### Requirement: AI output is bounded, validated, and rendered as text
Model responses SHALL be validated against role-specific schemas and assignment constraints before storage or display. Invalid, oversized, malformed, or unsafe responses SHALL fail safely. User content and provider output SHALL be rendered as text and SHALL NOT execute markup or scripts. The model SHALL receive no tools or authority to change application data.

#### Scenario: Model returns malformed structured data
- **WHEN** a provider response fails schema, score-range, criterion, or output-size validation
- **THEN** the response is rejected, a sanitized failure is recorded, and no grade is published

#### Scenario: Model output contains active markup
- **WHEN** feedback includes HTML or script-like content
- **THEN** the content is displayed as inert text or safely sanitized content with no executable markup

#### Scenario: Provider is unavailable or times out
- **WHEN** the configured model service is disabled, unavailable, or exceeds the request timeout
- **THEN** the user receives a bounded safe error and no secret, raw provider diagnostic, or partial grade is disclosed
