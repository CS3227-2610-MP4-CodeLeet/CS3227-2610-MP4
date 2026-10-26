## ADDED Requirements

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
