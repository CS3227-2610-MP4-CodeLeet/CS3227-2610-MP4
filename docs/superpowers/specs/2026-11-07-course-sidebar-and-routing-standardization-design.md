# Course Sidebar Navigation, Breadcrumbs, and Route Standardization Design

- **Date**: 2026-11-07
- **Author**: John (Pair Programming with Antigravity)
- **Status**: Ready for Approval
- **Topic**: Refactoring course workspace navigation into a left collapsible sidebar, hierarchical breadcrumbs, and standardizing all course routes under `/courses/[courseId]`

---

## 1. Intent and Why

CodeLeet currently has fragmented navigation and route conventions:
1. **Course Activities Navigation**: Within the course workspace, feature links (Assignments, AI Usage, Context Comparison, Discussions, Leaderboard, My XP, My Progress, New Assignment) are displayed as a horizontal row of pill buttons in the header of `/courses/[courseId]`. Once a user navigates to an individual feature, they lose persistent access to the other course sections.
2. **Back Navigation**: Pages rely on isolated, inconsistent back links (such as `← All courses`, `← Assignments`, `← Back to course`), lacking hierarchical context and requiring manual link management on each screen.
3. **Route Fragmentation**: While instructor authoring tools were recently moved under `/courses/[courseId]/instructor/...`, student activities (`/student/assignments`, `/student/submissions`, `/student/grades`, `/student/xp`, `/student/progress`), forums (`/forums`), and leaderboards (`/leaderboard`) remain at the root URL tree, relying on `?courseId=` query parameters. This creates brittle URL states where a missing or stripped query parameter leaves the page without course context.

This design unifies the course experience to mirror Coursemology-style LMS ergonomics:
- A persistent, collapsible **Left Navigation Sidebar** providing instant access to course activities, displaying course branding, current user info & role, and dynamic total XP.
- A standardized **Breadcrumb Header** replacing all standalone `←` links with structured hierarchical breadcrumb navigation.
- Complete **Route Standardization** under `/courses/[courseId]/...`, eliminating the `?courseId=` query parameter pattern across all user-facing views.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
- **Left Collapsible Sidebar**: Introduce a persistent `CourseSidebar` anchored on the left side of the course workspace:
  - Header: Course avatar/initials, course title.
  - User section: User display name, course role badge (Student / Instructor).
  - XP counter: Current user's total course XP (dynamically displayed only when the course `xp` feature toggle is enabled).
  - Navigation list: Scrollable list of feature links with active route indicators (Course Home, Assignments, Submissions, Grades, Progress, Discussions, Leaderboard, My XP, AI Usage, Context Comparison, etc.).
  - Collapse / Expand toggle: Desktop button to toggle between full sidebar (~250px) and collapsed rail (~64px icon-only), with state stored in client storage (`localStorage`).
  - Mobile responsiveness: Collapses into an off-canvas slide-out drawer accessible via a hamburger menu on narrow screens (<768px).
- **Hierarchical Breadcrumbs**: Replace all `←` back links with a `CourseBreadcrumbs` component at the top of the main content area (e.g., `Courses / CS101: Introduction to Python Programming / Assignments / Problem Set 1`).
- **Unified Routing**: Move all course-scoped routes from `/student/*`, `/forums/*`, `/leaderboard`, and `/ai/usage` into `/courses/[courseId]/...`.
- **Next.js App Router Nested Layout**: Implement `src/app/courses/[courseId]/layout.tsx` to load course metadata, membership role, feature toggles, user profile, and XP once on the server, avoiding re-fetches when switching tabs.
- **Backwards Compatibility**: Redirect legacy `/student/*?courseId=...`, `/forums?courseId=...`, and `/leaderboard?courseId=...` routes to their canonical `/courses/[courseId]/...` equivalents so existing bookmarks do not break.

### Non-Goals
- Altering internal grading engine, browser-only Python runner, or Supabase RPC database functions.
- Redesigning the root platform administration page (`/admin`) or profile settings (`/profile`) beyond preserving global navigation.
- Modifying backend `/api/...` endpoints unless query parameter adjustments are needed for convenience.

### Anti-Goals
- Do not make the sidebar non-collapsible or permanently fixed without a collapse toggle.
- Do not anchor the sidebar on the right side.
- Do not reload or unmount the sidebar when navigating between tabs within the same course.
- Do not retain fragmented `?courseId=` routing for course views.

---

## 3. Approaches Considered

### Approach A: Nested Course Layout with Server Data & Collapsible Client Shell (Selected)
- **Concept**: A server-rendered `src/app/courses/[courseId]/layout.tsx` queries the course, membership, user profile, feature settings, and student XP in parallel. It passes this data to a client-side shell containing `CourseSidebar` and `CourseBreadcrumbs`.
- **Trade-offs**:
  - *Pros*: Follows idiomatic Next.js 15 App Router architecture. Sidebar state and data are preserved seamlessly across tab transitions without page flicker or re-fetching.
  - *Cons*: Requires moving page directories and updating route assertions across tests.

### Approach B: Component-Level Shell Wrapper (Rejected)
- **Concept**: Wrap each individual page in a `<CourseWorkspaceShell>` component that fetches or receives props on every page.
- **Trade-offs**:
  - *Pros*: Incremental migration without touching root route layouts.
  - *Cons*: Re-mounts the sidebar on every navigation, resetting collapse state, flickering UI, and causing duplicate network requests.

### Approach C: Global Sidebar in Root Layout (Rejected)
- **Concept**: Put the sidebar in `src/app/layout.tsx` and control its visibility conditionally with a global React context.
- **Trade-offs**:
  - *Pros*: Single layout file.
  - *Cons*: Pollutes global application shell with course-specific logic, breaking Server Component streaming and burdening non-course pages (`/profile`, `/admin`, `/courses`).

**Decision**: Approach A is selected.

---

## 4. Detailed Design & Architecture

### 4.1 Route Directory Structure
All course-specific routes are consolidated under `src/app/courses/[courseId]/`:

```text
src/app/courses/[courseId]/
├── layout.tsx                                    # Shared course workspace layout (Server Component)
├── page.tsx                                      # Course Home / Workspace Dashboard
├── assignments/
│   ├── page.tsx                                  # Course Assignments list (student view)
│   └── [assignmentId]/
│       └── page.tsx                              # Assignment workspace / problem solver
├── submissions/
│   ├── page.tsx                                  # Student submission history
│   └── [submissionId]/
│       ├── page.tsx                              # Submission detail
│       └── compare/page.tsx                      # Submission revision diff comparison
├── grades/
│   └── page.tsx                                  # Student course grades
├── progress/
│   └── page.tsx                                  # Student course progress & activity
├── xp/
│   └── page.tsx                                  # Student XP breakdown
├── forums/
│   ├── page.tsx                                  # Course discussions list
│   ├── new/page.tsx                              # Create discussion thread
│   └── [threadId]/page.tsx                       # Thread detail & replies
├── leaderboard/
│   └── page.tsx                                  # Course leaderboard
├── ai-usage/
│   └── page.tsx                                  # Course AI usage logs
└── instructor/                                   # Instructor-only workspace routes
    ├── page.tsx                                  # Instructor management & assignments
    ├── ai-context/page.tsx                       # AI prompt context comparison
    ├── assignments/
    │   ├── new/page.tsx                          # Create assignment
    │   └── [assignmentId]/
    │       ├── edit/page.tsx                     # Edit assignment & test cases
    │       ├── practice-tests/page.tsx           # Practice tests editor
    │       └── submissions/page.tsx              # All student submissions for assignment
    └── submissions/[submissionId]/page.tsx       # Instructor submission review & grading
```

### 4.2 Complete Route Migration & Clean Routing
- **Full Route Migration**: In accordance with user preference, all feature pages from `/student/*`, `/forums/*`, and `/leaderboard/*` are completely migrated under `/courses/[courseId]/`. The top-level `/student`, `/forums`, and `/leaderboard` directories are decommissioned (with lightweight redirects for legacy bookmarks or direct query-string links to `/courses/[courseId]/...`).
- **Assignment Preview Fixtures**: Unauthenticated assignment preview mode (`PLAYWRIGHT_ASSIGNMENT_FIXTURES`) is also unified under the course routing structure (e.g. synthetic course `/courses/preview/...` or handled in `courses/[courseId]/layout.tsx`), maintaining complete consistency across all environments.

### 4.3 Coexistence with Global Header (*Builder Call*)
- The existing global `AppHeader` from `src/app/courses/layout.tsx` remains docked at the top of the viewport. It preserves essential global account controls: Profile navigation, dark/light theme toggle, and Sign Out.
- `CourseSidebar` docks directly beneath `AppHeader`, filling the remaining viewport height (`min-h-[calc(100vh-65px)]`).
- The main content area sits to the right of `CourseSidebar`, beginning with `CourseBreadcrumbs` at the top of the workspace.

### 4.4 Server Layout (`layout.tsx`) Data Flow
The layout Server Component loads:
1. `user`, `role: platformRole`, `supabase` from `getVerifiedUserRole()`.
2. Course details (`title`, `description`, `lifecycle`, `is_legacy`) from `courses`.
3. Membership role (`student` or `instructor`) from `course_memberships`.
4. Feature toggles (`assessments`, `ai`, `discussions`, `xp`, `leaderboard`) from `course_features`.
5. User profile display name from `profiles`.
6. Total XP: If the course has the `xp` feature enabled and the member is a `student`, invoke `loadOwnXp(supabase, courseId, 1)` to retrieve `total_xp`.

### 4.5 Dynamic Breadcrumb Resolution (*Builder Call*)
- `CourseBreadcrumbs` automatically generates ancestor links from path segments:
  - Level 1: `Courses` (`/courses`)
  - Level 2: `[Course Title]` (`/courses/${courseId}`)
  - Level 3: `[Section Name]` (e.g. `Assignments`, `Submissions`, `Discussions`, `Leaderboard`)
- For dynamic leaf routes (e.g., specific assignment name `Problem Set 1`, discussion thread title), a lightweight client `BreadcrumbContext` / `<BreadcrumbSetter title="..." />` is provided. When leaf pages render, they publish their specific human-readable title; otherwise, it gracefully falls back to the formatted path segment.

### 4.6 Client Workspace Shell & Sidebar (`course-sidebar.tsx`)
The shell renders:
1. **Collapsible Sidebar (Left)**:
   - Width: `w-64` (expanded) or `w-16` (collapsed rail) on desktop (`md:` breakpoint and above).
   - Collapse Toggle: Top-bar or sidebar header button displaying collapse/expand icons with `aria-expanded` and tooltip. Persisted in `localStorage` under `codeleet:course-sidebar-collapsed`.
   - Course Header: Course icon/badge, course title (truncated with tooltip when collapsed).
   - User Profile Card: User avatar/initials, display name, role badge (`Student` or `Instructor`). Hidden or condensed to avatar when collapsed.
   - XP Display (if enabled): Shiny/gold XP pill (e.g. `1,250 XP`) prominently displayed beneath the user card. Condensed to `XP` badge when collapsed.
   - Navigation Menu:
     - Home (`/courses/${courseId}`)
     - Assignments (`/courses/${courseId}/assignments` for student or `/courses/${courseId}/instructor` for instructor)
     - Submissions (`/courses/${courseId}/submissions` - student only; *Builder Call*: instructors manage submissions via assignments list)
     - Grades (`/courses/${courseId}/grades` - student only)
     - Progress (`/courses/${courseId}/progress` - student only)
     - Discussions (`/courses/${courseId}/forums` - if discussions enabled)
     - Leaderboard (`/courses/${courseId}/leaderboard` - if leaderboard enabled)
     - My XP (`/courses/${courseId}/xp` - if xp enabled & student)
     - AI Usage (`/courses/${courseId}/ai-usage` - if ai enabled)
     - Context Comparison (`/courses/${courseId}/instructor/ai-context` - instructor only)
     - New Assignment (`/courses/${courseId}/instructor/assignments/new` - instructor only)
   - Active Link Styling: Highlighted background (e.g. `bg-primary/10 text-primary font-medium`) when the current pathname matches the link.
   - Mobile Drawer: On screens `< md`, the sidebar is hidden off-screen and can be toggled open as a full overlay drawer via a hamburger icon in the breadcrumbs bar.

---

## 5. Security & Access Boundaries

- Course access controls remain enforced at the server layout level: users without a valid membership in `course_memberships` are immediately redirected or denied.
- Feature flags (`assessments`, `ai`, `discussions`, `xp`, `leaderboard`) continue to guard access: if a student navigates to `/courses/${courseId}/leaderboard` when the leaderboard feature is disabled, the page or layout denies access / renders not-found.
- Private instructor rubrics, prompt contexts, and authoring tools remain restricted to `role === 'instructor'`.

---

## 6. What's Left to the Builder

- Exact SVG icon choices for each sidebar item (Lucide or inline SVGs matching the CodeLeet design palette).
- Transition animations for the sidebar collapse/expand rail (CSS width transition with `overflow-hidden`).
- Minor query parameter cleanup in tests and API utilities.
