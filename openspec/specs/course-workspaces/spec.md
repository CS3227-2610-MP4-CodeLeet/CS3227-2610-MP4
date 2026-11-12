# course-workspaces Specification

## Purpose

Define course memberships, enrollment, ownership, feature settings and read-only historical access.

## Requirements

### Requirement: Course workspaces and memberships
Each course SHALL have a title, description, owner, lifecycle, feature settings, and membership. Users MAY have different student/instructor roles in different courses. Platform administration SHALL remain separate from course membership.

#### Scenario: Multiple course roles
- **WHEN** a user is a student in one course and an instructor in another
- **THEN** each operation grants only the selected course membership's permissions

#### Scenario: Course creation
- **WHEN** an authorized instructor creates a valid course
- **THEN** they become owner and instructor member

### Requirement: Course management permissions
Owners and instructors MAY add instructors and add/remove students. Only the owner MAY remove instructors, transfer ownership, or archive. Ownership transfer SHALL be atomic, require the recipient to be a verified instructor member of that course, and retain the former owner as instructor.

#### Scenario: Non-owner instructor attempts owner action
- **WHEN** an instructor removes another instructor or transfers ownership
- **THEN** the operation is denied through UI, route, RPC and Data API

#### Scenario: Transfer to a student
- **WHEN** the owner selects or directly submits an enrolled student as the new owner
- **THEN** the transfer is unavailable in the UI and rejected by the database without changing membership or ownership

### Requirement: Platform-admin course overview
Platform admins MAY inspect a read-only overview of any course. The overview SHALL expose only course metadata (title, description, lifecycle and Legacy/unassigned status) and SHALL NOT grant course membership or access to the roster, invitations, feature settings, assignments, submissions, grades, discussions, AI records or XP. All course activity routes SHALL continue to require the applicable course membership.

#### Scenario: Admin inspects a course without membership
- **WHEN** a platform admin opens a course from the course directory
- **THEN** they see its read-only metadata overview without instructor controls or course activity data

#### Scenario: Admin requests course activity without membership
- **WHEN** a platform admin without course membership directly requests a course activity route
- **THEN** the route denies access under the same membership rules as for other non-members

### Requirement: Verified email invitations and student join codes
Course instructors MAY invite instructors/students by email; students MAY join with a course code. Membership SHALL be granted only after verified sign-in and server confirmation that the email matches the pending invite or that the student supplied a valid active code. Invites SHALL be expiring, revocable and retry-safe; codes SHALL be student-only, rate-limited, revocable, rotatable and stored non-reversibly.

#### Scenario: Invitation acceptance
- **WHEN** a signed-in user accepts an invitation with a matching verified email
- **THEN** they receive only the invited course and role

#### Scenario: Unverified, mismatched or invalid enrollment
- **WHEN** an invitation/code is expired, revoked, mismatched, replayed or used by an unverified user
- **THEN** no membership is granted and no account/invitation details are disclosed

### Requirement: Instructor-only join-code visibility
Only instructors who are members of a course MAY view, create, rotate or revoke its join code. After creation or rotation, the raw code SHALL be shown in that instructor's current management session. Students SHALL NOT retrieve or mutate a code.

#### Scenario: Student cannot view or manage a course code
- **WHEN** an enrolled student visits user management or directly invokes a join-code API/RPC
- **THEN** no code is disclosed and create/rotate/revoke operations are denied

#### Scenario: Instructor creates a code
- **WHEN** a course instructor creates or rotates a join code
- **THEN** the raw code is displayed for convenient sharing in that management session while only its non-reversible hash is stored

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

### Requirement: Course navigation and legacy route compatibility
Authenticated navigation SHALL link only to existing course-scoped routes. Legacy student and instructor URLs SHALL resolve to the corresponding authorized course route when their course context can be verified, or to the course directory when it cannot. Redirects SHALL preserve the existing authentication and course-membership checks and SHALL NOT accept an arbitrary redirect destination.

#### Scenario: Course navigation without selected context
- **WHEN** an authenticated member opens navigation without a selected course
- **THEN** navigation offers the course directory rather than links to missing student routes

#### Scenario: Mobile course navigation
- **WHEN** a member opens the course navigation drawer at a narrow viewport
- **THEN** long course titles do not overlap the close control, keyboard focus moves into the drawer and remains within it, Escape closes it, and focus returns to the opener

#### Scenario: Legacy URL with authorized course context
- **WHEN** an authenticated member opens a supported legacy URL for a record in an authorized course
- **THEN** they are redirected to its canonical course-scoped route

#### Scenario: Legacy URL without verifiable context
- **WHEN** a legacy record or course context cannot be verified for the signed-in member
- **THEN** the request returns not found or redirects to the course directory without disclosing the record
