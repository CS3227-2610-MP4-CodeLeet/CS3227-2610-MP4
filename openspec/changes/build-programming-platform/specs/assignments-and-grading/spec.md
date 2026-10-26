## ADDED Requirements

### Requirement: Owned assignments and private rubrics
The system SHALL let instructors manage owned assignments/rubrics and expose only published student-visible fields to students.

Student-visible assignment data SHALL include ID, title, instructions, language and publication status. Student list/detail access SHALL exclude unpublished assignments and private grading data.

#### Scenario: Student views assignment
- **WHEN** a student opens a published assignment
- **THEN** public instructions/criteria appear without private rubric or draft grading data

#### Scenario: Draft assignment requested directly
- **WHEN** a student requests a draft assignment by its ID through a route or database API
- **THEN** its private content is not returned

### Requirement: Immutable code revisions
The system SHALL accept bounded single-file Python or Java source as immutable revisions and associate grades/feedback with exact revisions. Resubmission SHALL preserve prior evaluated code.

Each revision SHALL associate assignment ID, authenticated student ID, source code, language, authoritative revision and timestamp. Student identity, revision and time SHALL be determined or verified server-side, and language SHALL match the published assignment. Successful creation SHALL return stored revision metadata that the student can read in their own history.

Submission requests SHALL accept only source_code, lowercase language (python or java) and UUID request_id. Source SHALL be nonblank valid Unicode without NUL, at most 32,768 UTF-8 bytes, and stored without normalization. The server and database SHALL enforce source bounds. Student routes SHALL implement the selected DTOs, pagination and stable JSON error envelope in student contract v1 of design.md; POST SHALL enforce same-origin requests and a 262,144-byte raw body limit.

#### Scenario: Resubmission
- **WHEN** an authorized student submits valid new source to an available assignment
- **THEN** a new revision is stored without overwriting prior revisions or their grades

#### Scenario: Successful first submission
- **WHEN** an authenticated student submits valid supported source to an available assignment
- **THEN** the system confirms a stored revision bound to that student with authoritative revision/time and makes it visible in their own history

#### Scenario: Forged submission identity or metadata
- **WHEN** a student supplies another student's ID or attempts to choose an authoritative revision or timestamp
- **THEN** the supplied values cannot create another student's submission or overwrite an existing revision

#### Scenario: Invalid or stale assignment submission
- **WHEN** source exceeds the agreed bound, its language mismatches the assignment or the assignment is no longer published
- **THEN** creation is rejected without storing a new revision

#### Scenario: Concurrent resubmission
- **WHEN** valid submissions arrive concurrently for the same student and assignment
- **THEN** distinct accepted submissions cannot overwrite prior source or share a revision number

#### Scenario: UTF-8 byte boundary
- **WHEN** otherwise valid source is exactly 32,768 UTF-8 bytes or exceeds that bound including multibyte characters
- **THEN** the exact-limit source is allowed and oversized source yields 413 SOURCE_TOO_LARGE without truncation or a stored revision

#### Scenario: Submission retry
- **WHEN** the authenticated student repeats a successfully committed request_id with identical assignment, source and language
- **THEN** the original own revision is returned with status 200 and no additional revision is stored

#### Scenario: Request ID reused with different source
- **WHEN** a request_id already used by that student for that assignment is sent with different source or language
- **THEN** the system returns 409 IDEMPOTENCY_CONFLICT without changing stored source

#### Scenario: Foreign-origin write
- **WHEN** a cookie-authenticated POST lacks the configured app Origin or supplies a foreign Origin
- **THEN** the system returns 403 INVALID_ORIGIN without creating a revision

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
