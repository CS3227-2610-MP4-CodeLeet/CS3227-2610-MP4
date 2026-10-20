## ADDED Requirements

### Requirement: Owned assignments and private rubrics
The system SHALL let instructors manage owned assignments/rubrics and expose only published student-visible fields to students.

#### Scenario: Student views assignment
- **WHEN** a student opens a published assignment
- **THEN** public instructions/criteria appear without private rubric or draft grading data

### Requirement: Immutable code revisions
The system SHALL accept bounded single-file Python or Java source as immutable revisions and associate grades/feedback with exact revisions. Resubmission SHALL preserve prior evaluated code.

#### Scenario: Resubmission
- **WHEN** an authorized student submits valid new source to an available assignment
- **THEN** a new revision is stored without overwriting prior revisions or their grades

### Requirement: Explicit version-checked publication
The system SHALL require the authorized instructor to approve and publish grades. Draft grades SHALL remain private, stale writes SHALL be rejected and AI SHALL NOT publish grades.

#### Scenario: Approved publication
- **WHEN** the owner publishes a valid grade against the expected grade/submission version
- **THEN** it becomes visible to the student and XP adjustment commits atomically

#### Scenario: Forged browser result
- **WHEN** a student submits fabricated run success or scores
- **THEN** it does not determine official grades or XP

#### Scenario: Stale publication
- **WHEN** a publication request uses an outdated grade version
- **THEN** it is rejected without altering published grades or XP
