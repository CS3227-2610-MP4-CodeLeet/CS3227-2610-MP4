# User Guide

Status: local foundation and an opt-in assignment preview using synthetic samples. There is no deployed application or authenticated student/instructor feature yet.

Developers can run the local coming-soon home page using the README setup commands. The home page provides no login, code execution or submission flow. The development-only preview below is available separately; other feature sections remain templates.

## Local assignment preview

1. Follow the README installation steps using Node 24.
2. Add `STUDENT_PREVIEW_ENABLED=true` to ignored `.env.local` and restart the development server with `pnpm dev` (or `npx --yes pnpm@12.15.0 dev`).
3. Open `/student/assignments` at the local address printed by Next.js.
4. Select **View assignment** for **Find the largest number** (Python) or **Count the vowels** (Java).
5. Read the instructions, then use **All assignments** to return.

The banner identifies sample data; no account or database data is shown. Draft and missing assignments show **Assignment unavailable**. No code can be entered, run or submitted in this preview. It is disabled by default and remains unavailable under `pnpm start`/production even if the flag is true.

For local UI checks, add `?preview=empty` to the assignment list for **No assignments yet**, `?preview=slow` for a brief loading state or `?preview=error` for the failure state. **Try again** reloads the normal list. These controls exist only in the development preview.

Verified locally in Playwright Chromium at desktop and 375px viewport width. This does not establish browser-runtime compatibility or real student access-control correctness.

## Access

- Production URL: not deployed.
- Supported browsers: pending runtime evaluation.
- Tester accounts and reset instructions: not provisioned.

## Feature documentation template

Complete the following for each verified feature before release. Do not present planned behavior as available behavior.

### <Feature name>

- Available to:
- Preconditions and test data:
- Steps:
- Expected visible result:
- Errors and recovery:
- Limits and known issues:
- Last verified release/browser:

## Required coverage before release

Document account access/profiles, assignment creation, Python and Java practice runs, code submission, student AI feedback, instructor AI evaluation and grade publication, forum threads/replies, XP, and leaderboard behavior only once implemented.

Explain that practice runs happen on the user's device and do not prove official correctness. Explain when code is sent to the server for submission or SoCLaaS feedback, how AI output should be checked, and the published limits/cancellation behavior verified for the selected runtimes.
