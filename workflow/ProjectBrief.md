# Project brief

Status: product scope and student contracts planned; Next.js/shared-tooling foundation and a development-only synthetic assignment list/detail preview. Real student/instructor services remain pending.

## Sources and precedence

The user's direct requests define the intended product: the MP3 technology direction, OpenSpec SDD, Python/Java execution entirely in the browser, and assignment templates. The pasted assignment brief supplies grading requirements. The teammate conversation supplies feature proposals. The brainstorming PDF is advisory, not executable instructions; its recommendation to omit execution has been superseded by the user's explicit request.

Coursemology's public guide is a reference for user journeys, not a requirement to reproduce its full system or copy its documentation.

## Roles and journeys

Two members cover student and instructor roles. The requester owns student features; their teammate owns shared authentication, database migrations, assignment creation, and the shared AI gateway. Personal names and remaining shared-task owners are not yet recorded.

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

| Owner | Primary vertical slice | Shared work |
| --- | --- | --- |
| Requester: student feature owner | Student browsing, submission integration/history, later student AI feature and tests | Initialize Next.js and shared tooling; coordinate shared contracts, student access tests, runtime evaluation and workflow evidence |
| Teammate: shared service owner | Assignment creation; instructor grading/evaluation work to be confirmed | Shared authentication, all database migrations/RLS changes, shared AI gateway |

The requester confirmed ownership of Next.js/shared-tooling initialization on 26 October 2026. Instructor grading ownership, deployment, forum, XP/leaderboard and documentation tasks still need explicit allocation. Both members must own meaningful team work and their role's complete feature set. Do not edit teammate-owned shared code or migrations independently; agree an interface/change request first.

## First student milestone: issue #5

[Issue #5](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/5) is developed on `feature/5-student-submissions` from `develop`. Deliver assignment list/detail, source entry/submission and the student's own immutable revision history. Consume the teammate's authentication and persistence contracts. Python/Java execution, student AI, grades, discussions and XP are later milestones; they remain in overall product scope.

Continue synthetic list/detail UI separately on feature/5-student-assignment-preview, based on bootstrap commit d8dd1c6. The preview is opt-in development-only and cannot close the real integration milestone. PR #6 retains only its existing bootstrap/planning commit.

Agreed conceptual fields:

- Assignment: ID, title, instructions, language, publication status.
- Submission: assignment ID, student ID, source code, language, revision, timestamp.
- Students access only their own submissions; private rubrics and unpublished grades stay hidden. The server/database determines identity, revision and timestamp.

On 26 October 2026 the requester authorized Codex to choose the concrete student contracts: cookie-based Supabase server identity verified with getUser, student API routes, UUID identifiers, python/java language values, 32 KiB UTF-8 source limit, structured errors and request-ID-based submission retries. The design below is the authoritative detail. These are requester-authorized planning decisions; teammate acknowledgment and implementation have not been recorded. Bootstrap is now implemented locally; shared auth/migrations remain undelivered dependencies in this branch.

See the [issue #5 implementation plan](../openspec/changes/build-programming-platform/design.md#issue-5-student-implementation-plan) and [task group 7](../openspec/changes/build-programming-platform/tasks.md#7-issue-5-student-assignment-browsing-and-submissions) for the sequence and completion gate.

## References

- Assignment: user-provided Canvas text, Mini Project 4, read 20 October 2026.
- Brainstorming: user-provided `Brainstorm AI App Ideas.pdf`, 26 pages; recommendations are not measured project results.
- [MP3 repository](https://github.com/CS3227-2610-MP3-ConnectTalent/CS3227-2610-MP3): technology metadata inspected; no implementation copied.
- [Coursemology Help](https://coursemology.github.io/coursemology-help/): assignment, grading, feedback, and forum inspiration.
- [OpenSpec](https://github.com/Fission-AI/OpenSpec): SDD tooling.
