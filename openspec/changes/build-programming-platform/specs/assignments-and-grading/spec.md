## ADDED Requirements

### Requirement: Focused student assignment layout
The student sidebar and Menu SHALL contain only the Assignments navigation entry, with nonshrinking padded CodeLeet branding. Assignment discovery SHALL remain in the main list. For an enabled local runner, the real assignment page SHALL order instructions, source editor, Run code, Run & test input/output, test cases and their action, Submit revision/status, then Your revisions. Run/test actions SHALL remain non-submitting buttons, and changes to layout SHALL preserve source, saving and execution behavior.

#### Scenario: Navigate and work on an assignment
- **WHEN** a student opens an assignment on desktop or uses Menu on mobile
- **THEN** navigation offers Assignments without duplicated published-assignment shortcuts, the problem precedes source, and submission/history follow practice results

### Requirement: Real assignment language and immutable revision language
The authenticated assignment workflow SHALL accept Python or Java, defaulting omitted assignment language to Python for existing callers. Instructor creation/editing SHALL expose this choice. Every stored revision SHALL derive its language from the assignment on the server and retain that language with its source. The real editor, browser runner, revision views and AI context SHALL use the validated stored language. Unsupported assignment languages and client-supplied submission language fields SHALL be rejected. This integration retains the authenticated MVP's 8,000-character source bound and 201 response for successful or identical retried submissions; the earlier 32 KiB preview contract is separate.

#### Scenario: Both real languages
- **WHEN** an instructor publishes a Python or Java assignment and a student runs and submits its source
- **THEN** execution stays in the browser and saved revisions record the assignment language, with prior revisions unchanged

#### Scenario: Language change after submission
- **WHEN** an instructor attempts to change the language of an assignment with submissions
- **THEN** the database rejects the whole save without changing assignment or rubric versions

#### Scenario: Private language revisions
- **WHEN** another student or unrelated instructor requests a saved revision
- **THEN** its source and language remain inaccessible and private rubrics/unpublished grades remain hidden

### Requirement: Readable source editor
Student source entry SHALL show syntax colours appropriate to the assignment language and line numbers synchronized with vertical scrolling. Horizontal scrolling SHALL remain inside the editor. Theme changes and highlighting SHALL preserve source, input validation and submission behavior. Source tokens SHALL be rendered as text, never trusted HTML or executed code. Forced-colors mode SHALL preserve readable native input text.

#### Scenario: Python and Java source entry
- **WHEN** the student types supported Python or Java syntax
- **THEN** the editor colours tokens, updates line numbers and keeps the original editable source

#### Scenario: Theme and scroll changes
- **WHEN** the student switches theme or scrolls a long source document
- **THEN** the syntax colours follow the theme and the gutter/highlight stay aligned with the input without widening the page

### Requirement: Keyboard indentation
The shared source editor SHALL support four-space Tab indentation, selected-block indentation and Shift+Tab unindentation. Enter SHALL preserve leading whitespace and add a level after Python block colons or opening delimiters outside strings/comments. Enter between matching brackets SHALL place the caret on an indented blank line, and a Java closing brace on an indented blank line SHALL remove one level. Editing SHALL preserve source outside the change and enforce the existing textarea character limit without truncation. Escape then Tab SHALL allow normal focus movement; composition and modifier shortcuts SHALL remain native. Native undo SHALL work in the verified Chromium editing path.

#### Scenario: Selected block
- **WHEN** a student selects several code lines and presses Tab then Shift+Tab
- **THEN** indentation changes and is restored while the selected code content stays intact

#### Scenario: Keyboard focus exit
- **WHEN** a student presses Escape then Tab in the editor
- **THEN** keyboard focus moves to the next focusable control

#### Scenario: Source at the character limit
- **WHEN** an indentation edit would exceed the existing source character limit
- **THEN** the edit is blocked without truncating or submitting source

### Requirement: Isolated development fixture preview
Before shared-service integration, synthetic assignment list/detail previews SHALL be available only when NODE_ENV is development and the server-only STUDENT_PREVIEW_ENABLED flag is true. Fixture data SHALL NOT provide a production fallback or establish authenticated feature acceptance. Instructions SHALL render as plain text, and drafts SHALL be omitted from list and direct detail reads.

#### Scenario: Preview flag enabled in production
- **WHEN** production runs with STUDENT_PREVIEW_ENABLED set to true
- **THEN** preview pages remain unavailable without disclosing synthetic assignments

#### Scenario: Sample browsing and state recovery
- **WHEN** an enabled local preview displays published samples or an empty/loading/error scenario
- **THEN** students can read Python/Java sample instructions, observe the appropriate state and recover through assignment navigation without any submission or authentication being simulated

### Requirement: Local source entry preview
The opted-in development preview SHALL provide a labeled code-entry textarea with the assignment's fixed Python/Java language, UTF-8 byte counter and local input validation. It SHALL retain source on validation errors, reject blank, invalid Unicode, NUL and source above 32,768 UTF-8 bytes without truncation, and render source as plain text. Check code SHALL NOT execute or transmit source. An additional opt-in local runner preview MAY pass source through a validated browser message bridge for local execution/published practice tests; source SHALL NOT be sent to a server or persisted. Submit code SHALL remain disabled until authenticated integration exists.

#### Scenario: Local validation failure
- **WHEN** a tester checks blank or oversized source in the enabled preview
- **THEN** an associated error is displayed, the editor retains its value and submission remains unavailable

#### Scenario: Valid local source
- **WHEN** a tester checks otherwise valid Python or Java source at or below the byte limit
- **THEN** local validity is shown without a saved/submitted claim or network transfer of the source

#### Scenario: Different assignment opened
- **WHEN** a tester enters code for one assignment and opens a different assignment
- **THEN** the new assignment shows its own language and does not inherit the first assignment's editor contents

### Requirement: Responsive student workspace
The development preview SHALL present compact published-assignment rows, working student navigation, and assignment instructions above the code editor and run/results area. Desktop navigation SHALL adapt to a keyboard-accessible compact mobile menu without page-level horizontal overflow. The UI SHALL not fabricate student profiles, XP, grades, due dates or submission progress.

#### Scenario: Read and attempt a problem
- **WHEN** a tester opens a published sample assignment on desktop or mobile
- **THEN** the problem title/instructions precede the editor and run controls, and navigation back to assignments remains available

#### Scenario: Review practice results
- **WHEN** public cases finish
- **THEN** the UI shows a practice pass count and per-case outcomes, with expandable input/expected/actual output and diagnostics rendered as text

#### Scenario: Switch workspace theme
- **WHEN** a tester uses the keyboard-accessible light/dark button on desktop or mobile
- **THEN** the workspace, editor, input and results change appearance without clearing source or active run state
- **AND** the selection persists locally across navigation/reloads when browser storage is available, otherwise the toggle still works for the current session

#### Scenario: Initial theme preference
- **WHEN** the browser has no valid saved theme
- **THEN** the hydrated workspace follows the device color preference without changing the public home page or persisting student source

#### Scenario: Compact workspace controls
- **WHEN** a tester opens a sample assignment on desktop or mobile
- **THEN** Menu is visible with the theme action immediately to its right at the far edge of the top bar
- **AND** the practice toolbar has no visible Stop button while automatic deadlines and leaving-page cleanup remain active

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
