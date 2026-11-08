# Course Workspace & Navigation UI/UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a unified application navigation header, clean up legacy course assignment components, add server-backed debounced email search and role filtering with cursor pagination to the User Roles directory, migrate all instructor routes into `/courses/[courseId]/instructor/*`, and modernize course creation/joining into accessible right-aligned modal dialogs.

**Architecture:** A server-rendered `AppHeader` component handles global navigation with conditional platform role links. The Postgres RPC `admin_list_users` is extended to support search and role filters on the database level, consumed by `/api/admin/users` and a debounced client-side directory controller. All instructor pages are reorganized into Next.js App Router dynamic course routes (`/courses/[courseId]/instructor/...`), replacing query-string course identification and eliminating the obsolete `src/app/instructor/` directory.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 6.0.3, Supabase Auth/Postgres RLS, Vitest 5.0.5, Playwright 1.64.1, Tailwind CSS.

**Spec:** `docs/superpowers/specs/2026-11-07-course-workspace-ui-ux-design.md`

## Global Constraints
- Next.js 16.4.3 App Router conventions with `export const dynamic = 'force-dynamic'`.
- All database modifications to `admin_list_users` must retain `SECURITY DEFINER` semantics and guard against non-admin callers (`errcode = '42501'`).
- No backwards-compatible redirects for legacy `/instructor/*` paths; all dead routes and references must be cleanly removed.
- Course creation and join modal dialogs must use accessible dialog semantics (`role="dialog"`, `aria-modal="true"`, Escape key dismissal, backdrop dismiss).
- Zero-regression policy across all existing unit, integration, and E2E test suites.

## Review Focus
1. **Admin directory search SQL injection & bounds**: Passing special characters (e.g. `%`, `_`, `'`) to email search must be safely escaped in PostgreSQL pattern matching.
2. **Cursor pagination with active filter**: Switching the role filter or changing the search query must reset the `after` cursor and current user list rather than appending disjoint records.
3. **Admin self-demotion prevention under search/filter**: Changing an admin's role when filtered or searched must still enforce the final-admin safety check.
4. **Deep-linked instructor nested routes**: Directly accessing `/courses/[courseId]/instructor/assignments/[assignmentId]/edit` must verify both authentication and instructor course membership without relying on query strings.
5. **Modal focus trap and cleanup**: Closing a dialog via Escape or backdrop click must not leave the document body scroll-locked or dirty form state stuck.

---

### Task 1: Legacy Owner Assignment Deletion and Admin Page Simplification

**Files:**
- Delete: `src/features/course-workspaces/legacy-owner-assignment.tsx`
- Delete: `src/features/course-workspaces/legacy-owner-assignment.test.tsx`
- Delete: `src/app/api/admin/courses/legacy-owner/route.ts`
- Delete: `src/app/api/admin/courses/legacy-owner/route.test.ts`
- Modify: `src/app/admin/page.tsx`
- Test: `src/app/admin/page.test.tsx`

**Interfaces:**
- Consumes: `requireRole('admin')`, `admin_list_users` RPC.
- Produces: Simplified `/admin` page rendering only the UserDirectory.

- [ ] **Step 1: Write the failing test for `AdminPage` without LegacyOwnerAssignment**

Create `src/app/admin/page.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AdminPage from './page';

vi.mock('@/lib/auth/verified-user', () => ({
  requireRole: vi.fn().mockResolvedValue({
    user: { id: 'admin-1' },
    supabase: {
      rpc: vi.fn().mockResolvedValue({
        data: [{ user_id: '91000000-0000-4000-8000-000000000001', email: 'user@test.com', display_name: 'Test', role: 'student' }],
        error: null,
      }),
    },
  }),
}));

vi.mock('@/features/admin-users/user-directory', () => ({
  UserDirectory: () => <div data-testid="user-directory">User Directory Mock</div>,
}));

describe('AdminPage', () => {
  it('renders UserDirectory and does not render LegacyOwnerAssignment', async () => {
    const element = await AdminPage();
    render(element);
    expect(screen.getByRole('heading', { name: 'User roles' })).toBeDefined();
    expect(screen.getByTestId('user-directory')).toBeDefined();
    expect(screen.queryByText(/Archived historical workspace/i)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/app/admin/page.test.tsx`
Expected: FAIL (because `AdminPage` currently still calls `from('courses')` for legacy and imports `LegacyOwnerAssignment`)

- [ ] **Step 3: Remove `LegacyOwnerAssignment` files and simplify `src/app/admin/page.tsx`**

Remove:
- `src/features/course-workspaces/legacy-owner-assignment.tsx`
- `src/features/course-workspaces/legacy-owner-assignment.test.tsx`
- `src/app/api/admin/courses/legacy-owner/route.ts`
- `src/app/api/admin/courses/legacy-owner/route.test.ts`

Update `src/app/admin/page.tsx`:
- Remove `legacyResult` query from `loadAdminData`.
- Return `{ initialUsers, nextAfter }` only.
- Remove `<LegacyOwnerAssignment />` from JSX.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/app/admin/page.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/page.tsx src/app/admin/page.test.tsx
git rm src/features/course-workspaces/legacy-owner-assignment.tsx src/features/course-workspaces/legacy-owner-assignment.test.tsx src/app/api/admin/courses/legacy-owner/route.ts src/app/api/admin/courses/legacy-owner/route.test.ts
git commit -m "refactor(admin): remove legacy course owner assignment component and api"
```

---

### Task 2: Database Migration & API for Admin User Search, Role Filter, and Pagination

**Files:**
- Create: `supabase/migrations/20261107180000_admin_user_search_and_filter.sql`
- Create: `supabase/tests/database/admin_user_search_and_filter.test.sql`
- Modify: `src/features/admin-users/contracts.ts`
- Modify: `src/app/api/admin/users/route.ts`
- Modify: `src/app/api/admin/users/route.test.ts`

**Interfaces:**
- Consumes: Supabase database connection and authenticated session.
- Produces:
  - RPC: `admin_list_users(p_after_user_id uuid default null, p_limit integer default 51, p_search text default null, p_role text default null)`
  - Endpoint: `GET /api/admin/users?after=<uuid>&q=<search>&role=<role>`
  - Response: `{ users: AdminUser[], nextAfter: string | null }`

- [ ] **Step 1: Write the failing test for `GET /api/admin/users` with search and role params**

Update `src/app/api/admin/users/route.test.ts`:
```ts
it('passes search and role filters to admin_list_users RPC', async () => {
  const rpcMock = vi.fn().mockResolvedValue({ data: [], error: null });
  // Set up mock with searchParams q=student and role=student
  const request = new NextRequest('http://localhost:3000/api/admin/users?q=student&role=student');
  const response = await GET(request);
  expect(response.status).toBe(200);
  expect(rpcMock).toHaveBeenCalledWith('admin_list_users', expect.objectContaining({
    p_search: 'student',
    p_role: 'student',
  }));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/app/api/admin/users/route.test.ts`
Expected: FAIL

- [ ] **Step 3: Create the database migration and update `GET /api/admin/users`**

Create `supabase/migrations/20261107180000_admin_user_search_and_filter.sql`:
```sql
create or replace function public.admin_list_users(
  p_after_user_id uuid default null,
  p_limit integer default 51,
  p_search text default null,
  p_role text default null
)
returns table (user_id uuid, email text, display_name text, role text)
language plpgsql
stable
security definer
set search_path = ''
as $function$
begin
  if auth.uid() is null or not exists (
    select 1 from public.user_roles r
    where r.user_id = auth.uid() and r.role = 'admin'
  ) then
    raise exception using errcode = '42501', message = 'admin_required';
  end if;
  if p_limit is null or p_limit not between 1 and 101 then
    raise exception using errcode = '22023', message = 'invalid_limit';
  end if;
  if p_role is not null and p_role not in ('student', 'instructor', 'admin') then
    raise exception using errcode = '22023', message = 'invalid_role';
  end if;

  return query
    select u.id, u.email::text, coalesce(p.display_name, 'Student'), r.role
    from auth.users u
    join public.user_roles r on r.user_id = u.id
    left join public.profiles p on p.id = u.id
    where (p_after_user_id is null or u.id > p_after_user_id)
      and (p_role is null or r.role = p_role)
      and (
        p_search is null
        or trim(p_search) = ''
        or u.email ilike ('%' || trim(p_search) || '%')
        or coalesce(p.display_name, '') ilike ('%' || trim(p_search) || '%')
      )
    order by u.id
    limit p_limit;
end;
$function$;
```

Update `src/app/api/admin/users/route.ts`:
- Extract `q` and `role` from `request.nextUrl.searchParams`.
- Validate role with `appRoleSchema.optional()`.
- Pass `p_search: q?.trim() || null` and `p_role: validatedRole ?? null` to `admin_list_users`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run src/app/api/admin/users/route.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20261107180000_admin_user_search_and_filter.sql src/features/admin-users/contracts.ts src/app/api/admin/users/route.ts src/app/api/admin/users/route.test.ts
git commit -m "feat(admin): add search and role filtering to admin user directory api and rpc"
```

---

### Task 3: User Directory UI with Search Bar, Role Filter Dropdown, and Pagination

**Files:**
- Modify: `src/features/admin-users/user-directory.tsx`
- Modify: `src/features/admin-users/user-directory.test.tsx`

**Interfaces:**
- Consumes: `/api/admin/users?after=&q=&role=` and `/api/admin/users/[userId]/role`.
- Produces: `UserDirectory` React component with integrated search input, role select, directory table, and cursor pagination.

- [ ] **Step 1: Write failing tests for search and role filter in `UserDirectory`**

Update `src/features/admin-users/user-directory.test.tsx`:
- Test that typing in search input debounces and fetches filtered users with `q=...`.
- Test that changing role select triggers fetch with `role=...`.
- Test that changing search or role clears existing users and resets the pagination cursor.
- Test that loading indicators appear during debounced searches.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/features/admin-users/user-directory.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement search input and role filter in `UserDirectory`**

In `src/features/admin-users/user-directory.tsx`:
- Add `search` state and `roleFilter` state (`'' | AppRole`).
- Implement debounced effect (300ms) for `search` changes.
- Build search controls component with:
  - `<input type="search" placeholder="Search by email or name..." />`
  - `<select aria-label="Filter by role">` with options `All roles`, `student`, `instructor`, `admin`.
- When search or role filter changes:
  - Reset `users` list and fetch page 1 (`/api/admin/users?q=${search}&role=${roleFilter}`).
- Update `loadMore` to include current `q` and `role` alongside `after=${nextAfter}`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/features/admin-users/user-directory.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/admin-users/user-directory.tsx src/features/admin-users/user-directory.test.tsx
git commit -m "feat(admin): add debounced email search and role filter controls to user directory"
```

---

### Task 4: Unified Reusable `AppHeader` Component

**Files:**
- Create: `src/components/layout/app-header.tsx`
- Create: `src/components/layout/app-header.test.tsx`
- Modify: `src/app/courses/layout.tsx`
- Modify: `src/app/admin/layout.tsx`

**Interfaces:**
- Consumes: `getVerifiedUserRole()` (server-side context with `user` and `role`).
- Produces: `<AppHeader />` component providing consistent site branding, navigation links, and account controls.

- [ ] **Step 1: Write failing test for `AppHeader`**

Create `src/components/layout/app-header.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppHeader } from './app-header';

describe('AppHeader', () => {
  it('renders brand and Courses link for any logged-in role', () => {
    render(<AppHeader role="student" userEmail="student@test.com" />);
    expect(screen.getByRole('link', { name: /CodeLeet/i })).toHaveAttribute('href', '/courses');
    expect(screen.getByRole('link', { name: 'Courses' })).toHaveAttribute('href', '/courses');
    expect(screen.queryByRole('link', { name: /User roles/i })).toBeNull();
  });

  it('renders User roles link when role is admin', () => {
    render(<AppHeader role="admin" userEmail="admin@test.com" />);
    expect(screen.getByRole('link', { name: /User roles/i })).toHaveAttribute('href', '/admin');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/components/layout/app-header.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement `AppHeader` and integrate into layouts**

Create `src/components/layout/app-header.tsx`:
- Render `<header className="flex flex-wrap items-center justify-between gap-4 border-b px-6 py-4">`.
- Render left group:
  - `<Link href="/courses" className="font-semibold">CodeLeet</Link>`
  - `<Link href="/courses" className="text-sm underline">Courses</Link>`
  - If `role === 'admin'`: `<Link href="/admin" className="text-sm underline">User roles</Link>`
- Render right group:
  - `<Link href="/profile">Profile</Link>`
  - `<SignOutButton />`
  - `<AccountThemeButton />`

Replace custom headers in `src/app/courses/layout.tsx` and `src/app/admin/layout.tsx` with `<AppHeader role={role} userEmail={user.email} />`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/components/layout/app-header.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/app-header.tsx src/components/layout/app-header.test.tsx src/app/courses/layout.tsx src/app/admin/layout.tsx
git commit -m "feat(layout): introduce unified app header with conditional role navigation"
```

---

### Task 5: Course Creation & Join Modal Dialogs

**Files:**
- Modify: `src/features/course-workspaces/course-entry-forms.tsx`
- Modify: `src/features/course-workspaces/course-directory.tsx`
- Modify: `src/features/course-workspaces/course-directory.test.tsx`

**Interfaces:**
- Consumes: `CourseCreateForm`, `CourseJoinForm`.
- Produces: Accessible modal dialogs triggered by right-aligned action buttons in the `CourseDirectory` header.

- [ ] **Step 1: Write failing test for modal dialog triggers and layout**

Update `src/features/course-workspaces/course-directory.test.tsx`:
- Verify "Your courses" header row contains right-aligned "Create course" (if `canCreate`) and "Join course" buttons.
- Verify clicking "Create course" opens a modal containing the create form.
- Verify clicking "Join course" opens a modal containing the join form.
- Verify static bottom section with forms is no longer present on the main page.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/features/course-workspaces/course-directory.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement accessible modal dialogs in `CourseDirectory`**

In `src/features/course-workspaces/course-directory.tsx`:
- Add `activeModal: 'none' | 'create' | 'join'` state.
- In `CourseList`, use a `flex items-center justify-between gap-4` container for the header:
  - Left: `<h2 className="text-xl font-semibold">Your courses</h2>`
  - Right:
    ```tsx
    <div className="flex items-center gap-3">
      {canCreate && (
        <button
          type="button"
          onClick={() => setActiveModal('create')}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
        >
          Create course
        </button>
      )}
      <button
        type="button"
        onClick={() => setActiveModal('join')}
        className="rounded-md border px-3 py-1.5 text-sm font-medium"
      >
        Join course
      </button>
    </div>
    ```
- Render modal dialogs with backdrop, Escape key listener, and close button:
  - Pass `onSuccess={() => setActiveModal('none')}` and `onCancel={() => setActiveModal('none')}` to `CourseCreateForm` and `CourseJoinForm`.
- Remove the bottom `<section className="grid gap-6 lg:grid-cols-2">` from the page layout.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/features/course-workspaces/course-directory.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/course-workspaces/course-directory.tsx src/features/course-workspaces/course-entry-forms.tsx src/features/course-workspaces/course-directory.test.tsx
git commit -m "feat(courses): convert course creation and join forms into accessible modal dialogs"
```

---

### Task 6: Migrate Instructor Routes to `/courses/[courseId]/instructor/*` and Delete `src/app/instructor/`

**Files:**
- Move:
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
- Delete: `src/app/instructor/` entirely (including `src/app/instructor/layout.tsx`).
- Modify:
  - `src/features/course-workspaces/course-workspace.tsx`
  - `src/features/course-workspaces/course-workspace.test.tsx`
  - `src/features/codementor/assignment-form.tsx`
  - `src/features/codementor/review-button.tsx`
  - Playwright E2E tests:
    - `tests/e2e/codementor-mvp.spec.ts`
    - `tests/e2e/assignment-deadlines.spec.ts`
    - `tests/e2e/java-assignments.spec.ts`
    - `tests/e2e/published-practice-tests.spec.ts`
    - `tests/e2e/assignment-xp.spec.ts`

**Interfaces:**
- Consumes: Next.js route parameter `params: Promise<{ courseId: string }>`.
- Produces: Nested instructor dashboard and authoring pages under `/courses/[courseId]/instructor/*`.

- [ ] **Step 1: Write failing tests for updated instructor link targets in `CourseWorkspace`**

Update `src/features/course-workspaces/course-workspace.test.tsx`:
- Assert Assignments link points to `/courses/${courseId}/instructor`.
- Assert New Assignment link points to `/courses/${courseId}/instructor/assignments/new`.
- Assert AI context link points to `/courses/${courseId}/instructor/ai-context`.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/features/course-workspaces/course-workspace.test.tsx`
Expected: FAIL

- [ ] **Step 3: Move files to `src/app/courses/[courseId]/instructor/` and update references**

- Move route pages into `src/app/courses/[courseId]/instructor/...`.
- In each moved page:
  - Read `courseId` from route `params: Promise<{ courseId: string }>` instead of `searchParams`.
  - Update internal links and redirects to use `/courses/${courseId}/instructor/...`.
- Delete `src/app/instructor/` directory.
- In `src/features/course-workspaces/course-workspace.tsx`:
  - Update all instructor links to the new `/courses/${course.id}/instructor/...` path.
- In `src/features/codementor/assignment-form.tsx`:
  - Update post-save redirect to `/courses/${courseId}/instructor`.
- In `tests/e2e/`:
  - Update URL navigations from `/instructor?courseId=...` to `/courses/${courseId}/instructor`.
  - Update assignment creation/edit URLs to the new path.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/courses/ src/features/ tests/
git rm -r src/app/instructor/
git commit -m "refactor(instructor): migrate instructor routes under /courses/[courseId]/instructor and remove /instructor"
```

---

### Task 7: Full Verification and Cleanup

**Files:**
- Any touched documentation (`docs/UserGuide.md`, `docs/DeveloperGuide.md`)
- Create: `logs/2026-11-07-course-workspace-ui-ux.md`

- [ ] **Step 1: Run typecheck and linting**

Run: `pnpm run typecheck && pnpm run lint`
Expected: Exit code 0, 0 warnings.

- [ ] **Step 2: Run unit test suite with coverage**

Run: `pnpm test:unit`
Expected: All tests pass.

- [ ] **Step 3: Create session log summary**

Document all actions, decisions, and outcomes in `logs/2026-11-07-course-workspace-ui-ux.md`.

- [ ] **Step 4: Commit**

```bash
git add docs/ logs/
git commit -m "docs: record verification and session summary for course workspace ui/ux redesign"
```
