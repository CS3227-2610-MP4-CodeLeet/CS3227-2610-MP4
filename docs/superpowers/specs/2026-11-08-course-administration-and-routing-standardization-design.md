# Course Administration Page, Role-Aware Routing, Student Preview, and Context Comparison Clarity Design

- **Date**: 2026-11-08
- **Author**: John (Pair Programming with Antigravity)
- **Status**: Ready for Review / Approval
- **Topic**: Modularizing user administration under `/manage-users`, introducing an Administration sidebar group, removing `/instructor` in favor of role-aware canonical routes, adding instructor student-perspective preview, and clarifying the educational/engineering value of Context Comparison.

---

## 1. Intent and Why

As the platform evolves towards full parity with professional LMS conventions (specifically following Coursemology's reference architecture), several navigational and architectural opportunities have been identified:

1. **Course Overview Overload**:
   - Currently, `/courses/[courseId]` serves as a catch-all workspace containing course details, feature toggles, the user roster, invitation forms, join code management, and lifecycle controls.
   - For an instructor, managing users is a distinct operational task. Onboarding new students via a join code or reviewing invitations deserves a dedicated, focused administrative view.

2. **User Onboarding Hierarchy**:
   - In typical classroom workflows, creating, copying, and sharing the self-service **Student join code** is the most frequent and lightweight action an instructor performs.
   - Placing the compact join code block *above* the potentially long "People" (roster/invitations) table ensures instructors can access and rotate codes immediately without scrolling past dozens of students.

3. **URL Canonization & Removing `/instructor`**:
   - In modern web applications and LMS platforms (such as Canvas and Coursemology), URLs are resource-oriented, not role-oriented (`/courses/[courseId]/assignments`, `/courses/[courseId]/submissions`).
   - The `/instructor` path segment was an artifact of early vertical slicing. Removing it unifies routes under canonical paths where Next.js Server Components dynamically detect the user's course membership and render the appropriate view.
   - Legacy links like `← Course workspace` at the top of the assignments view become redundant clutter because the persistent `CourseSidebar` and top `CourseBreadcrumbs` already provide robust contextual navigation.

4. **Instructor Student-Perspective Preview**:
   - Instructors need to verify instructions, code templates, and test cases exactly as a student experiences them before publishing an assignment.
   - Adding a dedicated "Preview" button on each assignment in the instructor list allows seamless navigation to `/courses/[courseId]/assignments/[assignmentId]` in a sandboxed "Preview Mode".

5. **Context Comparison Educational & Engineering Clarity**:
   - The Context Comparison view (`ai-context`) directly fulfills the CS3227 module grading requirements regarding **Context Engineering** and **Resource-Aware AI**.
   - However, the current UI copy is overly terse. Making the engineering purpose explicit—benchmarking token consumption, response latency, and rubric scoring fidelity between a focused prompt and an uncurated baseline—provides crucial clarity to instructors and course evaluators.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
- **Dedicated Manage Users Page (`/courses/[courseId]/manage-users`)**:
  - Move "Student join code" and "People" (members and invitations) to this dedicated page.
  - Position the "Student join code" block *above* the "People" block.
  - Enforce instructor/owner-only access (404/redirect for non-instructors).
  - Clean up `/courses/[courseId]` (Course Overview) so it focuses strictly on Course Details, Feature Toggles, and Course Lifecycle (transfer ownership, archive, delete).
- **Administration Sidebar Section**:
  - In `CourseSidebar`, add an **Administration** section visible only to course instructors.
  - Place **Manage Users** (with an appropriate icon, e.g. user + cog) and **Context comparison** under this Administration group.
- **Canonical Role-Aware Routing**:
  - Unify `/courses/[courseId]/assignments` so that:
    - Instructors see the management view (with "+ New assignment", Edit, Submissions, and Preview buttons).
    - Students see the student assignment list (due dates, status, XP, solve links).
  - Remove the obsolete `← Course workspace` link from the top of the assignments view.
  - Migrate child instructor routes:
    - `/courses/[courseId]/assignments/new`
    - `/courses/[courseId]/assignments/[assignmentId]/edit`
    - `/courses/[courseId]/assignments/[assignmentId]/submissions`
    - `/courses/[courseId]/assignments/[assignmentId]/practice-tests`
  - Completely remove and clean up the `/courses/[courseId]/instructor` route directory without retaining legacy redirect shims.
- **Assignment Preview for Instructors**:
  - Add a "Preview" link/button on each assignment card in the instructor assignments list.
  - In `/courses/[courseId]/assignments/[assignmentId]`, allow instructors to view the assignment in "Preview Mode" with an informative header banner.
  - Allow instructors to preview both published assignments and unpublished drafts owned by the course.
- **Enhanced Context Comparison View**:
  - Direct route at `/courses/[courseId]/context-comparison` (deleting `/courses/[courseId]/instructor/ai-context`).
  - Add an informative, well-designed header banner explaining the **Context Engineering** concept:
    - Purpose: Benchmarking token efficiency and grading consistency between a focused prompt and a bloated baseline.
    - Definitions: Explaining what "Focused Context (Optimized)" vs. "Broader Context (Baseline)" mean.
    - Metrics: Highlighting token reduction percentage and rubric fidelity.

### Non-Goals
- Changing database schemas, RLS policies, or Supabase RPCs (existing `list_course_members`, `list_course_invitations`, join code APIs already work reliably).
- Altering the underlying AI evaluation engine or prompt contracts beyond UI presentation and explanations.
- Allowing students to access `/manage-users` or `/context-comparison`.

### Anti-Goals
- Do not let instructor preview actions accidentally overwrite real student grades or pollute student revision histories.
- Do not make the sidebar cluttered: maintain clean visual spacing and collapse behavior.

---

## 3. Approaches Considered

### Approach A: Full Unified REST Architecture with Coursemology-Style Administration (Selected)
- **Concept**:
  - Create `/courses/[courseId]/manage-users` with Join Code on top and People below.
  - Add an "Administration" group in `CourseSidebar` (matching Coursemology's visual hierarchy).
  - Unify `/courses/[courseId]/assignments` using server-side role detection.
  - Support instructor preview on `/courses/[courseId]/assignments/[assignmentId]`.
  - Upgrade Context Comparison UI with clear educational explanations and token savings metrics.
  - Completely delete `/courses/[courseId]/instructor/*` routes, migrating all links and tests directly to canonical routes.
- **Trade-offs**:
  - *Pros*: Cleanest RESTful architecture, superior UX matching reference platform, explicit educational demonstration of Context Engineering for module grading.
  - *Cons*: Touches several routing files and requires updating corresponding route tests.

### Approach B: Light Route Aliasing & Flat Sidebar (Rejected)
- **Concept**:
  - Add `/manage-users` as a flat link in the sidebar without grouping under Administration.
  - Alias `/instructor` without deep unification.
  - Keep Context Comparison terse.
- **Trade-offs**:
  - *Pros*: Fewer file changes.
  - *Cons*: Misses the clean hierarchical structure of Coursemology shown in the user's reference image and fails to capitalize on the Context Engineering reflection requirements.

**Decision**: Approach A is selected.

---

## 4. Detailed Component & Routing Specifications

### 4.1 New Route: `/courses/[courseId]/manage-users`
- **File**: `src/app/courses/[courseId]/manage-users/page.tsx`
- **Access Guard**:
  - Requires authenticated user.
  - Course access role must be `'instructor'`.
  - If student or non-member, triggers `notFound()`.
- **Layout / View**:
  - Header:
    - Title: `Manage Users`
    - Subtitle: `Manage student join codes, course staff, and enrolled students.`
  - Section 1 (Top): `JoinCodeManagement`
    - Create, rotate, and revoke join code with instant code display.
  - Section 2 (Bottom): `CoursePeople`
    - Member table with role badges, removal controls, and email invitation form.
  - Breadcrumb: `Courses / [Course Title] / Administration / Manage Users`.

### 4.2 Updated Route: `/courses/[courseId]` (Course Overview)
- **File**: `src/features/course-workspaces/course-workspace.tsx` & `course-access.tsx`
- **Changes**:
  - Remove `CoursePeople` and `JoinCodeManagement` from the overview page.
  - Retain `CourseDetails` (title, description), `CourseFeatures` (feature toggles), `OwnershipTransfer`, and `CourseLifecycle` (archive/delete).
  - Add an administrative quick-link card or callout leading directly to `Manage Users`.

### 4.3 Sidebar Update: `CourseSidebar`
- **File**: `src/components/layout/course-sidebar.tsx`
- **Changes**:
  - Divide navigation into two logical groups:
    1. **Course Activities** (Home, Assignments, Submissions, Discussions, Leaderboard, AI usage, etc.)
    2. **Administration** (Only rendered if `role === 'instructor'`):
       - 👤⚙️ **Manage Users** (`/courses/[courseId]/manage-users`)
       - ⚖️ **Context comparison** (`/courses/[courseId]/context-comparison`)
  - Mobile Drawer & Collapsed Rail support:
    - In collapsed rail mode, render clean divider or tooltip grouping so icons remain easily distinguishable.

### 4.4 Unified `/courses/[courseId]/assignments`
- **File**: `src/app/courses/[courseId]/assignments/page.tsx`
- **Behavior**:
  - Checks course access role:
    - If `role === 'instructor'`: Renders instructor view (formerly `instructor/page.tsx`), featuring "+ New assignment", assignment cards with publication status, XP, due date, Edit, Submissions, and **Preview** actions.
    - If `role === 'student'`: Renders student view with due dates, submissions status, XP, and Solve actions.
  - Removes the redundant `← Course workspace` link from the top of the page.
- **Assignment Preview Action**:
  - Instructor cards display: `[Preview] · [Edit] · [Submissions]`.
  - `Preview` links to `/courses/[courseId]/assignments/[assignmentId]`.

### 4.5 Assignment Detail Page with Instructor Preview
- **File**: `src/app/courses/[courseId]/assignments/[assignmentId]/page.tsx`
- **Behavior**:
  - Update `assertStudentAssessmentsAccess` to allow instructors as well as students.
  - If `role === 'instructor'`:
    - Allow loading both `published` and `draft` assignments owned by the course.
    - Display an alert banner at the top:
      > **Preview Mode**: You are viewing this assignment from the student's perspective. Code execution in the browser runner is active for testing.
    - Render `SubmissionForm` in practice/preview mode:
      - Browser runner and test cases remain fully functional for testing student solutions.
      - The "Submit revision" button is disabled with an explanatory tooltip/status: `"Submission disabled in preview mode"`.
      - Real student revision history is hidden to prevent polluting student submission data.
  - Practice test case access (`GET /api/student/assignments/[assignmentId]/test-cases` or server query):
    - Update authorization check so course instructors can read test cases for their owned assignments (including drafts) during preview.

### 4.6 Role-Aware Submissions Routing (`/courses/[courseId]/submissions`)
- **Files**:
  - `src/app/courses/[courseId]/submissions/page.tsx`
  - `src/app/courses/[courseId]/submissions/[submissionId]/page.tsx`
- **Behavior**:
  - `/courses/[courseId]/submissions`:
    - If `role === 'student'`: Renders student submission history ("My submissions").
    - If `role === 'instructor'`: Renders instructor submissions review dashboard (with assignment filters, student search, grading status, and links to evaluate submissions).
  - `/courses/[courseId]/submissions/[submissionId]`:
    - If `role === 'student'`: Renders student submission review view.
    - If `role === 'instructor'`: Renders instructor grading & rubric evaluation view.
  - Legacy `/instructor` routes are completely deleted and clean. All internal links and test suites target canonical `/submissions` routes directly.

### 4.7 Route Migration & Complete Deletion of `/instructor`
- Migrate instructor assignment routes:
  - `src/app/courses/[courseId]/instructor/assignments/new` → `src/app/courses/[courseId]/assignments/new`
  - `src/app/courses/[courseId]/instructor/assignments/[assignmentId]/edit` → `src/app/courses/[courseId]/assignments/[assignmentId]/edit`
  - `src/app/courses/[courseId]/instructor/assignments/[assignmentId]/submissions` → `src/app/courses/[courseId]/assignments/[assignmentId]/submissions`
  - `src/app/courses/[courseId]/instructor/assignments/[assignmentId]/practice-tests` → `src/app/courses/[courseId]/assignments/[assignmentId]/practice-tests`
- Migrate submissions routes:
  - `src/app/courses/[courseId]/instructor/submissions` → `src/app/courses/[courseId]/submissions` (role-aware)
  - `src/app/courses/[courseId]/instructor/submissions/[submissionId]` → `src/app/courses/[courseId]/submissions/[submissionId]` (role-aware)
- Migrate AI context route:
  - `src/app/courses/[courseId]/instructor/ai-context` → `src/app/courses/[courseId]/context-comparison`
- Completely remove the `src/app/courses/[courseId]/instructor` directory after migration is complete.

### 4.8 Context Comparison Content Enhancement
- **Files**:
  - `src/app/courses/[courseId]/context-comparison/page.tsx`
  - `src/features/codementor/context-comparison.tsx`
- **Enhancements**:
  - Add an educational callout box explaining the two strategies:
    - **Focused Context (Optimized)**: Curated prompt containing strictly assignment instructions, private rubric criteria, and student source code. Represents optimal token economy.
    - **Broader Context (Baseline)**: Injects peripheral metadata (timestamps, publication statuses, revision numbers) to demonstrate the cost of prompt bloat.
  - Add visual metric comparisons:
    - Badge showing **Token Reduction (%)**: e.g., `42% fewer input tokens`.
    - Note on **Rubric Scoring Fidelity**: verifying whether suggested scores and feedback quality remain consistent.
    - Explicit note: *Suggestions are advisory; AI never publishes grades automatically.*

---

## 5. Verification Plan

1. **Routing & Access Tests**:
   - Verify `/courses/[courseId]/manage-users` returns 200 for instructors and 404/redirects for students.
   - Verify `/courses/[courseId]/assignments` renders the instructor management view for instructors and student view for students.
   - Verify `/courses/[courseId]/assignments/[assignmentId]` allows instructors to preview assignments (both published and drafts) with the preview banner.
   - Verify all `/courses/[courseId]/instructor/*` routes are removed and no broken links exist.
2. **UI & Visual Verification**:
   - Sidebar renders the "Administration" group with Manage Users and Context Comparison for instructors.
   - On the Manage Users page, "Student join code" appears above "People".
   - Context Comparison displays the enhanced explanatory cards and token reduction metrics.
3. **Automated Test Suite**:
   - Run existing unit and integration test suites: `pnpm test`.
   - Update tests that previously asserted `/courses/[courseId]/instructor` links.
   - Run typecheck and lint: `pnpm typecheck` and `pnpm lint`.
