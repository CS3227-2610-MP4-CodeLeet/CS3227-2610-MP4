# Responsive UI audit — issue #146

- Date: 10 November 2026 (Asia/Singapore)
- Branch: `fix/146-responsive-layouts`
- OpenSpec: `build-programming-platform`, task group 43
- Route source: `rg --files src/app -g page.tsx` on branch base `ca734ed`
- Scope: all rendered `page.tsx` routes, shared layouts, and responsive states; widths 320, 375, 768, 1024, and 1440 CSS px.
- Evidence status: static route/source inventory complete; browser geometry checks not yet run.

## Routed page inventory

There are 38 `page.tsx` routes. Dynamic routes below represent each App Router page template; route IDs must come from local synthetic fixtures or a deliberately missing/not-found case.

| # | Route | Role / route family | Fixture or access evidence | Responsive result |
|---:|---|---|---|---|
| 1 | `/` | Public landing | Public | Not checked in browser |
| 2 | `/sign-in` | Public auth | Public | Not checked in browser |
| 3 | `/sign-up` | Public auth | Public | Not checked in browser |
| 4 | `/forgot-password` | Public auth | Public | Not checked in browser |
| 5 | `/reset-password` | Public auth/recovery | Public query/token state | Not checked in browser |
| 6 | `/auth/course-invite` | Invite callback | Invite token/state | Not checked in browser |
| 7 | `/unauthorized` | Public access state | Public | Not checked in browser |
| 8 | `/courses` | Student/instructor/admin directory | `courseWorkspaceFixture`; auth required | Not checked in browser |
| 9 | `/courses/[courseId]` | Course overview | `courseWorkspaceFixture`; member role | Not checked in browser |
| 10 | `/courses/[courseId]/ai-usage` | Course AI usage | `courseWorkspaceFixture`; AI enabled | Not checked in browser |
| 11 | `/courses/[courseId]/assignments` | Assignment list | `courseWorkspaceFixture`; assessments enabled | Not checked in browser |
| 12 | `/courses/[courseId]/assignments/new` | Instructor assignment form | Instructor fixture | Not checked in browser |
| 13 | `/courses/[courseId]/assignments/[assignmentId]` | Assignment details/editor/run | Assignment fixture; both languages | Not checked in browser |
| 14 | `/courses/[courseId]/assignments/[assignmentId]/edit` | Instructor assignment editor | Assignment + instructor fixture | Not checked in browser |
| 15 | `/courses/[courseId]/assignments/[assignmentId]/practice-tests` | Instructor practice-case authoring | Published-practice fixture | Not checked in browser |
| 16 | `/courses/[courseId]/assignments/[assignmentId]/submissions` | Assignment submissions | Assignment + instructor fixture | Not checked in browser |
| 17 | `/courses/[courseId]/context-comparison` | Instructor AI context comparison | Instructor + AI feature fixture | Not checked in browser |
| 18 | `/courses/[courseId]/forums` | Course discussion list | Forum fixture | Not checked in browser |
| 19 | `/courses/[courseId]/forums/new` | Discussion form | Forum member fixture | Not checked in browser |
| 20 | `/courses/[courseId]/forums/[threadId]` | Discussion detail/replies | Forum thread fixture | Not checked in browser |
| 21 | `/courses/[courseId]/grades` | Course grades | Student/instructor grade fixture | Not checked in browser |
| 22 | `/courses/[courseId]/leaderboard` | Course leaderboard | Leaderboard fixture | Not checked in browser |
| 23 | `/courses/[courseId]/manage-users` | Course membership management | Instructor fixture | Not checked in browser |
| 24 | `/courses/[courseId]/progress` | Student progress | Progress fixture | Not checked in browser |
| 25 | `/courses/[courseId]/submissions` | Course submissions | Submission/history fixture | Not checked in browser |
| 26 | `/courses/[courseId]/submissions/[submissionId]` | Submission detail/feedback | Submission/grade fixture | Not checked in browser |
| 27 | `/courses/[courseId]/submissions/[submissionId]/compare` | Revision comparison | Comparison fixture | Not checked in browser |
| 28 | `/courses/[courseId]/xp` | Course XP | XP fixture | Not checked in browser |
| 29 | `/profile` | Student/instructor profile | Profile fixture; auth required | Not checked in browser |
| 30 | `/admin` | Platform user directory | Requires local admin fixture; no matching route fixture identified in initial scan | Not checked in browser |
| 31 | `/admin/courses/[courseId]` | Platform course administration | Requires local admin + course fixture | Not checked in browser |
| 32 | `/student/assignments` | Student assignment preview | `student-preview` Playwright project | Not checked in browser |
| 33 | `/student/assignments/[assignmentId]` | Student preview editor/run | Assignment preview fixture, Python and Java | Not checked in browser |
| 34 | `/student/grades` | Legacy student redirect/page | Authenticated route contract | Not checked in browser |
| 35 | `/student/progress` | Legacy student redirect/page | Authenticated route contract | Not checked in browser |
| 36 | `/student/submissions` | Legacy student redirect/page | Authenticated route contract | Not checked in browser |
| 37 | `/student/submissions/[submissionId]` | Legacy student detail route | Authenticated route contract | Not checked in browser |
| 38 | `/student/submissions/[submissionId]/compare` | Legacy student comparison route | Authenticated route contract | Not checked in browser |

## Shared route states and components

| Component/state | Source or existing evidence | Responsive result |
|---|---|---|
| Authenticated app header | `src/components/layout/app-header.tsx`; Courses/Profile/User roles, sign out, theme | Source has wrapping top-level header; inner navigation groups are non-wrapping. Needs 320px browser check. |
| Course breadcrumb and desktop/mobile sidebar | `src/components/layout/course-breadcrumbs.tsx`, `course-sidebar.tsx`, `mobile-sidebar-drawer.tsx`; issue #140 / PR #142 already covers long title/close overlap and keyboard dismissal | Existing 375px course journey; extend to 320, 768, 1024, and 1440 without duplicating the drawer fix. |
| Student preview navigation and editor | `src/features/student-assignments/workspace-shell.tsx`, `src/features/student-submissions/code-editor.tsx`; `assignment-preview.spec.ts` | Existing browser checks use 375px/1280px paths; broaden widths and verify contained code scrolling. |
| Admin user table | `src/features/admin-users/user-directory.tsx` | Horizontal scroller exists around four columns; touch scrolling/readability need browser verification. |
| Course AI usage table/cards | `src/app/courses/[courseId]/ai-usage/page.tsx` | Horizontal table scroller and two-column cards at base widths; verify narrow layout and table control reachability. |
| Leaderboard, revision history/comparison, grades/submissions | Feature components and route-specific Playwright fixtures | Some screens have local scroll containers; verify content/region boundaries at widths. |
| Loading/error/empty/not-found states | Route `loading.tsx`, `error.tsx`, `not-found.tsx` and shared `RouteLoading`/empty-state components | Static inventory only; browser state coverage pending. |

## Existing responsive browser coverage found

- Course workspace test covers a 375px student/instructor course path and one document-width assertion.
- Student assignment preview tests cover 375px mobile behavior, existing menu/theme journeys, and editor scrolling; some workspace layout tests use 1280px.
- Profile, grades, forums, leaderboard, submissions, comparison, assignment deadlines/XP, and draft recovery have 375px or 390px mobile checks.
- Existing checks do not provide a consistent 320/375/768/1024/1440 geometry pass across all 38 pages.

## Initial static findings (not browser-confirmed)

1. The shared `AppHeader` uses `flex-wrap` on the outer header while each navigation group is a non-wrapping flex row. At 320px, especially for admin controls, the controls may become cramped or overflow. Reproduce before changing it.
2. Admin and AI usage tables rely on touch/keyboard scrolling in an `overflow-x-auto` wrapper. Confirm whether labels/controls remain perceivable and operable; do not replace with cards unless the browser evidence justifies it.
3. Wide code/diff regions already have local scrolling in parts of the app. Ensure added global checks distinguish intended region scrolling from document overflow.

## Browser review record

| Route(s) | Role/theme/state | Viewport | Browser result | Action |
|---|---|---:|---|---|
| Pending | Pending | 320, 375, 768, 1024, 1440 | Browser host unavailable during initial reconnaissance; no rendered-page claim made. | Use local Playwright projects/CI fixtures and update this table with exact results. |

## Route layouts and async boundaries

- `src/app/admin/layout.tsx`
- `src/app/admin/loading.tsx`
- `src/app/courses/[courseId]/ai-usage/loading.tsx`
- `src/app/courses/[courseId]/assignments/[assignmentId]/edit/loading.tsx`
- `src/app/courses/[courseId]/assignments/[assignmentId]/loading.tsx`
- `src/app/courses/[courseId]/assignments/[assignmentId]/practice-tests/loading.tsx`
- `src/app/courses/[courseId]/assignments/[assignmentId]/submissions/loading.tsx`
- `src/app/courses/[courseId]/assignments/error.tsx`
- `src/app/courses/[courseId]/assignments/loading.tsx`
- `src/app/courses/[courseId]/assignments/new/loading.tsx`
- `src/app/courses/[courseId]/assignments/not-found.tsx`
- `src/app/courses/[courseId]/context-comparison/loading.tsx`
- `src/app/courses/[courseId]/forums/[threadId]/loading.tsx`
- `src/app/courses/[courseId]/forums/error.tsx`
- `src/app/courses/[courseId]/forums/loading.tsx`
- `src/app/courses/[courseId]/forums/new/loading.tsx`
- `src/app/courses/[courseId]/forums/not-found.tsx`
- `src/app/courses/[courseId]/grades/error.tsx`
- `src/app/courses/[courseId]/grades/loading.tsx`
- `src/app/courses/[courseId]/grades/not-found.tsx`
- `src/app/courses/[courseId]/layout.tsx`
- `src/app/courses/[courseId]/leaderboard/error.tsx`
- `src/app/courses/[courseId]/leaderboard/loading.tsx`
- `src/app/courses/[courseId]/loading.tsx`
- `src/app/courses/[courseId]/manage-users/loading.tsx`
- `src/app/courses/[courseId]/progress/error.tsx`
- `src/app/courses/[courseId]/progress/loading.tsx`
- `src/app/courses/[courseId]/submissions/[submissionId]/compare/loading.tsx`
- `src/app/courses/[courseId]/submissions/[submissionId]/loading.tsx`
- `src/app/courses/[courseId]/submissions/error.tsx`
- `src/app/courses/[courseId]/submissions/loading.tsx`
- `src/app/courses/[courseId]/xp/error.tsx`
- `src/app/courses/[courseId]/xp/loading.tsx`
- `src/app/courses/layout.tsx`
- `src/app/courses/loading.tsx`
- `src/app/layout.tsx`
- `src/app/profile/error.tsx`
- `src/app/profile/layout.tsx`
- `src/app/profile/loading.tsx`
- `src/app/student/assignments/[assignmentId]/loading.tsx`
- `src/app/student/assignments/error.tsx`
- `src/app/student/assignments/layout.tsx`
- `src/app/student/assignments/loading.tsx`
- `src/app/student/assignments/not-found.tsx`
- `src/app/student/submissions/loading.tsx`

Count: 45 shared layout/loading/error/not-found files.
