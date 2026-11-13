# assignments-and-grading Specification

## Purpose

Define course assignment authoring, immutable student revisions, private grading and explicit instructor publication.

## Requirements

### Requirement: Published grade authorization and historical rubric context
Published-grade RPC reads SHALL require the current verified, provisioned account to own the submission and retain student membership and assessment read access in its course. A privileged RPC SHALL enforce the same boundary as direct table reads. Intentionally published criterion snapshots SHALL remain visible to authorized students; a missing snapshot SHALL never be replaced with current private rubric text.

#### Scenario: Membership or assessment access removed
- **WHEN** a former student, changed course role, unverified or deprovisioned account invokes the grade RPC directly, or active-course assessments are disabled
- **THEN** no published-grade data is returned
- **AND** an authorized student in an archived course retains the permitted historical read

#### Scenario: Legacy publication without a rubric snapshot
- **WHEN** a published grade lacks its original rubric snapshot
- **THEN** its stored total, feedback and criterion scores remain available with neutral criterion labels and unknown maxima, without revealing subsequent private rubric edits

### Requirement: Private student progress overview
The system SHALL provide a student course member with My progress showing exact published-assignment totals, own course XP, up to five deadlines, recent own revisions and grades. Submitted means at least one saved revision, not passing tests or receiving a grade.

#### Scenario: Exact counts and upcoming work
- **WHEN** a student selects a course with multiple revisions, more assignments than a REST page, hidden assignments, undated work or late submissions
- **THEN** each visible published assignment counts once; outstanding has no own revision, overdue is outstanding with deadline strictly before server time, and upcoming includes outstanding deadlines at or after that time ordered by deadline then ID
- **AND** local drafts/runs do not count, late submissions count as submitted, hidden assignments leave current totals and an empty collection shows no invented completion percentage

#### Scenario: Private bounded activity
- **WHEN** a verified student opens the overview for an enrolled course or supplies forged identity parameters
- **THEN** only their own recent metadata and published grades from that course appear in stable timestamp/ID order; no other course, peer records, source code, rubric or unpublished-grade content is retrieved, and signed-out, non-member or instructor access is denied

#### Scenario: Independent failure and accessible navigation
- **WHEN** a section is unavailable, empty or loading on desktop/mobile in either theme
- **THEN** healthy enabled sections remain visible, disabled course features are not queried or displayed, failure is distinct from zero, a retry shows pending feedback, and all My progress links preserve the selected course when opening assignment/submission/grade/XP pages without changing the assignment landing page

### Requirement: Browser draft recovery
The student editor SHALL preserve unfinished source on the same browser/device with explicit recovery and account/context isolation.

#### Scenario: Return to unfinished code
- **WHEN** a student edits a real Python or Java assignment and returns after a refresh or tab close
- **THEN** a valid local draft saved after 500 ms is offered through Restore draft or Discard draft before editing; records are scoped to verified student, assignment, language and starting revision, retained for seven days with at most ten contexts, and limited to valid source up to 8,000 characters and 32 KiB UTF-8 including blank drafts

#### Scenario: Official submission and concurrent edits
- **WHEN** a revision submission succeeds, fails or overlaps newer editor changes
- **THEN** autosave never creates an official revision, grade or XP; failed saves preserve source and exact successful-source acknowledgement removes only the submitted draft while preserving newer edits and other contexts

#### Scenario: Shared browser and conflicting tabs
- **WHEN** sign-out succeeds, the authenticated account changes, or another tab changes this draft
- **THEN** sign-out clears app draft records and invalidates active writers, account loss prevents old-account writes, and conflicting tabs require an explicit keep/load choice without silently replacing visible source; storage or browser API failures leave Run/Submit and navigation protection usable

### Requirement: Assignment-form test case authoring
Verified course instructors SHALL manage up to 25 ordered public/private stdin/expected-stdout cases in the assignment create/edit form. There SHALL be no separate test editor or independent test publication write endpoint/RPC.

#### Scenario: Required case constraints
- **WHEN** an instructor saves assignment cases
- **THEN** names SHALL be nonblank and at most 120 Unicode code points after trimming; case UUIDs SHALL be distinct. Input/output SHALL preserve literal whitespace and be valid text without NUL, bounded to 4,096/8,192 UTF-8 bytes. Empty input/output SHALL be valid. The combined public/private count SHALL NOT exceed 25.

Assignment saving SHALL atomically persist the instructor case set and, when saving with Published status, replace its public projection with only public cases. Marking all cases private or removing all cases SHALL clear that projection. Removing a case SHALL remove it from the saved instructor set. Saving a Draft assignment SHALL NOT expose its cases to students. Existing case data SHALL be preserved on rollout; there SHALL be no automatic publication of unsaved or previously private edits.

Writes SHALL use the assignment's expected version, verified instructor course access and bounded same-origin JSON. Stale saves SHALL reject atomically without replacing cases. Direct client table writes SHALL remain denied. Student reads SHALL return only the public projection for a published assignment; instructor submission review SHALL retain access to all current saved cases including private ones. API read failure SHALL remain distinct from an empty set. Browser runs SHALL NOT create official results, grades or XP.

#### Scenario: Immediate visibility change
- **WHEN** an instructor saves a Published assignment after changing a public case to private
- **THEN** students no longer receive that case, while instructors retain it for submission review

#### Scenario: Removal and clearing
- **WHEN** an instructor removes cases and saves a Published assignment
- **THEN** the cases disappear from both the saved instructor set and student projection
- **AND** an empty or entirely private set returns zero public cases without hiding the assignment

#### Scenario: Conflicting author edits
- **WHEN** two assignment updates use the same expected assignment version
- **THEN** only one succeeds and the other receives a conflict without replacing its typed form or saved cases

#### Scenario: Retired authoring surface
- **WHEN** a user requests the former dedicated Practice tests page or its independent PATCH API
- **THEN** the page is unavailable and the API provides no independent publication mutation

### Requirement: Optional deadlines and submission timing
Instructors SHALL be able to create, edit and clear optional assignment due dates, entered/displayed in Singapore time and stored as finite timestamp-with-time-zone instants.

#### Scenario: Required constraints for optional deadlines and submission timing
- **WHEN** this capability is used
- **THEN** Existing assignments SHALL retain no deadline. Students SHALL see current due dates and own latest-revision status: Not submitted, Overdue when past due without a save, Submitted or Submitted late. Revision history/detail and authorized instructor views SHALL display captured submission timing. Status MAY update on load/refresh/save without polling.

Late submissions SHALL remain accepted without an automatic grade penalty. The database SHALL stamp each new revision's actual creation time, capture the current deadline under the assignment lock and determine lateness with a strict later-than comparison. Exactly at the deadline SHALL be on time. Existing revisions and identical request retries SHALL keep their original timing metadata after deadline edits/removal. Direct client timing/identity claims SHALL NOT control saving or grades. Omitted deadline updates SHALL preserve the current value; explicit null SHALL clear it. Existing ownership, RLS, optimistic version/language guards, immutable source and published-grade/private-rubric boundaries SHALL remain enforced.

#### Scenario: Author a deadline and submit in either language
- **WHEN** an instructor sets a deadline and a student saves Python or Java source before or after it
- **THEN** the current due date/status is shown, both saves succeed, and each new revision receives database-owned on-time/late metadata without a grade penalty

#### Scenario: Deadline updates and retries
- **WHEN** an instructor changes/removes a deadline or a student retries an identical request after the deadline
- **THEN** earlier revision timestamps/deadline/late flags stay unchanged, retries return the original revision and later new saves use the updated deadline

#### Scenario: Privacy, boundaries and old data
- **WHEN** a peer/unrelated instructor requests timing metadata, client-supplied time/late claims are forged or an old assignment has no deadline
- **THEN** existing access and input guards prevent disclosure/forgery, no synthetic deadline is invented, and exact-deadline comparison plus SGT/UTC conversion remain consistent

### Requirement: Compare owned saved revisions
Verified students SHALL be able to select two of their own saved revision numbers for the same assignment and language and view added, removed and unchanged lines with original/new line numbers.

#### Scenario: Required constraints for compare owned saved revisions
- **WHEN** this capability is used
- **THEN** Selection SHALL persist in GET URLs and refresh/history navigation. Default comparison SHALL use predecessor/current, or first/latest when opening revision one; a single saved revision and identical code SHALL have helpful states. Reversed/equal selections SHALL remain valid. Whitespace and final newlines SHALL be represented; line-ending styles MAY be normalized for comparison only. Comparison work SHALL be bounded and MAY show a coarser changed middle block for large inputs. Source SHALL render as safe text with keyboard/mobile/light/dark support, without modifying or executing saved revisions.

The server SHALL derive identity from the verified session, validate identifiers/revision parameters, read only projected own anchor/latest metadata and at most two selected bounded sources, and enforce student/assignment/language filters alongside RLS. Missing/foreign/invalid/duplicate selections SHALL fail closed; unavailable assignment titles SHALL stay hidden. No rubric, unpublished grade, AI, grade/XP write, source query parameter or persistent source cache SHALL be introduced.

#### Scenario: Compare Python or Java revisions
- **WHEN** a student opens Compare revisions on their saved Python or Java submission and selects two revision numbers
- **THEN** changes and both line-number sequences are shown, refresh/Back retain selections and both originals remain unchanged

#### Scenario: Empty or unchanged comparison
- **WHEN** only one own revision exists or selected source is identical
- **THEN** the student sees a helpful single-revision or No changes state without fabricated differences

#### Scenario: Private and unavailable revisions
- **WHEN** a caller requests another student's anchor, invalid/duplicate/out-of-range revision numbers or hidden assignment metadata
- **THEN** unauthorized source and metadata stay inaccessible, own hidden-assignment revisions retain neutral metadata, and no privileged client is used

### Requirement: Student published-grade list
The system SHALL provide My grades to verified students, listing only their own published grades with assignment title when available, submission language/revision, score, publication time, safe plain-text feedback and a link to the graded revision. It SHALL NOT infer percentages/averages or expose source, rubrics, draft grades or peer records. Use deterministic published_at/ID descending order, 25 entries per page and bounded title/language filters applied before pagination.

#### Scenario: Published feedback and revision navigation
- **WHEN** a student opens My grades
- **THEN** they can read/expand their published instructor feedback and open its own graded revision, with helpful empty/loading/error states and mobile/light/dark support

#### Scenario: Publication, identity and hidden metadata
- **WHEN** draft/peer grades exist or a caller forges identity query parameters
- **THEN** they do not affect the verified student's published list; signed-out/instructor access is denied, hidden assignments use neutral metadata, and title searches cannot reveal hidden titles

#### Scenario: Filters and pagination
- **WHEN** the student applies literal title and Python/Java filters, refreshes or uses Next/Previous
- **THEN** filters combine before stable pagination and persist in URLs; applying/clearing resets page one, invalid/duplicate parameters fail closed, and null scores do not hide published feedback

### Requirement: Continue editing an owned saved revision
Students SHALL be able to load their own saved revision into its published assignment's editor and submit further work as a new immutable revision.

#### Scenario: Required constraints for continue editing an owned saved revision
- **WHEN** this capability is used
- **THEN** Only a revision identifier SHALL appear in the navigation URL. The server SHALL verify student identity, ownership, assignment association and matching language before supplying exact source; invalid, duplicate, missing, peer or mismatched identifiers SHALL fail closed. This action SHALL NOT save, execute code, publish grades or award XP automatically.

#### Scenario: Reopen and submit in either language
- **WHEN** a student chooses Continue editing on an available Python or Java revision
- **THEN** the editor loads exact source with the assignment language and a clean baseline; edits, runs and submission use the existing workspace, a successful save creates a new revision, and the original stays unchanged

#### Scenario: Saved code before client initialization
- **WHEN** a reopened assignment is displayed before its form JavaScript is ready
- **THEN** the source is visible but editing and submission stay disabled until the form can handle input, so early actions cannot replace or lose the loaded draft

#### Scenario: Replace an edited draft
- **WHEN** a student selects a different revision or leaves a resumed workspace with unsaved edits
- **THEN** the existing warning allows cancellation without losing source; accepted revision navigation replaces the draft, while save refresh does not replace newer edits

#### Scenario: Unavailable revision or assignment
- **WHEN** a caller supplies another student's revision, a revision for another assignment/language, malformed or duplicate parameters, or an unpublished assignment
- **THEN** the editor does not load that source; unavailable assignments do not offer Continue editing, and normal visits without a revision remain blank

### Requirement: Student list search and language filters
Assignments and My submissions SHALL provide a bounded case-insensitive literal title search, All languages/Python/Java filtering and Clear filters. Applied filters SHALL be encoded in the URL, combined before history pagination and retained by Next/Previous; applying or clearing SHALL return to page one. Filtered empty states SHALL help the student change or clear filters. Existing publication, verified ownership and metadata projection boundaries SHALL remain enforced.

#### Scenario: Combined filters and pagination
- **WHEN** a student applies title and language filters to assignments or their saved revisions
- **THEN** only matching visible assignment titles/languages appear, and history pagination applies to the matching own revisions rather than the current unfiltered page

#### Scenario: Hidden assignment metadata
- **WHEN** a title search is applied to a revision whose assignment is no longer visible
- **THEN** the hidden title does not match or leak through results, while unsearched own history remains accessible with neutral unavailable metadata

#### Scenario: Literal input and invalid filters
- **WHEN** search contains punctuation, markup or wildcard characters, or query keys repeat or use unsupported language values
- **THEN** valid text is matched literally and rendered safely, invalid filters are rejected, and identity/query manipulation cannot expose other students' submissions

#### Scenario: Empty matches and clearing
- **WHEN** applied filters match no records or the student clears them
- **THEN** the UI offers a helpful no-match state with Clear filters, and clearing restores page one without filters

### Requirement: Unsaved assignment code protection
The real student assignment editor SHALL indicate when its current source differs from its last successfully submitted snapshot. Initial empty source SHALL be clean. Failed submissions SHALL preserve source and dirty state. A successful submission SHALL acknowledge only the source sent in that request, preserving newer edits as unsaved. Request identifiers SHALL be reused only for retries of the same source.

#### Scenario: Edit, revert and save
- **WHEN** a student edits Python or Java code, returns to the saved source, or successfully submits it
- **THEN** the unsaved indicator reflects exact source equality with the last successful snapshot, and running code alone does not mark source saved

#### Scenario: Failed or delayed submission
- **WHEN** saving fails or the student changes source while a submission is in flight
- **THEN** the current source stays in the editor and remains unsaved unless it exactly matches a successfully submitted snapshot

#### Scenario: Leave with unsaved code
- **WHEN** the student follows an ordinary same-tab app link or signs out while code is unsaved
- **THEN** confirmation precedes navigation or session mutation, cancellation keeps source and session, and saving or unmounting removes the guard

#### Scenario: Browser navigation
- **WHEN** a dirty editor is reloaded/closed or a cancelable same-document history traversal occurs
- **THEN** the browser unload warning or history confirmation is requested without inserting history entries
- **AND** documented browser limitations include suppressed mobile/unload dialogs and unsupported or noncancelable history traversal

### Requirement: Private cross-assignment submission history
Authenticated students SHALL have a My submissions list of their own stored revisions across assignments, with assignment title, stored language, revision, submitted time and links to existing authorized detail/feedback/published-grade views.

#### Scenario: Required constraints for private cross-assignment submission history
- **WHEN** this capability is used
- **THEN** The server SHALL derive student identity from the verified session and enforce an explicit ownership filter alongside RLS. List reads SHALL exclude source, private rubrics and grades. The list SHALL use deterministic newest-first pagination of 25 items, show loading/empty/safe retry states and retain own revisions when assignment metadata is unavailable. This real-data feature SHALL require authentication even when the synthetic assignment preview is enabled.

#### Scenario: Find and revisit revisions
- **WHEN** a student opens My submissions after saving Python/Java revisions to different assignments
- **THEN** their revisions appear newest first with paging and each link opens the original immutable source and existing feedback/grade view

#### Scenario: Foreign identity or role
- **WHEN** a student supplies another student ID through query parameters or a signed-out/instructor account requests the list
- **THEN** query parameters cannot change the verified identity and role/session guards prevent unauthorized list access

#### Scenario: Missing assignment metadata or failed query
- **WHEN** an own revision has unavailable assignment metadata or the history query fails
- **THEN** unavailable metadata uses a neutral label without losing the revision, while failures show a retry state without disclosing backend details or using fixtures

### Requirement: Focused student assignment layout
The student sidebar and Menu SHALL contain only the Assignments navigation entry, with nonshrinking padded CodeLeet branding.

#### Scenario: Required constraints for focused student assignment layout
- **WHEN** this capability is used
- **THEN** Assignment discovery SHALL remain in the main list. For an enabled local runner, the real assignment page SHALL order instructions, source editor, Run code, Run & test input/output, test cases and their action, Submit revision/status, then Your revisions. Run/test actions SHALL remain non-submitting buttons, and changes to layout SHALL preserve source, saving and execution behavior.

#### Scenario: Navigate and work on an assignment
- **WHEN** a student opens an assignment on desktop or uses Menu on mobile
- **THEN** navigation offers Assignments without duplicated published-assignment shortcuts, the problem precedes source, and submission/history follow practice results

### Requirement: Real assignment language and immutable revision language
The authenticated assignment workflow SHALL accept Python or Java, defaulting omitted assignment language to Python for existing callers.

#### Scenario: Required constraints for real assignment language and immutable revision language
- **WHEN** this capability is used
- **THEN** Instructor creation/editing SHALL expose this choice. Every stored revision SHALL derive its language from the assignment on the server and retain that language with its source. The real editor, browser runner, revision views and AI context SHALL use the validated stored language. Unsupported assignment languages and client-supplied submission language fields SHALL be rejected. This integration retains the authenticated MVP's 8,000-character source bound and 201 response for successful or identical retried submissions; the earlier 32 KiB preview contract is separate.

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
The shared source editor SHALL support four-space Tab indentation, selected-block indentation and Shift+Tab unindentation.

#### Scenario: Required constraints for keyboard indentation
- **WHEN** this capability is used
- **THEN** Enter SHALL preserve leading whitespace and add a level after Python block colons or opening delimiters outside strings/comments. Enter between matching brackets SHALL place the caret on an indented blank line, and a Java closing brace on an indented blank line SHALL remove one level. Editing SHALL preserve source outside the change and enforce the existing textarea character limit without truncation. Escape then Tab SHALL allow normal focus movement; composition and modifier shortcuts SHALL remain native. Native undo SHALL work in the verified Chromium editing path.

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
The opted-in development preview SHALL provide a labeled code-entry textarea with the assignment's fixed Python/Java language, UTF-8 byte counter and local input validation.

#### Scenario: Required constraints for local source entry preview
- **WHEN** this capability is used
- **THEN** It SHALL retain source on validation errors, reject blank, invalid Unicode, NUL and source above 32,768 UTF-8 bytes without truncation, and render source as plain text. Check code SHALL NOT execute or transmit source. An additional opt-in local runner preview MAY pass source through a validated browser message bridge for local execution/published practice tests; source SHALL NOT be sent to a server or persisted. Submit code SHALL remain disabled until authenticated integration exists.

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

### Requirement: Course assignments and private rubrics
For active courses, the system SHALL let course instructors manage assignments/rubrics and expose published assignments only to enrolled students. The archived Legacy course SHALL preserve the previous per-assignment instructor ownership and student-visible policy.

Student-visible assignment data SHALL include ID, title, instructions, language and publication status. Student list/detail access SHALL exclude unpublished assignments and private grading data.

#### Scenario: Student views assignment
- **WHEN** a student opens a published assignment
- **THEN** public instructions/criteria appear without private rubric or draft grading data

#### Scenario: Draft assignment requested directly
- **WHEN** a student requests a draft assignment by its ID through a route or database API
- **THEN** its private content is not returned

### Requirement: Immutable code revisions
The system SHALL accept bounded single-file Python or Java source as immutable revisions and associate grades/feedback with exact revisions.

#### Scenario: Required constraints for immutable code revisions
- **WHEN** this capability is used
- **THEN** Resubmission SHALL preserve prior evaluated code.

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
