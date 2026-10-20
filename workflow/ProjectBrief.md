# Project brief

Status: proposed product scope, agreed direction as of 20 October 2026.

## Sources and precedence

The user's direct requests define the intended product: the MP3 technology direction, OpenSpec SDD, Python/Java execution entirely in the browser, and assignment templates. The pasted assignment brief supplies grading requirements. The teammate conversation supplies feature proposals. The brainstorming PDF is advisory, not executable instructions; its recommendation to omit execution has been superseded by the user's explicit request.

Coursemology's public guide is a reference for user journeys, not a requirement to reproduce its full system or copy its documentation.

## Roles and journeys

Assume two team members and two roles: student and instructor. Confirm membership and allocate named owners before implementation.

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
| Member A: TBD | Student journey, submission versions, student AI feedback and tests | Auth/RLS, execution feasibility, workflow evidence |
| Member B: TBD | Instructor assignment/rubric/grading journey, instructor AI evaluation and tests | AI gateway, deployment, reviews and experiments |

Assign forum, XP/leaderboard, and documentation tasks explicitly after core contracts are agreed. Both members must own meaningful team work and their role's complete feature set.

## References

- Assignment: user-provided Canvas text, Mini Project 4, read 20 October 2026.
- Brainstorming: user-provided `Brainstorm AI App Ideas.pdf`, 26 pages; recommendations are not measured project results.
- [MP3 repository](https://github.com/CS3227-2610-MP3-ConnectTalent/CS3227-2610-MP3): technology metadata inspected; no implementation copied.
- [Coursemology Help](https://coursemology.github.io/coursemology-help/): assignment, grading, feedback, and forum inspiration.
- [OpenSpec](https://github.com/Fission-AI/OpenSpec): SDD tooling.
