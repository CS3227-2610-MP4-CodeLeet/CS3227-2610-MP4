## Purpose

Supports the full assignment workflow from instructor-owned Python problems through student submissions, revision history, instructor grading, and explicit publication.

## ADDED Requirements

### Requirement: Instructors manage owned assignments and private rubrics
An instructor SHALL create and edit only assignments they own. Assignment data SHALL distinguish student-visible instructions and learning objectives from private grading rubrics. An instructor SHALL be able to keep work in draft or publish it to the shared assignment collection.

#### Scenario: Instructor creates a draft assignment
- **WHEN** an instructor submits a valid Python assignment and rubric
- **THEN** the assignment is saved as a draft owned by that instructor

#### Scenario: Instructor edits an owned assignment
- **WHEN** an instructor edits an assignment they own
- **THEN** the assignment and its version are updated without exposing the private rubric to students

#### Scenario: Instructor edits another instructor's assignment
- **WHEN** an instructor requests an update to an assignment they do not own
- **THEN** the request is denied and the assignment is unchanged

### Requirement: Students browse only published public assignment data
Students SHALL list and view only published assignments. Student-visible data SHALL contain the title, instructions, Python language, public learning objectives, and public criteria, but SHALL exclude private rubrics, draft content, hidden solutions, and internal notes.

#### Scenario: Student lists assignments
- **WHEN** a signed-in student opens the assignment list
- **THEN** only published assignments and student-visible fields are returned

#### Scenario: Student requests a draft assignment directly
- **WHEN** a student requests a draft assignment by identifier
- **THEN** the application returns no draft content

#### Scenario: Student requests private rubric fields
- **WHEN** a student requests an assignment's private grading rubric through an application or database interface
- **THEN** no rubric data is returned

### Requirement: Students submit bounded Python source as immutable revisions
The system SHALL accept text-only Python source of at most 8,000 Unicode characters for a published Python assignment. It SHALL store each accepted submission as an immutable, server-attributed revision. Resubmission SHALL create a new revision while preserving prior source and its associated reviews and grades.

#### Scenario: Student submits valid source
- **WHEN** an authenticated student submits nonblank source within the limit to a published assignment
- **THEN** the system stores a revision associated with that student and assignment and returns its authoritative identifier and revision metadata

#### Scenario: Student submits oversized source
- **WHEN** the source exceeds 8,000 Unicode characters
- **THEN** the request is rejected before storage and the submitted text is not truncated

#### Scenario: Student submits to an unavailable assignment
- **WHEN** a student submits to a draft, unpublished, missing, or non-Python assignment
- **THEN** no submission is stored

#### Scenario: Student resubmits source
- **WHEN** a student submits new source for an assignment with an existing submission
- **THEN** a new revision is created and prior revisions remain unchanged

#### Scenario: Student forges identity or revision metadata
- **WHEN** a submission request includes a different student identity, revision, or timestamp
- **THEN** the system ignores or rejects forged metadata and uses authenticated/server-derived values

### Requirement: Submission access follows student ownership and instructor assignment ownership
Students SHALL read only their own submissions. Instructors SHALL read submissions only for assignments they own. Submission source and private grading data SHALL not appear in another user's responses.

#### Scenario: Student reads own submission
- **WHEN** a student requests one of their own submission revisions
- **THEN** the source and authorized student-facing feedback are returned

#### Scenario: Student reads another student's submission
- **WHEN** a student requests another student's submission identifier
- **THEN** access is denied without disclosing source or existence-sensitive private fields

#### Scenario: Instructor reads assigned submissions
- **WHEN** an instructor requests submissions for an assignment they own
- **THEN** the authorized submissions and grading data are returned

#### Scenario: Instructor reads unrelated submissions
- **WHEN** an instructor requests submissions for an assignment they do not own
- **THEN** access is denied

### Requirement: Official grades require instructor approval and explicit publication
AI suggestions SHALL never publish grades. An assignment owner SHALL be able to edit a draft grade and explicitly publish it. Students SHALL see only grades for their own submissions after publication.

#### Scenario: Instructor edits an advisory evaluation
- **WHEN** an assignment owner reviews an AI evaluation
- **THEN** the instructor can edit criterion scores and feedback before saving or publishing

#### Scenario: Instructor publishes a grade
- **WHEN** an assignment owner explicitly publishes a valid grade for a submission they can access
- **THEN** the approved grade becomes visible to that student

#### Scenario: Student requests an unpublished grade
- **WHEN** a student requests a draft grade or instructor evaluation
- **THEN** no draft score, rubric, or instructor-only rationale is returned

#### Scenario: AI evaluation completes
- **WHEN** an instructor AI evaluation is generated
- **THEN** it remains advisory and does not change the published grade state
