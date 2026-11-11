# Responsive UI audit — issue #146

- Audit started: 10 November 2026; final legacy-route matrix rerun: 11 November 2026 (Asia/Singapore)
- Branch: `fix/146-responsive-layouts`
- OpenSpec: `build-programming-platform`, task group 43
- Route source: `rg --files src/app -g page.tsx` on branch base `ca734ed`
- Scope: all rendered `page.tsx` routes, shared layouts, and responsive states; widths 320, 375, 768, 1024, and 1440 CSS px.
- Evidence status: static route/source inventory complete; five-width Chromium matrices passed for the public/account routes, fixture-backed student/instructor course routes, history/comparison, forums, preview editor, headers, and the admin user directory. Unvisited states and routes are listed below.

## Routed page inventory

There are 38 `page.tsx` routes. Dynamic routes below represent each App Router page template; route IDs must come from local synthetic fixtures or a deliberately missing/not-found case.

| # | Route | Role / route family | Fixture or access evidence | Responsive result |
|---:|---|---|---|---|
| 1 | `/` | Public landing | Public | Five-width Chromium matrix passed |
| 2 | `/sign-in` | Public auth | Public | Five-width Chromium matrix passed |
| 3 | `/sign-up` | Public auth | Public | Five-width Chromium matrix passed |
| 4 | `/forgot-password` | Public auth | Public | Five-width Chromium matrix passed |
| 5 | `/reset-password` | Public auth/recovery | Public query/token state | Base route passed at five widths; token/query recovery state not exercised |
| 6 | `/auth/course-invite` | Invite callback | Invite token/state | Base route passed at five widths; valid/expired invite state not exercised |
| 7 | `/unauthorized` | Public access state | Public | Five-width Chromium matrix passed |
| 8 | `/courses` | Student/instructor/admin directory | `courseWorkspaceFixture`; auth required | Student and instructor views passed at five widths; admin header is covered, page is `/admin` |
| 9 | `/courses/[courseId]` | Course overview | `courseWorkspaceFixture`; member role | Student and instructor fixture views passed at five widths |
| 10 | `/courses/[courseId]/ai-usage` | Course AI usage | `courseWorkspaceFixture`; AI enabled | Instructor fixture plus synthetic usage row passed at five widths; table region focusable |
| 11 | `/courses/[courseId]/assignments` | Assignment list | `courseWorkspaceFixture`; assessments enabled | Student and instructor fixture views passed at five widths |
| 12 | `/courses/[courseId]/assignments/new` | Instructor assignment form | Instructor fixture | Passed at five widths |
| 13 | `/courses/[courseId]/assignments/[assignmentId]` | Assignment details/editor/run | Assignment fixture; both languages | History fixture detail passed at five widths; preview Python/Java workspaces passed separately at five widths |
| 14 | `/courses/[courseId]/assignments/[assignmentId]/edit` | Instructor assignment editor | Assignment + instructor fixture | Passed at five widths |
| 15 | `/courses/[courseId]/assignments/[assignmentId]/practice-tests` | Instructor practice-case authoring | Published-practice fixture | Passed at five widths |
| 16 | `/courses/[courseId]/assignments/[assignmentId]/submissions` | Assignment submissions | Assignment + instructor fixture | Passed at five widths |
| 17 | `/courses/[courseId]/context-comparison` | Instructor AI context comparison | Instructor + AI feature fixture | Passed at five widths |
| 18 | `/courses/[courseId]/forums` | Course discussion list | Forum fixture | List, new, and detail routes passed at five widths with long content |
| 19 | `/courses/[courseId]/forums/new` | Discussion form | Forum member fixture | Passed at five widths; long title/message submitted |
| 20 | `/courses/[courseId]/forums/[threadId]` | Discussion detail/replies | Forum thread fixture | Passed at five widths with long title/message |
| 21 | `/courses/[courseId]/grades` | Course grades | Student/instructor grade fixture | History fixture student view passed at five widths; course-shell error/not-found states not browser exercised |
| 22 | `/courses/[courseId]/leaderboard` | Course leaderboard | Leaderboard fixture | Student and instructor fixture views passed at five widths |
| 23 | `/courses/[courseId]/manage-users` | Course membership management | Instructor fixture | Passed at five widths |
| 24 | `/courses/[courseId]/progress` | Student progress | Progress fixture | Passed at five widths in light theme; 320px dark-theme check passed |
| 25 | `/courses/[courseId]/submissions` | Course submissions | Submission/history fixture | Passed at five widths |
| 26 | `/courses/[courseId]/submissions/[submissionId]` | Submission detail/feedback | Submission/grade fixture | Passed at five widths |
| 27 | `/courses/[courseId]/submissions/[submissionId]/compare` | Revision comparison | Comparison fixture | Passed at five widths with long source; bounded diff region keyboard-focusable and horizontally scrollable |
| 28 | `/courses/[courseId]/xp` | Course XP | XP fixture | Passed at five widths |
| 29 | `/profile` | Student/instructor profile | Profile fixture; auth required | Student and instructor views passed at five widths |
| 30 | `/admin` | Platform user directory | Requires local admin fixture; local fixture created and removed per test | Passed at five widths; named table scroller is keyboard-focusable |
| 31 | `/admin/courses/[courseId]` | Platform course administration | Requires local admin + course fixture; no route-specific fixture in this pass | Not verified: admin-course state fixture unavailable |
| 32 | `/student/assignments` | Student assignment preview | `student-preview` Playwright project | Passed at five widths in responsive preview matrix |
| 33 | `/student/assignments/[assignmentId]` | Student preview editor/run | Assignment preview fixture, Python and Java | Python and Java preview workspaces passed at five widths; code and line-number scrolling stayed inside the editor |
| 34 | `/student/grades` | Legacy student redirect/page | Authenticated route contract | Authenticated redirect with course query passed at five widths |
| 35 | `/student/progress` | Legacy student redirect/page | Authenticated route contract | Authenticated redirect with course query passed at five widths |
| 36 | `/student/submissions` | Legacy student redirect/page | Authenticated route contract | Authenticated redirect passed at five widths |
| 37 | `/student/submissions/[submissionId]` | Legacy student detail route | Authenticated route contract | Authenticated redirect to fixture submission passed at five widths |
| 38 | `/student/submissions/[submissionId]/compare` | Legacy student comparison route | Authenticated route contract | Authenticated redirect to fixture comparison passed at five widths |

## Shared route states and components

| Component/state | Source or existing evidence | Responsive result |
|---|---|---|
| Authenticated app header | `src/components/layout/app-header.tsx`; Courses/Profile/User roles, sign out, theme | Fixed: brand, primary, and account groups now wrap within narrow screens. Browser checked for student, instructor, and admin at all five target widths. |
| Course breadcrumb and desktop/mobile sidebar | `src/components/layout/course-breadcrumbs.tsx`, `course-sidebar.tsx`, `mobile-sidebar-drawer.tsx`; issue #140 / PR #142 already covers long title/close overlap and keyboard dismissal | Existing 375px course journey; extend to 320, 768, 1024, and 1440 without duplicating the drawer fix. |
| Student preview navigation and editor | `src/features/student-assignments/workspace-shell.tsx`, `src/features/student-submissions/code-editor.tsx`; `assignment-preview.spec.ts` | Existing browser checks use 375px/1280px paths; broaden widths and verify contained code scrolling. |
| Admin user table | `src/features/admin-users/user-directory.tsx` | Horizontal scroller exists around four columns; touch scrolling/readability need browser verification. |
| Course AI usage table/cards | `src/app/courses/[courseId]/ai-usage/page.tsx` | Horizontal table scroller and two-column cards at base widths; verify narrow layout and table control reachability. |
| Leaderboard, revision history/comparison, grades/submissions | Feature components and route-specific Playwright fixtures | Some screens have local scroll containers; verify content/region boundaries at widths. |
| Loading/error/empty/not-found states | Route `loading.tsx`, `error.tsx`, `not-found.tsx` and shared `RouteLoading`/empty-state components | Static inventory plus unit/build checks. Browser loading, empty, unavailable, validation, and not-found states were not systematically exercised; individual grade/XP error wrapper fixes were build-verified only. |

## Existing responsive browser coverage found

- Course workspace test covers a 375px student/instructor course path and one document-width assertion.
- Student assignment preview tests cover 375px mobile behavior, existing menu/theme journeys, and editor scrolling; some workspace layout tests use 1280px.
- Profile, grades, forums, leaderboard, submissions, comparison, assignment deadlines/XP, and draft recovery have 375px or 390px mobile checks.
- Existing checks do not provide a consistent 320/375/768/1024/1440 geometry pass across all 38 pages.

## Initial static findings (not browser-confirmed)

1. Confirmed and fixed: before the change, the admin `/courses` header made the document 341px wide in a 320px viewport. Student and instructor layouts fit. The header now constrains and wraps each group and uses narrower phone padding.
2. Admin and AI usage tables rely on touch/keyboard scrolling in an `overflow-x-auto` wrapper. Confirm whether labels/controls remain perceivable and operable; do not replace with cards unless the browser evidence justifies it.
3. Wide code/diff regions already have local scrolling in parts of the app. Ensure added global checks distinguish intended region scrolling from document overflow.

## Browser review record

| Route(s) | Role/theme/state | Viewport | Browser result | Action |
|---|---|---:|---|---|
| `/courses` | Student, instructor, admin; default theme; authenticated header | 320, 375, 768, 1024, 1440 | Playwright Chromium: 15 role-width combinations passed with no document overflow; Courses/Profile/User roles where applicable, Sign out and theme controls visible; every header target at least 24×24 CSS px; first keyboard Tab focuses CodeLeet. Before fix, admin header at 320px measured 341px document width. | Fixed in `app-header.tsx`; covered by `tests/e2e/responsive-ui.spec.ts`. |

The initial public/auth-header and authenticated route pass is complete for the route rows marked passed above. Loading, empty, unavailable, validation, and not-found states were not systematically browser exercised. The browser host in initial reconnaissance was unavailable; local Playwright became available after using the existing local Supabase stack without resetting or seeding it.

## Final responsive browser evidence

All five target widths (320, 375, 768, 1024, and 1440 CSS px) were exercised in Chromium. Local synthetic fixtures were created and removed by the existing Playwright fixture helpers; local Supabase was not reset or seeded. Auth configuration was supplied from the local Supabase status in process memory, with a generated ephemeral rate-limit secret; no secret values were printed or persisted.

| Test / route set | Result | Coverage and limits |
|---|---|---|
| `responsive-ui.spec.ts` — public/account | Passed | Seven public/auth routes at all five widths; reset/invite token-specific states were not exercised. |
| `responsive-ui.spec.ts` — student/instructor course | Passed | Student and instructor course lists, profile, overview, assignment list, forums, leaderboard, AI usage with a seeded synthetic row, instructor assignment form, context comparison, and membership management. Each route’s final URL is asserted before five viewport sizes are checked. |
| `responsive-ui.spec.ts` — admin | Passed | Admin user-role directory at all five widths; named table region receives keyboard focus; its 320px scroller is confirmed wider than its viewport and ArrowRight scrolls it. Admin course detail lacked a route-specific fixture. |
| `responsive-history.spec.ts` | Passed | Student grades/progress/XP/submissions/assignment detail/submission detail/revision comparison and instructor assignment edit/practice tests/submissions. Canonical route paths and representative headings are asserted. Long diff source, bounded ArrowRight scrolling, 320px dark theme, and exact legacy student redirect destinations/headings were included. |
| `responsive-forums.spec.ts` | Passed | Discussion list/new/detail at all five widths; long title and URL-like body were submitted and rendered. |
| `responsive-assignment-preview.spec.ts` + `assignment-preview.spec.ts` | Passed (22 tests) | Student preview list and Python/Java editors at all five widths; long source lines and synchronized horizontal/vertical keyboard scrolling remained contained. |
| `course-workspaces.spec.ts` / `account-controls.spec.ts` | Passed in the focused authenticated run | Existing navigation/account behavior and mobile course drawer remained intact; prior focused authenticated batch passed 13 tests before test refactoring. |

Final tightened Chromium results: responsive UI passed 5/5 tests in 1.1 minutes; history/legacy routes passed 1/1 in 37.5 seconds; forums passed 1/1 in 12.7 seconds; the assignment-preview pair passed 22 tests (the final responsive preview test passed in 9.8 seconds). Tests assert destination URLs and route headings for fixture-backed canonical and legacy routes. Wide editor, diff, and admin table scroll are exercised through keyboard input; touch scrolling was not separately automated. An intermediate build omitted the required local public Supabase settings and disabled browser sign-in; rebuilding with the local public URL/key restored sign-in and the final authenticated suites passed. One legacy comparison test attempt initially used submission IDs instead of revision numbers; the URL fixture was corrected and rerun successfully. Loading/empty/error/not-found visual states and `/admin/courses/[courseId]` remain explicit browser coverage gaps; reset/invite token states also lack route-specific browser coverage. Passing shared layout checks do not establish those route states.

## Independent review disposition

The read-only independent review found no Critical or Important issues after follow-up. Earlier findings were addressed by asserting route-specific URLs and headings for canonical/legacy routes, checking keyboard-driven scrolling in the wide regions, opening the admin directory route explicitly, and loading preview pages once before resizing through the viewport matrix. The review did not establish touch-specific behavior, async loading/empty/error/unavailable/not-found visuals, token-authentication states, or the admin course-detail route; those remain documented gaps. Human teammate verification remains pending.

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
