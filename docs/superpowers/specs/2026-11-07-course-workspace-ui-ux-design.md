# Course Workspace & Navigation UI/UX Redesign

## Intent and The Why

The CodeLeet application has evolved to multi-course workspaces where students and instructors operate within dedicated course boundaries. However, several UX rough edges and architectural leftovers remain:
1. Navigation headers are duplicated across layouts with inconsistent links, preventing platform administrators from jumping between the course workspace list (`/courses`) and platform administration (`/admin`).
2. The User Roles admin view still displays a legacy pre-workspace course reassignment component (`LegacyOwnerAssignment`), adding clutter to user administration.
3. The User Roles directory does not allow searching users by email or filtering by role, making user administration cumbersome as the user base grows.
4. Instructor features currently rely on top-level `/instructor` routes coupled with `?courseId=` query parameters, diverging from the RESTful nested hierarchy (`/courses/[courseId]`).
5. Course creation and course joining are embedded as static form cards stacked at the bottom of the course directory, consuming screen real estate even when not in use.

This project unifies top-level navigation, cleans up obsolete components, introduces responsive server-backed user search/filtering with cursor pagination, reorganizes instructor workflows into clean nested course routes without legacy redirects, and encapsulates course creation/joining into accessible modal dialogs.

## Goals, Non-Goals, and Anti-Goals

### Goals
- **Unified Navigation**: Implement a reusable `AppHeader` component used across application layouts, conditionally rendering navigation options (e.g., "User roles" / Admin panel for platform admins, "Courses" for all authenticated users).
- **Legacy Cleanup**: Completely delete `LegacyOwnerAssignment`, its backend API endpoint (`/api/admin/courses/legacy-owner`), and related test files.
- **User Search & Role Filtering**: Enhance `admin_list_users` RPC and `/api/admin/users` to support `p_search` (case-insensitive email matching) and `p_role` filtering while preserving cursor-based pagination. Add debounced search and role selection to `UserDirectory`.
- **Nested Instructor Routes**: Relocate all instructor routes from `/instructor/*` to `/courses/[courseId]/instructor/*`, removing `?courseId=` query dependency. Completely delete the `src/app/instructor/` directory and update all internal links, actions, and test assertions.
- **Modal Dialogs for Course Entry**: Replace the bottom form panels in `CourseDirectory` with "Create course" and "Join course" modal dialogs launched from header buttons next to "Your courses".

### Non-Goals
- Migrating student workspace routes (`/student/*`) or forum routes (`/forums`) in this pass; they continue functioning with `?courseId=` parameters.
- Adding new global roles or multi-tenant permission layers beyond the existing `student`, `instructor`, and `admin` roles.
- Introducing heavy 3rd-party component libraries for dialogs when accessible native `<dialog>` elements or Tailwind modal overlays provide lightweight, accessible solutions.

### Anti-Goals
- **No Backwards-Compatible Redirects**: Do not leave legacy redirect stubs under `/instructor/*`. All obsolete routes must be deleted and all references updated cleanly.
- **No Client-Only In-Memory Directory Filtering**: Do not filter only the currently loaded page of users in client state, as this causes silent omission of records across pagination pages.

## Constraints
- **Next.js 16.4.3 App Router**: Maintain server-component data fetching and dynamic rendering rules (`export const dynamic = 'force-dynamic'`).
- **Database & Security**: Any modifications to `admin_list_users` must preserve `SECURITY DEFINER` semantics and ensure only verified platform administrators can list user accounts.
- **Zero-Regression Policy**: All existing unit, integration, and E2E tests must pass or be cleanly updated to match the new nested course routes.

## Approaches

### Approach 1: Integrated Server-Driven Architecture (Selected)
- **Top Bar**: Implement a server-rendered `AppHeader` in `src/components/layout/app-header.tsx` that inspects `getVerifiedUserRole()`. Use it in `CoursesLayout`, `AdminLayout`, and other layouts.
- **Legacy Removal**: Fully remove `LegacyOwnerAssignment`, `/api/admin/courses/legacy-owner`, and tests.
- **Database Search/Filter**: Add a Supabase migration extending `admin_list_users(p_after_user_id, p_limit, p_search, p_role)` with `email ILIKE ('%' || p_search || '%')` and role filtering. Update `/api/admin/users` to pass query params `q` and `role`. Update `UserDirectory` with debounced search input, role filter, and cursor pagination.
- **Route Migration**: Move `src/app/instructor/*` into `src/app/courses/[courseId]/instructor/*`. Delete `src/app/instructor/`. Update all references across `course-workspace.tsx`, `assignment-form.tsx`, `review-button.tsx`, and E2E tests.
- **Modal Dialogs**: Extract course creation and join forms into accessible dialog modals in `CourseDirectory`.
- *Selection Rationale*: Ensures scalable user search across thousands of accounts, eliminates dead code completely, and adopts standard RESTful routing.

### Approach 2: Client-Centric In-Memory Directory Filtering
- Filter only loaded users in client memory without updating the database function or adding a migration.
- *Trade-offs*: Avoids a database migration, but searching fails across pagination boundaries and causes stale/misleading results for administrators. Dropped.

## Detailed Architecture & Decisions

### 1. Unified Navigation (`AppHeader`)
- Path: `src/components/layout/app-header.tsx`
- Rendered in:
  - `src/app/courses/layout.tsx`
  - `src/app/admin/layout.tsx`
  - `src/app/courses/[courseId]/layout.tsx` (if applicable)
- Props / State: Accepts verified `user` and `role`.
- Structure:
  - Left: "CodeLeet" brand logo/link (linking to `/courses`), followed by primary links:
    - "Courses" link (`/courses`)
    - "User roles" link (`/admin`) visible only if `role === 'admin'`
  - Right: "Profile" link (`/profile`), `<SignOutButton />`, `<AccountThemeButton />`.

### 2. Admin User Directory Search, Filtering & Pagination
- **Database RPC**:
  `admin_list_users(p_after_user_id uuid default null, p_limit integer default 51, p_search text default null, p_role text default null)`
  - Query filters:
    - If `p_search` is provided and non-empty: `AND (u.email ILIKE ('%' || trim(p_search) || '%') OR p.display_name ILIKE ('%' || trim(p_search) || '%'))`
    - If `p_role` is provided and in `('student', 'instructor', 'admin')`: `AND r.role = p_role`
- **API Endpoint** (`GET /api/admin/users`):
  - Parses `after` (cursor UUID), `q` (search string), `role` (app role).
  - Validates role against `appRoleSchema`.
  - Invokes `admin_list_users` RPC with parameters.
- **UI Component** (`UserDirectory`):
  - Adds a search input with 300ms debounce.
  - Adds a role filter dropdown (`All roles`, `student`, `instructor`, `admin`).
  - Resets pagination cursor and user list whenever search query or role filter changes.
  - Maintains "Load more" cursor pagination for the filtered dataset.

### 3. Removal of Legacy Owner Assignment
- Delete `src/features/course-workspaces/legacy-owner-assignment.tsx`.
- Delete `src/features/course-workspaces/legacy-owner-assignment.test.tsx`.
- Delete `src/app/api/admin/courses/legacy-owner/route.ts` and `route.test.ts`.
- In `src/app/admin/page.tsx`:
  - Remove `loadAdminData` legacy course query (`courses.select('id,owner_id').eq('is_legacy', true)`).
  - Remove `<LegacyOwnerAssignment />` render.

### 4. Instructor Route Reorganization
- Reorganize route files:
  - `src/app/instructor/page.tsx` → `src/app/courses/[courseId]/instructor/page.tsx`
  - `src/app/instructor/page.test.tsx` → `src/app/courses/[courseId]/instructor/page.test.tsx`
  - `src/app/instructor/assignments/new/page.tsx` → `src/app/courses/[courseId]/instructor/assignments/new/page.tsx`
  - `src/app/instructor/assignments/[assignmentId]/edit/page.tsx` → `src/app/courses/[courseId]/instructor/assignments/[assignmentId]/edit/page.tsx`
  - `src/app/instructor/assignments/[assignmentId]/practice-tests/page.tsx` → `src/app/courses/[courseId]/instructor/assignments/[assignmentId]/practice-tests/page.tsx`
  - `src/app/instructor/assignments/[assignmentId]/submissions/page.tsx` → `src/app/courses/[courseId]/instructor/assignments/[assignmentId]/submissions/page.tsx`
  - `src/app/instructor/submissions/[submissionId]/page.tsx` → `src/app/courses/[courseId]/instructor/submissions/[submissionId]/page.tsx`
  - `src/app/instructor/submissions/[submissionId]/page.test.tsx` → `src/app/courses/[courseId]/instructor/submissions/[submissionId]/page.test.tsx`
  - `src/app/instructor/ai-context/page.tsx` → `src/app/courses/[courseId]/instructor/ai-context/page.tsx`
  - `src/app/instructor/ai-context/page.test.tsx` → `src/app/courses/[courseId]/instructor/ai-context/page.test.tsx`
  - Delete `src/app/instructor/` entirely (including `src/app/instructor/layout.tsx`).
- Update routes in calling components:
  - `src/features/course-workspaces/course-workspace.tsx`:
    - Assignments link: `/courses/${course.id}/instructor`
    - New assignment link: `/courses/${course.id}/instructor/assignments/new`
    - AI context link: `/courses/${course.id}/instructor/ai-context`
  - Inside instructor pages:
    - Edit assignment: `/courses/${courseId}/instructor/assignments/${assignment.id}/edit`
    - Practice tests: `/courses/${courseId}/instructor/assignments/${assignment.id}/practice-tests`
    - Submissions list: `/courses/${courseId}/instructor/assignments/${assignment.id}/submissions`
    - View submission: `/courses/${courseId}/instructor/submissions/${submission.id}?courseId=${courseId}` (or clean path `/courses/${courseId}/instructor/submissions/${submission.id}`)
  - Update Playwright E2E tests:
    - `tests/e2e/codementor-mvp.spec.ts`
    - `tests/e2e/assignment-deadlines.spec.ts`
    - `tests/e2e/java-assignments.spec.ts`
    - `tests/e2e/published-practice-tests.spec.ts`
    - `tests/e2e/assignment-xp.spec.ts`

### 5. Course Actions Modal Dialogs
- In `src/features/course-workspaces/course-directory.tsx`:
  - Remove static bottom section `<section className="grid gap-6 lg:grid-cols-2">`.
  - In the "Your courses" header bar, use a `flex items-center justify-between gap-4` layout:
    - Left: `<h2 className="text-xl font-semibold">Your courses</h2>`
    - Right (right-aligned action buttons):
      - "Create course" (rendered if `canCreate` is true).
      - "Join course" (rendered for all members).
  - Clicking opens an accessible `<dialog>` modal (or overlay modal with `role="dialog"`, `aria-modal="true"`, Esc key handler, and backdrop dismiss).
  - Inside the modal, render `CourseCreateForm` and `CourseJoinForm` respectively with a close button.
  - Automatically close the dialog upon successful submission or cancellation.

## What's Left to the Builder
- **Post-Creation Redirection**: After saving a new assignment in `/courses/[courseId]/instructor/assignments/new`, redirect to `/courses/[courseId]/instructor`.
- **Modal Completion Handlers**: Pass an `onSuccess?: () => void` callback to `CourseCreateForm` and `CourseJoinForm` to cleanly close the dialog before refreshing the directory view.
- **Database Backwards-Compatibility**: Keep `DEFAULT NULL` for both `p_search` and `p_role` in `admin_list_users` so existing database tests in `supabase/tests/database/admin_role_management.test.sql` remain completely green.
- **Debounce & Styling**: Use a 300ms debounce for user email search and match existing dialog overlays to the application's dark mode palette (`bg-background/80 backdrop-blur-sm`).

