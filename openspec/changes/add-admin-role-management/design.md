## Context

See `proposal.md` for motivation and `specs/admin-role-management/spec.md` for required behavior. `public.user_roles` currently allows only `student` and `instructor`; client writes are revoked and each instructor workflow has app and database authorization checks. `public.profiles` and `public.user_roles` expose only the caller's own rows. Supabase Auth data lives outside the public Data API.

## Goals / Non-Goals

**Goals:**
- Add the admin role without granting admin access through signup metadata.
- Keep admin authorization and the final-admin invariant inside Postgres as well as the app.
- Limit the account directory to an admin-authorized projection.
- Make self-demotion conspicuous, confirmed, and followed by navigation to the new role's workspace.

**Non-Goals:**
- User deletion, password resets, course-wide settings, role-request workflows, or a general audit-log subsystem.
- Granting admins access to student-only operations or changing assignment ownership checks.

## Decisions

### Represent admin as a third protected role and centralize instructor capability

Extend `user_roles.role` and the verified application role type with `admin`. Add a shared predicate for instructor capabilities and use it for every existing instructor page, API, review flow, and database authorization check. Student-only checks remain exact. The home route continues to send admins to the instructor workspace; its navigation exposes the admin panel only to admins.

This preserves the explicit role distinction needed for the admin-only panel. A separate `is_admin` boolean alongside `instructor` would create two sources of privilege and complicate every existing role check.

### Use narrowly granted database functions for account listing and role changes

Keep direct client table writes revoked. Add a `SECURITY DEFINER` directory function that verifies `auth.uid()` is currently an admin and returns only user ID, email, display name, and role in UUID-keyset pages. Add a separate role-change function that verifies the caller, validates the role and target, and changes one existing role row. Both functions use an empty `search_path`, schema-qualified names, explicit grants to `authenticated`, and no service-role key.

The directory function reads `auth.users` because the existing profile table does not store email and the private Auth schema is not exposed through the Data API. Only the explicit admin projection is returned; no general view or broad `auth.users` grant is added. Returning only display names and UUIDs would be less useful for distinguishing accounts with the same name.

### Serialize all role changes when enforcing the final-admin invariant

Acquire one transaction-scoped advisory lock for each role mutation, then verify the caller remains an admin and count current admins before demoting an admin account. The global lock prevents two concurrent demotions from both observing another admin and removing the final two accounts. The server-side check is authoritative; UI state is not used for security.

### Re-check current roles inside privileged instructor RPCs

Role changes take effect at the database boundary as soon as the protected `user_roles` row changes. Every security-definer instructor operation must verify the caller's current instructor-capable role in addition to assignment ownership. In particular, `save_grade` must permit only current `instructor` or `admin` accounts; prior ownership alone is insufficient after demotion.

### Serialize directory-page requests in the client

Guard each `loadMore` operation with a synchronous in-flight ref before its first `await`, and expose loading state to disable the button. This prevents repeated events from sharing a stale cursor while keeping a failed page retryable after the request settles.

### Track role mutations independently per account

Use a synchronous set of pending user IDs to reject duplicate updates for the same row before the first `await`, and mirror that set into React state for row-level disabled controls. Separate accounts may update concurrently; completing one request removes only its own ID and cannot clear another row's busy state.

### Confirm self-role changes before sending them

Use the browser's native confirmation dialog with a role-specific warning when the selected user is the current admin. Cancel sends no request. After a successful self-change, navigate to the student or instructor workspace based on the new role and refresh the verified session view. The RPC independently blocks demotion of the final admin.

### Provision the first admin outside public application flows

Keep account signup student-only. Document an operator-only SQL procedure that promotes one verified existing account by its email in the trusted Supabase SQL editor. Add one deterministic admin to the local synthetic seed so the panel can be exercised without hosted credentials.

## Risks / Trade-offs

- **A missed exact-instructor check could leave admins unable to use one instructor feature** → Search every app and SQL role check; cover shared authorization, instructor AI quota, assignment ownership, and admin-backed end-to-end paths.
- **A function could expose private Auth fields or bypass role checks** → Return a fixed projection, verify the current role inside the function, use a fixed search path, revoke default execution, grant only to `authenticated`, and add pgTAP allow/deny assertions.
- **The first admin could be provisioned for the wrong account** → Require an existing verified email and document a query that selects exactly that account; never accept first-admin selection from public signup or client input.
- **Rolling back code while admin rows remain would make admins fail closed under the older role parser** → Do not reverse the role migration; before reverting application code, use a trusted operator operation to convert existing admins to instructors.

## Migration Plan

1. Apply a forward-only migration that expands the role check, makes existing instructor authorization include admins, and adds the guarded directory and role-change functions.
2. Update local synthetic seed data and database tests; provision one hosted initial admin only after the compatible app and migration are deployed.
3. If application rollback is required, first convert admin rows to instructor with trusted SQL; retain the forward schema migration.

## Open Questions

None. Self-role confirmation and final-admin protection were confirmed by the requester.
