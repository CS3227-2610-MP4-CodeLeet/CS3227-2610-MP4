## Purpose

Allows trusted administrators to manage account roles while retaining the existing instructor workflow and keeping role assignment protected from public or client-controlled changes.

## ADDED Requirements

### Requirement: Admins retain instructor capabilities
An account with the admin role SHALL be authorized for all instructor workflows as well as the admin user-management workflow.

#### Scenario: Admin uses instructor workflows
- **WHEN** a verified admin opens an instructor page or performs an instructor-authorized API or database operation
- **THEN** the operation is authorized subject to the same assignment ownership rules that apply to instructors

#### Scenario: Instructor opens the admin panel
- **WHEN** a verified instructor requests the admin user-management page or endpoint
- **THEN** the request is denied without returning user-directory data

### Requirement: Admins can view the account directory
The system SHALL let admins view registered account email, display name, and current role in the admin panel. The directory SHALL disclose no other Supabase Auth data.

#### Scenario: Admin views users
- **WHEN** a verified admin requests a page of the account directory
- **THEN** the system returns only account email, display name, user identifier, and current role for that page

#### Scenario: Student or instructor requests the directory
- **WHEN** a non-admin requests the directory through the page, API, or database function
- **THEN** the request is denied and no account-directory data is returned

### Requirement: Admin role changes are server-authorized
The system SHALL allow only a verified admin to change a registered user's role to `student`, `instructor`, or `admin`. Role changes SHALL be applied by a trusted database operation; authenticated clients SHALL NOT receive direct write privileges to `user_roles`.

#### Scenario: Admin changes another user's role
- **WHEN** an admin submits a valid role change for a registered user
- **THEN** the stored role changes to the requested role and subsequent authorization uses the new role

#### Scenario: Demoted instructor cannot use privileged grading RPCs
- **WHEN** an instructor who owns an assignment is demoted to student and calls the grade-saving database function
- **THEN** the function denies the request and leaves the grade unchanged

#### Scenario: Non-admin submits a role change
- **WHEN** a student or instructor calls the application endpoint or database function to change a role
- **THEN** the request is denied and the stored role is unchanged

#### Scenario: Admin submits an invalid or unknown target
- **WHEN** an admin requests an unsupported role or a user identifier with no registered account
- **THEN** the request is rejected and no role is changed

### Requirement: Admin self-role changes require confirmation
When an admin selects a different role for their own account, the admin panel SHALL show a warning that the change immediately affects admin access and SHALL require explicit confirmation before sending the role-change request.

#### Scenario: Admin confirms a self-role change
- **WHEN** an admin confirms the warning for a valid self-role change
- **THEN** the panel submits the change and reflects the resulting role and access

#### Scenario: Admin cancels a self-role change
- **WHEN** an admin cancels the warning
- **THEN** the panel sends no role-change request and the stored role remains unchanged

### Requirement: Role changes preserve at least one admin
After the first admin is provisioned, every role change SHALL preserve at least one account with the admin role. Concurrent role changes SHALL NOT be able to remove the final admin.

#### Scenario: Admin attempts to demote the final admin
- **WHEN** an admin changes the role of the only admin account to student or instructor
- **THEN** the system rejects the change and leaves that account as admin

#### Scenario: Admin demotes an account while another admin remains
- **WHEN** an admin changes an admin account to student or instructor while at least one other admin remains
- **THEN** the change succeeds and at least one admin remains

#### Scenario: Concurrent changes target the last two admins
- **WHEN** two role-change requests concurrently attempt to demote the last two admin accounts
- **THEN** no more than one demotion succeeds and at least one admin remains

### Requirement: Initial admin access is provisioned through a trusted operation
The first admin role SHALL be assigned by an operator-controlled provisioning operation and SHALL NOT be assignable through public registration or user-editable metadata.

#### Scenario: Public registration requests admin access
- **WHEN** a visitor registers with user metadata requesting the admin role
- **THEN** the new account receives only the student role

#### Scenario: Operator provisions the first admin
- **WHEN** an authorized operator provisions an existing account as the first admin using the documented trusted procedure
- **THEN** the account receives instructor and admin capabilities
