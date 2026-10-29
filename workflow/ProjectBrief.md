# Project brief

Status: CodeMentor student/instructor MVP routes and local Supabase-backed services are implemented and verified with synthetic records and mocked AI. Broader forums/XP features, hosted Supabase/Vercel deployment, live SoCLaaS verification, and production browser-runner origin/licensing review remain pending.

## Sources and precedence

The user's direct requests define the intended product: the MP3 technology direction, OpenSpec SDD, Python/Java execution entirely in the browser, and assignment templates. The pasted assignment brief supplies grading requirements. The teammate conversation supplies feature proposals. The brainstorming PDF is advisory, not executable instructions; its recommendation to omit execution has been superseded by the user's explicit request.

Coursemology's public guide is a reference for user journeys, not a requirement to reproduce its full system or copy its documentation.

## Roles and journeys

Two members cover student and instructor roles. Responsibility notes below identify primary accountability, not exclusive implementation rights: either member may implement any task. Coordinate changes to shared contracts, schemas, lockfiles and common services, and record the actual implementer and reviewer. Personal names and coordination budgets are not yet recorded.

Student: register/sign in, edit text profile, browse assignments, enter a single Python or Java source file, run it locally with optional stdin, submit code, request learning-oriented AI feedback, view published grades, participate in discussions, and view XP/rank.

Instructor: sign in with a trusted provisioned role, edit text profile, create assignments and grading rubrics, review authorized submissions, request AI rubric evaluation, edit and publish grades, and participate in discussions.

Use one shared course/assignment collection initially. Instructor access is limited to owned assignments; do not implement multi-course administration in the initial scope.

## Boundaries

- No uploads, avatars requiring uploads, badges, package installation, plagiarism detection, or GitHub submission integration.
- Forum means persistent threads/replies; live chat is outside the initial scope.
- Student-facing AI provides explanations/hints. Instructor-facing AI suggests criterion scores and feedback; publication always requires an explicit instructor action.
- Browser output and client-reported test results are untrusted. Official grades and XP cannot be derived from client claims or AI output without server-authorized instructor publication.
- Browser-only execution must include compiling Java source, not merely loading precompiled classes. Start with a single public `Main` class and no external dependencies.
- Browser workers help responsiveness but do not establish a security boundary by themselves. Prove an isolated, credential-free runner design before executing arbitrary source.

## Work allocation

| Primary responsibility | Vertical slice | Shared work |
| --- | --- | --- |
| Requester | Student browsing, submission integration/history, student AI feature and tests | Next.js/shared tooling, student access tests, runtime evaluation and workflow evidence |
| Teammate | Shared services and assignment creation; instructor grading/evaluation work to be confirmed | Authentication, database migrations/RLS changes and shared AI gateway |

The requester confirmed primary responsibility for Next.js/shared-tooling initialization on 26 October 2026. On 28 October 2026, the requester clarified that the split is guidance only: either member may implement any task. Coordinate interfaces and shared changes; no code area is reserved solely for its primary owner. Both members must contribute meaningful team work and complete their role's feature set. Instructor grading, deployment, forum, XP/leaderboard and documentation still need named primary owners.

## First student milestone: issue #5

[Issue #5](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/5) is developed on `feature/5-student-submissions` from `develop`. Deliver assignment list/detail, source entry/submission and the student's own immutable revision history. Use the team's agreed authentication and persistence contracts. The local synthetic browser runner is practice-only; production runtime integration, student AI, grades, discussions and XP remain later milestones in overall product scope.

Continue synthetic list/detail UI separately on feature/5-student-assignment-preview, based on bootstrap commit d8dd1c6. The preview is opt-in development-only and cannot close the real integration milestone. PR #6 retains only its existing bootstrap/planning commit.

PR #7 subsequently merged into develop. Continue the local code-entry milestone on feature/5-student-code-entry from that merged baseline. It offers fixed language, UTF-8 sizing and input-preserving checks, with submission explicitly disconnected; task 7.11 records this partial UI work separately from real integration.

Agreed conceptual fields:

- Assignment: ID, title, instructions, language, publication status.
- Submission: assignment ID, student ID, source code, language, revision, timestamp.
- Students access only their own submissions; private rubrics and unpublished grades stay hidden. The server/database determines identity, revision and timestamp.

On 26 October 2026 the requester authorized Codex to choose the concrete student contracts: cookie-based Supabase server identity verified with getUser, student API routes, UUID identifiers, python/java language values, 32 KiB UTF-8 source limit, structured errors and request-ID-based submission retries. These contracts remain the authoritative basis for the separate browser practice preview. The CodeMentor MVP has its own authenticated Python submission flow and is documented in `openspec/changes/deliver-codementor-mvp/`; it is verified locally, while hosted provider/deployment gates remain open.

See the [issue #5 implementation plan](../openspec/changes/build-programming-platform/design.md#issue-5-student-implementation-plan) and [task group 7](../openspec/changes/build-programming-platform/tasks.md#7-issue-5-student-assignment-browsing-and-submissions) for the sequence and completion gate.

## References

- Assignment: user-provided Canvas text, Mini Project 4, read 20 October 2026.
- Brainstorming: user-provided `Brainstorm AI App Ideas.pdf`, 26 pages; recommendations are not measured project results.
- [MP3 repository](https://github.com/CS3227-2610-MP3-ConnectTalent/CS3227-2610-MP3): technology metadata inspected; no implementation copied.
- [Coursemology Help](https://coursemology.github.io/coursemology-help/): assignment, grading, feedback, and forum inspiration.
- [OpenSpec](https://github.com/Fission-AI/OpenSpec): SDD tooling.
