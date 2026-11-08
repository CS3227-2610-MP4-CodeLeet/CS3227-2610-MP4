# User Authentication Specification

## Purpose

Provides verified student and instructor identities and keeps every protected application workflow within the signed-in user's authorized role.

## Requirements

### Requirement: Public registration creates students only
The system SHALL allow public registration for student accounts only. Instructor access SHALL be granted only through a trusted administrative process.

#### Scenario: New user registers
- **WHEN** a visitor completes public registration
- **THEN** the account receives the student role and is directed to the student workspace

#### Scenario: Registration requests instructor access
- **WHEN** a registration request includes an instructor role or privileged user metadata
- **THEN** the request cannot grant instructor permissions

### Requirement: Protected pages verify identity and role
The system SHALL verify the current Supabase identity and protected role before returning role-specific pages or private data. Missing or unverifiable identity SHALL fail closed.

#### Scenario: Signed-out user requests protected content
- **WHEN** a visitor requests a student or instructor page without a valid session
- **THEN** the application redirects to sign-in without returning private data

#### Scenario: Role does not authorize a page
- **WHEN** a verified student requests an instructor page or an instructor requests a student-only operation
- **THEN** the request is denied without disclosing protected content

#### Scenario: Authentication service is unavailable
- **WHEN** the identity or role cannot be verified because an authentication dependency is unavailable
- **THEN** the request fails closed and does not treat the user as authenticated

### Requirement: User profile access is limited to its owner
An authenticated user SHALL be able to read and update their own text profile without changing their role or another user's profile.

#### Scenario: User updates own profile
- **WHEN** a user saves a valid display name for their own account
- **THEN** only that profile's display name is updated

#### Scenario: User attempts to change a role
- **WHEN** a user edits profile data or submits a profile update containing a role
- **THEN** the role remains unchanged
