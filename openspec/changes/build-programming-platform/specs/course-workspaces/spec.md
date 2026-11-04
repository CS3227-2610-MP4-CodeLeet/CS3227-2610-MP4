## ADDED Requirements

### Requirement: Course workspaces and memberships
Each course SHALL have a title, description, owner, lifecycle, feature settings, and membership. Users MAY have different student/instructor roles in different courses. Platform administration SHALL remain separate from course membership.

#### Scenario: Multiple course roles
- **WHEN** a user is a student in one course and an instructor in another
- **THEN** each operation grants only the selected course membership's permissions

#### Scenario: Course creation
- **WHEN** an authorized instructor creates a valid course
- **THEN** they become owner and instructor member

### Requirement: Course management permissions
Owners and instructors MAY add instructors and add/remove students. Only the owner MAY remove instructors, transfer ownership, or archive. Ownership transfer SHALL be atomic, promote the recipient to instructor if needed, and retain the former owner as instructor.

#### Scenario: Non-owner instructor attempts owner action
- **WHEN** an instructor removes another instructor or transfers ownership
- **THEN** the operation is denied through UI, route, RPC and Data API

### Requirement: Verified email invitations and student join codes
Staff MAY invite instructors/students by email; students MAY join with a course code. Membership SHALL be granted only after verified sign-in and server confirmation that the email matches the pending invite or that the student supplied a valid active code. Invites SHALL be expiring, revocable and retry-safe; codes SHALL be student-only, rate-limited, revocable, rotatable and stored non-reversibly.

#### Scenario: Invitation acceptance
- **WHEN** a signed-in user accepts an invitation with a matching verified email
- **THEN** they receive only the invited course and role

#### Scenario: Unverified, mismatched or invalid enrollment
- **WHEN** an invitation/code is expired, revoked, mismatched, replayed or used by an unverified user
- **THEN** no membership is granted and no account/invitation details are disclosed

### Requirement: Course feature settings
Owners and instructors MAY toggle currently implemented features. Settings SHALL gate navigation, routes, APIs and database operations; disabling a feature SHALL preserve its records.

#### Scenario: Disabled feature
- **WHEN** a member directly requests a disabled feature
- **THEN** access is denied without disclosing its records

### Requirement: Archive and empty-only deletion
Archiving SHALL retain records and allow existing members to read history while denying new membership and activity. Permanent deletion SHALL be owner-only, explicitly confirmed, atomic, and allowed only when there are no other members and no academic, forum, AI or XP records.

#### Scenario: Non-empty course
- **WHEN** an owner attempts to delete a non-empty course
- **THEN** deletion is denied and archive is offered

### Requirement: Archived legacy course
Migration SHALL place current assignments, submissions, grades, AI records, forum posts and XP in one archived Legacy course with owner pending until assigned by a platform admin. It SHALL preserve attribution and pre-migration per-record access without inventing course boundaries.

#### Scenario: Unassigned legacy owner
- **WHEN** the migration creates Legacy
- **THEN** it is archived, displays Unassigned, and only platform admin can assign an instructor owner; it remains read-only
