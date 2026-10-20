## ADDED Requirements

### Requirement: Trusted role assignment
The system SHALL support student/instructor identities with Supabase Auth. Public registration SHALL grant only student access and role elevation SHALL require trusted administration.

#### Scenario: Student attempts self-promotion
- **WHEN** a student includes an instructor role in a registration or profile request
- **THEN** the system rejects or ignores elevation and retains student permissions

### Requirement: Authorized profiles and private data
The system SHALL allow users to edit their own text profile and SHALL enforce ownership through server checks and database policies. Students SHALL NOT access private rubrics, draft grades or other students' submissions.

#### Scenario: Cross-student read
- **WHEN** Student A requests Student B's code through a route or database API
- **THEN** access is denied without exposing content

#### Scenario: Unrelated instructor access
- **WHEN** an instructor requests private grading data for an assignment they do not own
- **THEN** access is denied

#### Scenario: Own profile update
- **WHEN** a user saves a valid display name for their own profile
- **THEN** that name changes without modifying roles or another user's data
