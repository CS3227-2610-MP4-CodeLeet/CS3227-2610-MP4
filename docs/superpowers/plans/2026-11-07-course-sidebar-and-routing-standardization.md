# Course Sidebar Navigation, Breadcrumbs, and Route Standardization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor CodeLeet's course workspace navigation into a persistent, collapsible left sidebar and hierarchical breadcrumb header, and standardize all course-scoped routes (assignments, submissions, grades, progress, xp, forums, leaderboard, ai-usage) under `/courses/[courseId]/...`, eliminating the `?courseId=` query parameter pattern.

**Architecture:** A server-rendered `src/app/courses/[courseId]/layout.tsx` validates membership and loads course metadata, feature settings, user profile display name, and student total XP in parallel. It wraps all child routes with a client-side `CourseSidebar` (collapsible rail, mobile drawer, active state highlighting) and `CourseBreadcrumbs` (hierarchical trail with dynamic leaf title registry), replacing isolated back buttons across all feature pages.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, Lucide icons, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-07-course-sidebar-and-routing-standardization-design.md`

## Global Constraints

- Sidebar must be anchored on the left side of the viewport.
- Sidebar must be collapsible on desktop and provide an off-canvas drawer on mobile (<768px).
- All course-scoped routes must live under `/courses/[courseId]/...`; no `?courseId=` query parameters for course navigation.
- Standalone `←` back links across course pages must be replaced by hierarchical breadcrumb navigation.
- Legacy URLs with `?courseId=` must redirect to their `/courses/[courseId]/...` equivalents.
- Preserve unauthenticated assignment preview mode for Playwright test fixtures.
- Keep application code in `src/` and follow strict TDD and zero-regression policies.

## Review Focus

1. **Unauthorized Access:** User without membership in `course_memberships` attempts direct navigation to `/courses/[courseId]/assignments` -> Layout halts and redirects to `/unauthorized`.
2. **Disabled Feature Gating:** User navigates to `/courses/[courseId]/leaderboard` when `leaderboard` feature is disabled -> Route renders `notFound()` and sidebar hides the link.
3. **Dynamic Leaf Breadcrumb Resolution:** User deep-links directly to `/courses/[courseId]/assignments/[assignmentId]` -> Breadcrumb shows `Courses / [Course Title] / Assignments / [Assignment Title]` via `<BreadcrumbSetter />`.
4. **Desktop Collapse State Persistence:** Toggling sidebar collapse stores preference in `localStorage` under `codeleet:course-sidebar-collapsed` and renders icon-only rail (~64px).
5. **Legacy Query-String Redirects:** Visiting `/forums?courseId=abc-123` returns a 307/308 redirect to `/courses/abc-123/forums`.

---

### Task 1: Breadcrumb Context and `CourseBreadcrumbs` Component

**Files:**
- Create: `src/components/layout/breadcrumb-context.tsx`
- Create: `src/components/layout/course-breadcrumbs.tsx`
- Create: `src/components/layout/course-breadcrumbs.test.tsx`

**Interfaces:**
- Consumes: Next.js `usePathname()`, `Link`
- Produces:
  - `BreadcrumbProvider({ children }: { children: ReactNode })`
  - `BreadcrumbSetter({ title }: { title: string })`
  - `useBreadcrumbTitle(): string | null`
  - `CourseBreadcrumbs({ courseId, courseTitle, onToggleMobileSidebar }: CourseBreadcrumbsProps)`

- [ ] **Step 1: Write failing test for `CourseBreadcrumbs` and `BreadcrumbContext`**

```tsx
// src/components/layout/course-breadcrumbs.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BreadcrumbProvider, BreadcrumbSetter } from './breadcrumb-context';
import { CourseBreadcrumbs } from './course-breadcrumbs';

vi.mock('next/navigation', () => ({
  usePathname: () => '/courses/course-123/assignments/asg-456',
}));

describe('CourseBreadcrumbs', () => {
  it('renders hierarchical breadcrumb trail with dynamic leaf title', () => {
    render(
      <BreadcrumbProvider>
        <CourseBreadcrumbs courseId="course-123" courseTitle="CS101: Python" />
        <BreadcrumbSetter title="Problem Set 1: Loops" />
      </BreadcrumbProvider>,
    );

    expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Courses' })).toHaveAttribute('href', '/courses');
    expect(screen.getByRole('link', { name: 'CS101: Python' })).toHaveAttribute('href', '/courses/course-123');
    expect(screen.getByRole('link', { name: 'Assignments' })).toHaveAttribute('href', '/courses/course-123/assignments');
    expect(screen.getByText('Problem Set 1: Loops')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/components/layout/course-breadcrumbs.test.tsx`
Expected: FAIL (modules not found)

- [ ] **Step 3: Implement `breadcrumb-context.tsx` and `course-breadcrumbs.tsx`**

Implement `BreadcrumbProvider` with a state hook to allow child components to set dynamic leaf labels, and `CourseBreadcrumbs` that maps URL segments (`assignments`, `submissions`, `grades`, `progress`, `forums`, `leaderboard`, `xp`, `ai-usage`, `instructor`) to readable labels and links, with an accessible hamburger trigger for mobile devices.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/components/layout/course-breadcrumbs.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/breadcrumb-context.tsx src/components/layout/course-breadcrumbs.tsx src/components/layout/course-breadcrumbs.test.tsx
git commit -m "feat(navigation): add breadcrumb context and hierarchical CourseBreadcrumbs component"
```

---

### Task 2: Collapsible `CourseSidebar` Component

**Files:**
- Create: `src/components/layout/course-sidebar.tsx`
- Create: `src/components/layout/course-sidebar.test.tsx`

**Interfaces:**
- Consumes: `CourseWorkspaceRecord`, `CourseMemberRole`, `CourseFeatureSetting`, `formatXp`
- Produces:
  - `CourseSidebar(props: CourseSidebarProps)`
  - Props: `{ course: { id: string; title: string; lifecycle: string }; role: 'student' | 'instructor'; userName: string; totalXp?: string | null; features: CourseFeatureSetting[]; isMobileOpen?: boolean; onCloseMobile?: () => void }`

- [ ] **Step 1: Write failing test for `CourseSidebar`**

```tsx
// src/components/layout/course-sidebar.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CourseSidebar } from './course-sidebar';

vi.mock('next/navigation', () => ({
  usePathname: () => '/courses/course-123/assignments',
}));

describe('CourseSidebar', () => {
  const defaultProps = {
    course: { id: 'course-123', title: 'Introduction to AI', lifecycle: 'active' },
    role: 'student' as const,
    userName: 'Alice Smith',
    totalXp: '2400',
    features: [
      { feature: 'assessments', enabled: true },
      { feature: 'discussions', enabled: true },
      { feature: 'xp', enabled: true },
      { feature: 'leaderboard', enabled: true },
      { feature: 'ai', enabled: true },
    ],
  };

  it('renders course title, user profile, formatted XP, and navigation links', () => {
    render(<CourseSidebar {...defaultProps} />);

    expect(screen.getByText('Introduction to AI')).toBeInTheDocument();
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('Student')).toBeInTheDocument();
    expect(screen.getByText(/2,400 XP/i)).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /assignments/i })).toHaveAttribute(
      'href',
      '/courses/course-123/assignments',
    );
    expect(screen.getByRole('link', { name: /discussions/i })).toHaveAttribute(
      'href',
      '/courses/course-123/forums',
    );
  });

  it('toggles collapse state when collapse button is clicked', () => {
    render(<CourseSidebar {...defaultProps} />);
    const toggleButton = screen.getByRole('button', { name: /collapse sidebar/i });
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('hides XP badge and link when xp feature is disabled', () => {
    const disabledXp = {
      ...defaultProps,
      features: defaultProps.features.map(f => f.feature === 'xp' ? { ...f, enabled: false } : f),
    };
    render(<CourseSidebar {...disabledXp} />);
    expect(screen.queryByText(/2,400 XP/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /my xp/i })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/components/layout/course-sidebar.test.tsx`
Expected: FAIL (modules not found)

- [ ] **Step 3: Implement `course-sidebar.tsx`**

Implement `CourseSidebar` with desktop rail/expanded toggle, `localStorage` synchronization, mobile off-canvas drawer support, user profile badge, XP pill, active route styling, and role/feature conditional links.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/components/layout/course-sidebar.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/course-sidebar.tsx src/components/layout/course-sidebar.test.tsx
git commit -m "feat(navigation): implement collapsible left CourseSidebar component"
```

---

### Task 3: Unified Server Layout (`src/app/courses/[courseId]/layout.tsx`) & Client Shell

**Files:**
- Create: `src/components/layout/course-workspace-shell.tsx`
- Create: `src/app/courses/[courseId]/layout.tsx`
- Create: `src/app/courses/[courseId]/layout.test.tsx`
- Modify: `src/features/course-workspaces/course-workspace.tsx` (remove redundant top pill links and `← All courses` back link)

**Interfaces:**
- Consumes: `getVerifiedUserRole()`, `loadOwnXp()`, `CourseSidebar`, `CourseBreadcrumbs`, `BreadcrumbProvider`
- Produces: Persistent course workspace shell for all nested `/courses/[courseId]/*` routes

- [ ] **Step 1: Write failing test for `CourseWorkspaceLayout`**

```tsx
// src/app/courses/[courseId]/layout.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CourseWorkspaceLayout from './layout';

vi.mock('@/lib/auth/verified-user', () => ({
  getVerifiedUserRole: vi.fn(),
}));

describe('CourseWorkspaceLayout', () => {
  it('renders sidebar, breadcrumbs, and children when member has access', async () => {
    // Mock user, role, course query, membership query, features, and XP
    const element = await CourseWorkspaceLayout({
      children: <div>Course Page Content</div>,
      params: Promise.resolve({ courseId: 'course-123' }),
    });
    render(element);
    expect(screen.getByText('Course Page Content')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/app/courses/[courseId]/layout.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement `course-workspace-shell.tsx` and `layout.tsx`**

1. Create `course-workspace-shell.tsx` (client component managing mobile drawer state and sidebar collapse).
2. Create `src/app/courses/[courseId]/layout.tsx` (server component) that runs queries in parallel: course record, user membership role, course feature flags, profile display name, and `loadOwnXp`.
3. Wrap `{children}` in `BreadcrumbProvider` and `CourseWorkspaceShell`.
4. Clean up `src/features/course-workspaces/course-workspace.tsx` to eliminate the redundant `← All courses` link and horizontal feature button row now provided by the sidebar and breadcrumbs.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/app/courses/[courseId]/layout.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/course-workspace-shell.tsx src/app/courses/\[courseId\]/layout.tsx src/app/courses/\[courseId\]/layout.test.tsx src/features/course-workspaces/course-workspace.tsx
git commit -m "feat(courses): add unified course workspace layout with sidebar and breadcrumbs"
```

---

### Task 4: Migrate Student Pages (`assignments`, `submissions`, `grades`, `progress`, `xp`) to `/courses/[courseId]/`

**Files:**
- Create: `src/app/courses/[courseId]/assignments/page.tsx`
- Create: `src/app/courses/[courseId]/assignments/[assignmentId]/page.tsx`
- Create: `src/app/courses/[courseId]/submissions/page.tsx`
- Create: `src/app/courses/[courseId]/submissions/[submissionId]/page.tsx`
- Create: `src/app/courses/[courseId]/submissions/[submissionId]/compare/page.tsx`
- Create: `src/app/courses/[courseId]/grades/page.tsx`
- Create: `src/app/courses/[courseId]/progress/page.tsx`
- Create: `src/app/courses/[courseId]/xp/page.tsx`
- Modify: `src/app/student/assignments/page.tsx` (redirect or preview fallback)
- Modify: `src/app/student/submissions/page.tsx` (redirect to course submissions)
- Modify: `src/app/student/grades/page.tsx` (redirect to course grades)
- Modify: `src/app/student/progress/page.tsx` (redirect to course progress)
- Modify: `src/app/student/xp/page.tsx` (redirect to course xp)

**Interfaces:**
- Consumes: Route params `{ courseId: string; assignmentId?: string; submissionId?: string }`
- Produces: Canonical course-scoped student views, removing `?courseId=` query string requirements

- [ ] **Step 1: Write failing tests for migrated student pages**

Create unit tests verifying that `/courses/[courseId]/assignments`, `/courses/[courseId]/submissions`, `/courses/[courseId]/grades`, `/courses/[courseId]/progress`, and `/courses/[courseId]/xp` read `courseId` from path parameters and mount `<BreadcrumbSetter />` on assignment detail.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test src/app/courses/\\[courseId\\]/assignments/`
Expected: FAIL

- [ ] **Step 3: Migrate student page components and implement legacy query redirects**

1. Move student views into `src/app/courses/[courseId]/...`.
2. Update them to obtain `courseId` from `params`.
3. Add `<BreadcrumbSetter title={assignment.title} />` in `assignments/[assignmentId]/page.tsx`.
4. In legacy `/student/*` pages, add redirect logic: if `?courseId=XYZ` is supplied, redirect to `/courses/XYZ/...`; if unauthenticated preview mode is active, retain preview fallback.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test src/app/courses/\\[courseId\\]/assignments/`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/courses/\[courseId\]/assignments src/app/courses/\[courseId\]/submissions src/app/courses/\[courseId\]/grades src/app/courses/\[courseId\]/progress src/app/courses/\[courseId\]/xp src/app/student
git commit -m "feat(courses): migrate student feature pages to /courses/[courseId]/ with legacy redirects"
```

---

### Task 5: Migrate Forums, Leaderboard, and AI Usage to `/courses/[courseId]/`

**Files:**
- Create: `src/app/courses/[courseId]/forums/page.tsx`
- Create: `src/app/courses/[courseId]/forums/new/page.tsx`
- Create: `src/app/courses/[courseId]/forums/[threadId]/page.tsx`
- Create: `src/app/courses/[courseId]/leaderboard/page.tsx`
- Create: `src/app/courses/[courseId]/ai-usage/page.tsx`
- Modify: `src/app/forums/page.tsx` (redirect to course forums)
- Modify: `src/app/forums/new/page.tsx` (redirect to course forums new)
- Modify: `src/app/forums/[threadId]/page.tsx` (redirect to course thread)
- Modify: `src/app/leaderboard/page.tsx` (redirect to course leaderboard)
- Modify: `src/app/ai/usage/page.tsx` (redirect to course ai-usage)

**Interfaces:**
- Consumes: Route params `{ courseId: string; threadId?: string }`
- Produces: Canonical course-scoped forum, leaderboard, and AI usage views

- [ ] **Step 1: Write failing tests for migrated forum and leaderboard pages**

Test that `/courses/[courseId]/forums`, `/courses/[courseId]/leaderboard`, and `/courses/[courseId]/ai-usage` read `courseId` from path parameters and that thread detail sets the breadcrumb title.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test src/app/courses/\\[courseId\\]/forums/`
Expected: FAIL

- [ ] **Step 3: Migrate forum, leaderboard, and AI usage pages**

1. Implement pages under `src/app/courses/[courseId]/...`.
2. Add `<BreadcrumbSetter title={thread.title} />` in thread detail.
3. Configure top-level `/forums`, `/leaderboard`, and `/ai/usage` to redirect when `courseId` query param is present.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test src/app/courses/\\[courseId\\]/forums/ src/app/courses/\\[courseId\\]/leaderboard/`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/courses/\[courseId\]/forums src/app/courses/\[courseId\]/leaderboard src/app/courses/\[courseId\]/ai-usage src/app/forums src/app/leaderboard src/app/ai
git commit -m "feat(courses): migrate forums, leaderboard, and ai-usage to /courses/[courseId]/ with legacy redirects"
```

---

### Task 6: Update Internal Feature Links, Global Verification, and E2E Tests

**Files:**
- Modify: `src/features/student-assignments/assignment-instructions.tsx`
- Modify: `src/features/student-submissions/history-list.tsx`
- Modify: `src/features/student-grades/grades-list.tsx`
- Modify: `src/features/student-progress/components.tsx`
- Modify: `src/features/forums/forum-components.tsx`
- Modify: `tests/e2e/course-workspaces.spec.ts`
- Modify: `tests/e2e/my-submissions.spec.ts`

**Interfaces:**
- Consumes: Standardized `/courses/[courseId]/...` routes
- Produces: End-to-end passing build, unit test suite, and E2E regression check

- [ ] **Step 1: Update internal feature components to use canonical `/courses/${courseId}/...` URLs**

Replace all remaining query parameter links like `${path}?courseId=${courseId}` with direct RESTful course paths.

- [ ] **Step 2: Update unit test fixtures and assertions**

Update test assertions expecting `?courseId=` to check for the clean `/courses/[courseId]/...` paths.

- [ ] **Step 3: Run full verification suite**

Run:
```bash
pnpm test
pnpm lint
pnpm build
```
Expected: All tests pass, build succeeds with zero errors.

- [ ] **Step 4: Commit**

```bash
git add src/features/ tests/
git commit -m "refactor(navigation): update internal links and tests to canonical /courses/[courseId]/ structure"
```
