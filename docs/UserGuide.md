# User Guide

Status: CodeLeet student/instructor flows and local RLS policies are verified with synthetic records. The authenticated browser journey, including two rubric criteria, immutable revisions and explicit grade publication, passed against local Supabase with mocked AI. No hosted app, live SoCLaaS call or Vercel deployment has been verified.

## Local CodeLeet app

The code editor shows line numbers and colours Python/Java keywords, strings, comments and other syntax. Colours follow your light/dark preference. Line numbers scroll with the code and long lines scroll horizontally inside the editor. Highlighting does not reformat, validate or execute your program; the editable source remains plain text. Real assignments and submissions support both Python and Java. The assignment determines the editor language.

Use **Tab** to indent and **Shift+Tab** to unindent; select multiple lines to adjust a whole block. **Enter** keeps the current indentation and adds a level after Python block colons or opening brackets/Java braces. Enter between matching brackets creates an indented blank line. Typing a Java closing brace on an indented blank line removes one level. Indentation uses four-space stops. **Ctrl+Z** undoes an edit in the verified Chromium browser. To move keyboard focus out of the editor, press **Escape**, then **Tab** (or Shift+Tab to move backward). This is indentation assistance, not a full language formatter.

The moon/sun control applies to the landing page, sign-in, account creation and signed-in workspace. Your browser remembers the choice. Account creation requires matching **Password** and **Confirm password** fields; each has its own Show/Hide eye button. Signing in requires only the password. Signed-in student and instructor headers include **Sign out**. If signing out fails, the page shows an error and lets you retry.

1. Install Node 24 and pnpm as described in the repository README.
2. Start the local Supabase stack with `pnpm db:start`, then apply new migrations with `pnpm exec supabase migration up --local`. Use `pnpm db:reset` only for a disposable database: it deletes existing local data.
3. Copy `.env.example` to the ignored `.env.local`, then set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` using the local Supabase status output. Keep all other local service keys private.
4. Run `pnpm dev` and open the address printed by Next.js.
5. Create a student account at **Create student account**, entering your **Username**, email and matching passwords. Local email confirmation is disabled by default. Public registration does not offer an instructor role.
6. To exercise instructor screens, first create an account and use a trusted local Supabase admin session to set that account's `user_roles.role` to `instructor`; see [local database setup](../supabase/README.md). Never expose this operation through the app.

Students can browse published Python and Java assignments, submit revisions (up to 8,000 characters), view their own history, request learning feedback, and see grades only after publication. Instructors can create/edit/publish assignments with 1–20 private rubric criteria, review owned submissions, request AI rubric suggestions, edit grade drafts, and explicitly publish grades. Both roles can inspect their own AI usage. Instructors can compare focused and broader authorized contexts; each uncached comparison may use two daily AI request slots.

AI is disabled unless `SOCLAAS_AI_ENABLED=true` and a server-side SoCLaaS URL/key/model are configured. Without these values, the rest of the local assignment workflows remain available and review requests show a safe unavailable message. Do not enter real student data in the synthetic experiment harness. Product AI context includes source code as untrusted text, but submitted source is never executed by Next.js/Node, a remote service, or the AI model. The separate optional browser practice environment is described below.

When creating an assignment, instructors select **Python** or **Java**. Its language is fixed once a student submits code. Each saved revision records its language, and students can see only their own revisions. Forums, XP/badges, uploads, plagiarism checks and broad analytics are not included in this selected MVP.

Local development uses real accounts and assignments by default. The student workspace then shows real published assignments without sample-data notices or a redundant Home link. The signed-in sidebar and Menu contain **Assignments** and **My submissions**; sample preview navigation keeps only Assignments. The assignment page is ordered as instructions, editor, **Run code**, input/output, test cases, **Submit revision**, then **Your revisions**. The tests action sits beside the test cases. After saving a revision, history updates and your code stays in the editor.

To practise on a real Python or Java assignment locally, prepare the runtime assets and start the local runner using the commands below, then restart `pnpm dev`. **Run code** uses the same source as **Submit revision**, with optional standard input; it executes only in your browser. No published-tests action is shown for real assignments because authored test cases are not connected yet. The local runner remains disabled in production. Hosted execution remains unavailable.

### My submissions

Sign in as a student and select **My submissions** from the sidebar or Menu, or open `/student/submissions`. This lists only your saved revisions across assignments, with the assignment title, Python/Java language, revision number and submission time in Singapore time (SGT). Revisions are newest first, with **Next** and **Previous** for pages of up to 25 entries. On narrow screens, scroll within the table to see all columns.

Select an assignment title in a row to open that revision's saved code, learning-feedback controls and published grade. **All submissions** returns to the list; **Back to assignment** opens the original problem when it is still available. Earlier revisions are kept unchanged. If an assignment is no longer visible, its history row says **Assignment unavailable** and your own revision remains accessible.

An empty account shows **No submissions yet** and a **Browse assignments** link. A failed history request offers **Try again**; it does not replace your records with samples. The page requires a student sign-in even when sample assignment preview is enabled. Other students' submissions, private rubrics and unpublished grades remain hidden.

### Example tests in real assignments (local development)

With the local runtime prepared/running, set `STUDENT_TEST_CASE_FIXTURES_ENABLED=true` in ignored `.env.local`, then restart the development server. Open a published Python or Java assignment and select **Use example test cases** below the editor. These are standalone examples for a program that reads two integers and prints their sum; they are **not your instructor's assignment tests**.

Select **Run tests** to compare the current editor source with the three examples. Expand a case to see its input, expected output and actual output. Results distinguish Passed, Wrong output, Compile error, Runtime error and Time limit exceeded. Editing code makes earlier results stale. Deselecting examples stops an active run and clears the results while keeping the code. Practice runs do not save revisions or affect grades; use **Submit revision** separately.

The example option is absent by default and in production, even if the flag is set. Instructor-authored case creation/publication and real case loading are still pending. The existing browser runtime limits and supported Java library subset apply.

### Forgot password

From **Sign in**, select **Forgot password?**, enter your account email and select **Send reset link**. The acknowledgement is the same for registered and unregistered addresses. Open the newest email link in the same browser where you requested it, enter matching new passwords (at least eight characters), and select **Update password**. Both password fields have independent eye buttons. After success, sign in using the new password. An expired, reused or invalid link offers **Request a new link**.

Local Supabase captures emails in **[Mailpit](http://localhost:54324)**; they are not delivered to a real inbox. Use that local mailbox to open the link while testing. Requesting a link has a short resend delay, and provider rate limits may require a longer wait. Hosted email delivery has not been verified.

## Local assignment preview

1. Follow the README installation steps using Node 24.22.1.
2. For UI tests only, set `PLAYWRIGHT_ASSIGNMENT_FIXTURES=true` in the test server environment and restart the development server with `pnpm dev` (or `npx --yes pnpm@12.15.0 dev`).
3. Open `/student/assignments` at the local address printed by Next.js.
4. Select **View** in the assignment table for **Find the largest number** (Python) or **Count the vowels** (Java).
5. Read the instructions, then use **All assignments** to return.

The banner identifies sample data; no account or database data is shown. Draft and missing assignments show **Assignment unavailable**. The preview is disabled by default and remains unavailable under `pnpm start`/production even if the flag is true.

On desktop, the sidebar links to assignments and the published sample problems. **Menu** is available in the top-right on every screen size for the same navigation; it supports keyboard activation. The problem title, instructions and example appear above **Your code**. The editor uses a native text area with syntax colours, line numbers and a filename label; no external IDE service is involved. Long lines scroll inside the editor rather than widening the page.

Use the moon/sun button immediately to the right of **Menu**, at the far-right edge of the top bar, to change the student workspace, editor and results. Its tooltip and accessible name are **Switch to dark mode** / **Switch to light mode**. Without a saved choice, the workspace uses the device preference after loading. Your explicit choice is remembered in this browser across navigation and reloads; it does not save source code or results. If browser storage is blocked, switching still works for the current session. Theme changes preserve the current draft and run/results. The same preference also applies to the public home and account pages.

### Local code-entry checks

On either assignment detail page, scroll to **Your code**. The language is fixed to the assignment's Python or Java language. Enter source in the labeled textarea; the counter measures UTF-8 bytes, not characters, up to 32,768 bytes (32 KiB).

Select **Check code** to check input rules only. Blank/whitespace-only text, NUL, invalid Unicode and oversized source are rejected. Oversized text also shows an error immediately. Errors focus the editor when checked and preserve all entered text so it can be corrected. Exactly 32,768 bytes is allowed; for example, é uses two bytes and 😀 uses four.

The **Submit code** button remains disabled. Check code is not a correctness/compilation check or a successful submission; it does not run or transmit source. There is no autosave or database integration. Refreshing the page clears the editor; opening a different assignment starts its own empty editor. Local validation is not a substitute for later server/database enforcement.

### Browser runs and published practice tests (additional local opt-in)

Use Node 24. In a PowerShell terminal from the project root, prepare the reviewed runtime files and start the local static runner:

```powershell
node workflow/scripts/fetch-runtime-assets.mjs
node src/runtime-lab/server.mjs
```

In another terminal start the website:

```powershell
$env:PLAYWRIGHT_ASSIGNMENT_FIXTURES = "true"
pnpm dev
```

Open `/student/assignments` at the address printed by Next.js (normally http://localhost:3000). Open a Python/Java assignment and enter a complete program that reads stdin and prints the answer. Python's sample now expects space-separated integers and printed output, not a function return value. Java requires one public Main class; buffered UTF-8 input, BufferedReader and the documented basic Scanner methods are supported.

- **Run code:** enter optional **Standard input**, then run your program. The result shows completion/error, stdout, stderr when present and approximate execution time.
- **Run published tests:** runs the three synthetic public cases for that sample assignment, sequentially with fresh state. Each case shows its input, expected stdout, verdict and actual stdout. Custom stdin is ignored for this action.
- To leave an active run, use **All assignments** or another navigation link. Leaving the assignment ends the runner; automatic execution and suite deadlines also remain active. There is no Stop button in the student workspace.

These cases are explicitly sample data in the independent browser-practice preview. CodeLeet instructors can create and publish assignment records, but authored practice tests are not shared with this preview. Results are practice feedback only and do not submit code, publish grades or award XP. Edited source hides previous results until it is run again. Output is rendered as text, including any HTML-like content.

The compact toolbar above input/output contains **Run code** and **Run published tests**. While a suite is running, the status identifies its current test number. The summary shows the number passed and run. Select a test-case row to expand its input, expected output, actual output and diagnostics; failed cases expand automatically. On wider screens these values appear next to one another, and on mobile they stack. Custom-input output appears in the separate **Output** panel.

Matching normalizes CRLF/lone CR line endings and ignores one final newline on each output. All other spaces, blank lines and capitalization matter. A runtime error or timeout never passes even if partial output matches. Stderr is diagnostic output, not the expected answer. Passing published samples does not prove correctness for every possible input.

Limits: up to five cases (current samples have three), 4,096 UTF-8 bytes of stdin and 8,192 bytes of combined output per case, five seconds of program execution per case, a separate 20-second preparation/Java compilation deadline, and a 90-second suite deadline. Runtime loading has separate bounded recovery. Execution timing excludes initialization/compilation and is approximate local wall time; machine/browser differences make it unsuitable for official performance comparisons. No hard browser memory quota is claimed.

If the bridge is unavailable, the page asks you to start port 3130; start the static runner and try again. Missing/failed runtime assets show a recovery error; prepare the assets and retry. Stop both terminal processes with Ctrl+C when finished. The runner preview is available only in development with the explicit test fixture setting and remains unavailable in production. It is verified locally in Chromium, not deployed or approved for use with real authenticated data. Supported Java API details and remaining production gates are in the [input report](../workflow/evidence/runtime-feasibility/java-input-resolution.md).

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

## Local test accounts

For local testing, start Docker Desktop and run `pnpm db:start`, then `pnpm db:seed`. The command prints a generated password shared by `student01@codeleet.example.test` through `student10@codeleet.example.test` and `instructor01@codeleet.example.test` through `instructor03@codeleet.example.test`. Rerunning it rotates these accounts’ passwords and restores missing fixture rows without resetting other local data. These accounts are for your local database only.

Students 01–09 each have 32 Python/Java submission revisions and published feedback; student 10 has empty history. Instructors own different assignments, including drafts visible only to their owner. Synthetic coursework titles start with `[Local seed]`. See the [local database guide](../supabase/README.md#synthetic-local-workspaces) for details.
