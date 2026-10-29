## ADDED Requirements

### Requirement: Email password recovery
The system SHALL provide a Forgot password email request from sign-in, use Supabase Auth's PKCE recovery and respond without disclosing account existence. It SHALL enforce pending/resend controls and show safe provider/rate errors without exposing provider details. Only a fixed same-origin recovery destination SHALL be accepted by the callback, and a server-verified identity SHALL be required to render the new-password form. Matching passwords with the existing visibility controls SHALL update only that authenticated identity; invalid, expired and replayed links SHALL offer a new request. Successful password update and any subsequent sign-out failure SHALL be reported distinctly. Passwords/tokens/email bodies SHALL NOT be logged by application code.

#### Scenario: Recovery request
- **WHEN** a visitor submits a valid email for password recovery
- **THEN** Auth is asked to deliver a recovery link and the acknowledgement does not reveal account existence

#### Scenario: Password update
- **WHEN** a valid recovery session submits matching new passwords
- **THEN** the user's password changes and the user can sign in with the new password while the old password fails

#### Scenario: Invalid recovery access
- **WHEN** a signed-out visitor opens the password form directly or a callback code is invalid/expired/replayed
- **THEN** no unauthenticated password update is offered and a new recovery link can be requested

#### Scenario: Untrusted redirect
- **WHEN** a callback includes a next value other than the exact recovery path
- **THEN** it is ignored in favor of the existing verified role destination without redirecting to an attacker-controlled URL

### Requirement: Consistent account controls
The visible product name SHALL be CodeLeet and the registration profile-name field SHALL be labeled Username. The label change SHALL preserve existing profile storage and email-based authentication.

The application SHALL apply the saved theme to account and signed-in pages. Registration SHALL require matching password confirmation before sending an Auth request; password fields SHALL provide independent accessible visibility controls. Authenticated workspace headers SHALL provide sign-out and SHALL report retryable sign-out failures without a successful redirect. Real assignment navigation SHALL omit sample-data notices and redundant Home links; explicit fixture mode SHALL retain truthful labeling.

#### Scenario: Mismatched registration passwords
- **WHEN** a user submits different password and confirmation values
- **THEN** account creation is blocked locally with an explanatory message and no Auth signup request

#### Scenario: Independent password visibility
- **WHEN** the user changes visibility for either password field
- **THEN** only that field changes visibility and the control name describes its next action

#### Scenario: Sign-out failure and recovery
- **WHEN** sign-out fails and the user retries successfully
- **THEN** the failure stays visible on the current page until retry and success redirects to sign-in with protected pages requiring authentication again

### Requirement: Trusted role assignment
The system SHALL support student/instructor identities with Supabase Auth. Public registration SHALL grant only student access and role elevation SHALL require trusted administration.

#### Scenario: Student attempts self-promotion
- **WHEN** a student includes an instructor role in a registration or profile request
- **THEN** the system rejects or ignores elevation and retains student permissions

### Requirement: Authorized profiles and private data
The system SHALL allow users to edit their own text profile and SHALL enforce ownership through server checks and database policies. Students SHALL NOT access private rubrics, draft grades or other students' submissions.

Every protected student operation SHALL use a request-scoped cookie-based Supabase client with getUser verification and a protected role lookup. It SHALL NOT trust getSession alone or client-provided identity/role. Authenticated student responses SHALL use private, no-store caching. Missing/invalid identity SHALL yield 401, verified non-students 403 and unavailable verification dependencies 503.

#### Scenario: Forged session cookie
- **WHEN** a client sends a session cookie that cannot be verified by Supabase Auth
- **THEN** student operations return 401 without disclosing or changing private data

#### Scenario: Auth dependency unavailable
- **WHEN** current identity or protected role cannot be verified because its service is unavailable
- **THEN** the operation fails closed with 503 without claiming a successful submission

#### Scenario: Cross-student read
- **WHEN** Student A requests Student B's code through a route or database API
- **THEN** access is denied without exposing content

#### Scenario: Cross-student submission mutation
- **WHEN** Student A attempts to create or alter a submission as Student B through a route or database API
- **THEN** the operation is denied without modifying Student B's records

#### Scenario: Signed-out submission access
- **WHEN** a signed-out client requests protected submission history or attempts submission creation
- **THEN** no submission content is disclosed or stored

#### Scenario: Unrelated instructor access
- **WHEN** an instructor requests private grading data for an assignment they do not own
- **THEN** access is denied

#### Scenario: Own profile update
- **WHEN** a user saves a valid display name for their own profile
- **THEN** that name changes without modifying roles or another user's data
