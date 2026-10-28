# User Guide

Status: local foundation and an opt-in assignment preview using synthetic samples. There is no deployed application or authenticated student/instructor feature yet.

Developers can run the local coming-soon home page using the README setup commands. The home page provides no login, code execution or submission flow. The development-only preview below is available separately; other feature sections remain templates.

## Local assignment preview

1. Follow the README installation steps using Node 24.22.1.
2. Add `STUDENT_PREVIEW_ENABLED=true` to ignored `.env.local` and restart the development server with `pnpm dev` (or `npx --yes pnpm@12.15.0 dev`).
3. Open `/student/assignments` at the local address printed by Next.js.
4. Select **View** in the assignment table for **Find the largest number** (Python) or **Count the vowels** (Java).
5. Read the instructions, then use **All assignments** to return.

The banner identifies sample data; no account or database data is shown. Draft and missing assignments show **Assignment unavailable**. The preview is disabled by default and remains unavailable under `pnpm start`/production even if the flag is true.

On desktop, the sidebar links to assignments and the published sample problems. **Menu** is available in the top-right on every screen size for the same navigation; it supports keyboard activation. The problem title, instructions and example appear above **Your code**. The editor uses a theme-aware plain-text area with line numbers and a filename label; it does not provide syntax highlighting or an external IDE service. Long lines scroll inside the editor rather than widening the page.

Use the moon/sun button immediately to the right of **Menu**, at the far-right edge of the top bar, to change the student workspace, editor and results. Its tooltip and accessible name are **Switch to dark mode** / **Switch to light mode**. Without a saved choice, the workspace uses the device preference after loading. Your explicit choice is remembered in this browser across navigation and reloads; it does not save source code or results. If browser storage is blocked, switching still works for the current session. Theme changes preserve the current draft and run/results. The public home page keeps its existing appearance.

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
$env:STUDENT_PREVIEW_ENABLED = "true"
$env:STUDENT_RUNNER_PREVIEW_ENABLED = "true"
pnpm dev
```

Open `/student/assignments` at the address printed by Next.js (normally http://localhost:3000). Open a Python/Java assignment and enter a complete program that reads stdin and prints the answer. Python's sample now expects space-separated integers and printed output, not a function return value. Java requires one public Main class; buffered UTF-8 input, BufferedReader and the documented basic Scanner methods are supported.

- **Run code:** enter optional **Standard input**, then run your program. The result shows completion/error, stdout, stderr when present and approximate execution time.
- **Run published tests:** runs the three synthetic public cases for that sample assignment, sequentially with fresh state. Each case shows its input, expected stdout, verdict and actual stdout. Custom stdin is ignored for this action.
- To leave an active run, use **All assignments** or another navigation link. Leaving the assignment ends the runner; automatic execution and suite deadlines also remain active. There is no Stop button in the student workspace.

These cases are explicitly sample data; teacher creation/publication and shared test storage are not implemented yet. Results are practice feedback only and do not submit code, publish grades or award XP. Edited source hides previous results until it is run again. Output is rendered as text, including any HTML-like content.

The compact toolbar above input/output contains **Run code** and **Run published tests**. While a suite is running, the status identifies its current test number. The summary shows the number passed and run. Select a test-case row to expand its input, expected output, actual output and diagnostics; failed cases expand automatically. On wider screens these values appear next to one another, and on mobile they stack. **Run details** expands the input/runtime limits, output comparison rules and supported Java input. Custom-input output appears in the separate **Output** panel.

Matching normalizes CRLF/lone CR line endings and ignores one final newline on each output. All other spaces, blank lines and capitalization matter. A runtime error or timeout never passes even if partial output matches. Stderr is diagnostic output, not the expected answer. Passing published samples does not prove correctness for every possible input.

Limits: up to five cases (current samples have three), 4,096 UTF-8 bytes of stdin and 8,192 bytes of combined output per case, five seconds of program execution per case, a separate 20-second preparation/Java compilation deadline, and a 90-second suite deadline. Runtime loading has separate bounded recovery. Execution timing excludes initialization/compilation and is approximate local wall time; machine/browser differences make it unsuitable for official performance comparisons. No hard browser memory quota is claimed.

If the bridge is unavailable, the page asks you to start port 3130; start the static runner and try again. Missing/failed runtime assets show a recovery error; prepare the assets and retry. Stop both terminal processes with Ctrl+C when finished. The runner preview is available only in development with both flags true and remains unavailable in production. It is verified locally in Chromium, not deployed or approved for use with real authenticated data. Supported Java API details and remaining production gates are in the [input report](../workflow/evidence/runtime-feasibility/java-input-resolution.md).

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
