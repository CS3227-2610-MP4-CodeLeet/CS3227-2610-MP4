# Session: 27 October 2026, student code-entry preview

- Timezone: Asia/Singapore
- Participants: requester and Codex main session; no specialist subagents
- Human verification: pending

## Request, ownership and branch

The requester accepted the proposed next step and asked Codex to implement the student code-entry form. Confirmed PR #7 had merged into develop, fetched current refs and created feature/5-student-code-entry from develop at 4a292c8. Existing working tree was clean. No environment file contents were read or changed.

Used the OpenSpec apply workflow for build-programming-platform, starting at 2/38 tasks complete, and read repository brief/process, relevant change artifacts and local Next.js client/form guidance. Added the bounded local UI milestone as task 7.11 so real submission tasks remain unclaimed. Shared auth, migrations, assignment creation and AI gateway remain teammate-owned.

## Changes

Added a client code-entry section to the existing development-only guarded detail pages, with fixed assignment language, textarea, live UTF-8 byte counter, a local check action, associated accessible errors and a disabled Submit code button. Code stays in React page state; no native form, network/storage operation, execution or fake successful submission is added. Key the editor by assignment ID to isolate different assignments.

Reusable pure validation rejects blank source, NUL, malformed Unicode and text above 32,768 UTF-8 bytes without changing/truncating entered text. Local checks do not verify syntax/correctness or replace server/database validation. Updated the existing no-submit-button test to expect the deliberately disabled button. Extended production denial to assert no editor is shown.

Updated design/spec/task documentation, actual preview instructions and developer/testing guides. No dependencies or lockfiles changed. A final formatting check exposed CRLF checkout on untouched baseline code/configuration despite the LF editor policy; set Git's default text EOL to LF and reformatted owned files to match, without changing their logic. No code runner, API, database or auth implementation was introduced. No independent review was performed, and no commit/push/PR was requested in this session.

## Verification

- Node: v24.14.0.
- ESLint: passed.
- Unit tests: 24 passed across two files, including 15 new source-validation cases.
- Production build and its TypeScript checks: passed.
- Full Chromium suite: 12 passed in 20.1 seconds, including input preservation, exact/multibyte byte bounds, disabled submission, no sentinel source transfer, fixed languages/assignment isolation, mobile overflow and production denial.
- Formatting: passed after correcting the Windows checkout line-ending policy. Standalone route/type generation, scaffold/local links, strict OpenSpec (one change, zero failures) and tracked diff whitespace checks also passed.
- Expected synthetic error output occurs in the existing recovery scenario; the complete test suite passed.
- Hosted CI, real auth/RLS, submission integration, deployment and independent review: not run.

## Next step

Human test/review of local code entry, then publish this branch when requested. Obtain teammate session/schema/persistence handoff before connecting submission. Issue #5 and task 7.4/7.5 remain open; task 7.11 is complete as local-only UI work.
