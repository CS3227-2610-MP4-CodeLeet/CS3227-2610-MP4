## 1. Guarded database role operations

- [x] 1.1 Add pgTAP coverage for the admin directory projection, admin-only access, valid and invalid role updates, unknown targets, self-demotion, final-admin protection, and role changes that preserve an admin.
- [x] 1.2 Add a forward migration for the admin role, instructor-capability database policies/functions, protected admin directory, and serialized role changes.
- [x] 1.3 Add a deterministic local admin fixture and document trusted first-admin provisioning in `supabase/README.md`.
- [x] 1.4 Run `pnpm db:test` and confirm the role-management and existing database assertions pass.

## 2. Verified application role capabilities

- [ ] 2.1 Add failing unit tests for admin role parsing and instructor capability inheritance while preserving student-only restrictions.
- [ ] 2.2 Implement shared role capability checks and apply them to verified identity, instructor pages, APIs, AI review, and home navigation.
- [ ] 2.3 Verify admin instructor access and existing student/instructor boundaries with focused Vitest coverage.

## 3. Admin user directory and role editor

- [ ] 3.1 Add failing API and UI tests for admin-only access, role validation, role-change errors, self-change cancellation, confirmation, and post-change navigation.
- [ ] 3.2 Implement admin-only directory and role-change endpoints with same-origin, identity, role, and input validation.
- [ ] 3.3 Implement the paged account directory, role controls, and warning confirmation for self-role changes.
- [ ] 3.4 Verify that self-role cancellation sends no request and a confirmed self-change navigates to the new role's workspace.

## 4. Documentation and completion evidence

- [ ] 4.1 Update `docs/UserGuide.md` with verified role-management behavior and initial-admin provisioning.
- [ ] 4.2 Run focused and full applicable unit/database checks, lint, typecheck, OpenSpec validation, and whitespace review.
- [ ] 4.3 Review every app and database role check for missed instructor/admin or student-only boundaries; record actual findings and limits.
- [ ] 4.4 Update the dated session log and issue #33 with the final branch, commits, verification, and PR; keep teammate review pending until it occurs.
