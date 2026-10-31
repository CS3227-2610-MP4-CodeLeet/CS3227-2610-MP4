## Why

The application currently has no instance-level administrator, so instructor privileges cannot be delegated safely through the product. An admin role and focused user-management panel let trusted administrators manage student, instructor, and admin access while keeping public registration student-only.

## What Changes

- Add an admin role that has all existing instructor capabilities plus access to an admin-only panel for changing user roles.
- Let admins change their own role only after a warning dialog and explicit confirmation; reject any role change that would leave no admin.
- Authorize role changes on the server/database, preserve trusted provisioning for the first admin, and keep direct client role writes unavailable.

## Capabilities

### New Capabilities

- `admin-role-management`: Admin access, role directory and changes, final-admin protection, and self-change confirmation.

### Modified Capabilities

- `user-authentication`: Add the admin role, its instructor capability inheritance, and role-change authorization while preserving student-only public registration.

## Impact

- Supabase role schema, RLS/RPC authorization, and database tests.
- Verified role resolution, instructor routes/API authorization, admin route and role-management UI.
- Trusted initial-admin provisioning guidance and the verified user guide.
- Unit, database, and focused browser coverage; no new dependency expected.
