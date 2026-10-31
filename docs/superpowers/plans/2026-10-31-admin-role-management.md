# Admin Role and User Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Specialist delegation is not authorized unless the user explicitly requests it.

**Goal:** Add an admin role that retains instructor capabilities and provides a guarded, confirmable user-role management panel.

**Architecture:** Keep role data in protected `public.user_roles`. Use narrowly granted Postgres functions for the admin-only account projection and role mutation, with a transaction advisory lock enforcing the final-admin invariant. Centralize role capability checks in the verified app auth layer, and use an admin-only Next.js route group and API handlers for the panel.

**Tech Stack:** Next.js 16.4 App Router, React 19, TypeScript, Supabase/Postgres, pgTAP, Vitest, Playwright, Zod.

**Spec:** `openspec/changes/add-admin-role-management/`

## Global Constraints

- Public registration creates student accounts only; instructor and admin access comes from trusted role assignment.
- Admin accounts retain instructor workflows and assignment ownership checks.
- Direct authenticated writes to `public.user_roles` remain revoked.
- Admin self-role changes require a warning and explicit confirmation.
- Every role change preserves at least one admin after initial provisioning, including concurrent changes.
- No service-role key is added to the app; account listing returns only the approved admin projection.
- Submitted Python/Java execution remains browser-only; no uploads or unrelated role features are added.

## Review Focus

- Admin role parse and instructor capability inheritance: a new role cannot be treated as unknown or gain student-only powers.
- Admin-only directory projection: a student or instructor cannot retrieve email or role data through the page, API, or RPC.
- Invalid role/unknown target: rejected without a write.
- Self-change cancel/confirm: cancel issues no request; confirm submits once and navigates according to the resulting role.
- Final-admin race: two concurrent demotions cannot leave zero admin accounts.

---

### Task 1: Add guarded database role operations

**Files:**
- Create: `supabase/migrations/20261031160000_admin_role_management.sql`
- Create: `supabase/tests/database/admin_role_management.test.sql`
- Modify: `supabase/seed.sql`
- Modify: `supabase/README.md`

**Interfaces:**
- `admin_list_users(p_after_user_id uuid, p_limit integer)` returns a fixed row projection: `user_id uuid`, `email text`, `display_name text`, `role text`.
- `admin_set_user_role(p_user_id uuid, p_role text)` updates one existing role row or raises a guarded error.
- Both functions are `SECURITY DEFINER`, use `search_path = ''`, qualify relations, revoke `PUBLIC`/`anon` execution, and grant execution only to `authenticated`.

- [x] **Step 1: Write pgTAP tests** for admin-only directory access and projection, allowed/invalid role updates, non-admin denial, self-demotion, final-admin denial, and preservation of the final admin when competing demotions are attempted.
- [x] **Step 2: Run the database test** with `pnpm db:test`; confirm the new assertions fail because the functions/role are not implemented yet.
- [x] **Step 3: Add the forward migration** expanding the role constraint, extending instructor database authorization to admins, and adding the two guarded functions. Serialize mutations with one transaction-scoped advisory lock; check caller and admin count while holding it.
- [x] **Step 4: Add a deterministic local admin fixture** and a trusted SQL instruction for provisioning the initial admin by a verified existing account.
- [x] **Step 5: Re-run `pnpm db:test`** and require the admin assertions and existing database suite to pass.
- [ ] **Step 6: Commit verified database milestone** as `feat: add guarded admin role operations`.

### Task 2: Extend verified application role capabilities

**Files:**
- Create: `src/lib/auth/roles.ts`
- Modify: `src/lib/auth/verified-user.ts`
- Modify: `src/lib/auth/verified-user.test.ts`
- Modify: `src/app/page.tsx`
- Modify: `src/app/instructor/layout.tsx`
- Modify: `src/app/api/assignments/route.ts`
- Modify: `src/app/api/assignments/[id]/route.ts`
- Modify: `src/app/api/grades/[id]/route.ts`
- Modify: `src/app/api/ai/context-comparison/route.ts`
- Modify: `src/lib/ai/review-route.ts`

**Interfaces:**
- `AppRole = 'student' | 'instructor' | 'admin'`.
- `hasInstructorAccess(role: AppRole | null): boolean` returns true for instructor/admin only.
- `canAccessRole(expected: AppRole, actual: AppRole | null): boolean` treats admin as instructor-capable, while student and admin-only routes remain exact.

- [ ] **Step 1: Add failing auth tests** for resolving `admin`, allowing admin through instructor guards, and denying admin access to student-only expectations.
- [ ] **Step 2: Run the focused Vitest file** with `pnpm exec vitest run src/lib/auth/verified-user.test.ts`; confirm the new assertions fail.
- [ ] **Step 3: Implement role parsing and shared capability checks**, then use the shared check in every instructor route and review path; preserve exact student-only checks.
- [ ] **Step 4: Add a link to the admin panel only for admins** and route signed-in admins to the instructor workspace by default.
- [ ] **Step 5: Re-run the focused auth tests and affected app tests**; require student boundaries and instructor ownership behavior to remain unchanged.
- [ ] **Step 6: Commit verified auth milestone** as `feat: authorize admins for instructor workflows`.

### Task 3: Build the admin directory and role editor

**Files:**
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/page.tsx`
- Create: `src/app/api/admin/users/route.ts`
- Create: `src/app/api/admin/users/[userId]/role/route.ts`
- Create: `src/app/api/admin/users/route.test.ts`
- Create: `src/app/api/admin/users/[userId]/role/route.test.ts`
- Create: `src/features/admin-users/contracts.ts`
- Create: `src/features/admin-users/user-directory.tsx`
- Create: `src/features/admin-users/user-directory.test.tsx`
- Modify: `src/app/instructor/layout.tsx`

**Interfaces:**
- `GET /api/admin/users?after=<uuid>` returns at most 50 rows and a nullable UUID cursor; it requests at most 51 rows from the database function to determine whether another page exists.
- `PATCH /api/admin/users/:userId/role` accepts `{ "role": "student" | "instructor" | "admin" }`, checks origin and verified admin identity, and calls `admin_set_user_role`.
- The role editor uses native `window.confirm` only for the current admin's own role, warns that access changes immediately, and redirects to the new role's workspace after success.

- [ ] **Step 1: Add failing API and UI tests** asserting admin-only reads/writes, role and target validation, final-admin RPC error mapping, no request on self-change cancel, one request after confirmation, and navigation to the destination workspace.
- [ ] **Step 2: Run the focused Vitest file** with `pnpm exec vitest run src/features/admin-users/user-directory.test.tsx`; confirm the new assertions fail.
- [ ] **Step 3: Add the admin-only server page/layout and guarded GET/PATCH handlers** with Zod validation, same-origin protection, private/no-store responses, and explicit database error mapping.
- [ ] **Step 4: Implement the paged user directory and role controls**, including the self-role warning, cancel path, and new-role navigation.
- [ ] **Step 5: Re-run the UI and API tests** and perform the authenticated browser journey with synthetic local accounts if the local Supabase stack is available.
- [ ] **Step 6: Commit verified panel milestone** as `feat: add admin user role management panel`.

### Task 4: Document, audit and validate the full change

**Files:**
- Modify: `docs/UserGuide.md`
- Modify: `supabase/README.md`
- Modify: `logs/2026-10-31-admin-role-management.md`
- Review: all files in this change and the OpenSpec requirements.

- [ ] **Step 1: Update the user guide** with verified admin access, role changes, confirmation, and initial-admin provisioning behavior.
- [ ] **Step 2: Run the focused database, auth, API, and UI suites**, then `pnpm test:unit`, `pnpm lint`, `pnpm typecheck`, and `pnpm spec:validate`.
- [ ] **Step 3: Run `git diff --check` and review every role comparison** in `src/` and `supabase/` for missed instructor/admin or student-only boundaries.
- [ ] **Step 4: Record actual commands, results, limitations, commits, and pending human verification** in the session log and link it from issue #33.
- [ ] **Step 5: Push the feature branch and open/update a PR to `develop`** linking issue #33, the OpenSpec change, and session summary; leave merge, deployment, and release separate.
