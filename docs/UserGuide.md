# CodeLeet User Guide

CodeLeet lets students practise Python and Java, save submissions, request learning feedback and discuss problems. Instructors create assignments, review submissions and publish grades.

This guide was reconciled against merged develop `29b6c1a` on 5 November 2026, including course workspaces and subsequent fixes. Use the application address supplied by the team. Complete hosted account/email/AI acceptance is not established by this source audit; local setup is below.

## Choose where to start

| Your task                                            | Where to go                                                    |
| ---------------------------------------------------- | -------------------------------------------------------------- |
| Start an assignment                                  | **Assignments** → assignment title                             |
| Find saved code or request learning feedback         | **My submissions** → saved revision                            |
| Read released feedback and scores                    | **My grades**                                                  |
| See assignment XP and rank                           | **My XP** or **Leaderboard**                                   |
| Ask or answer a question                             | **Forums**                                                     |
| Change your username                                 | Student **Menu → Profile settings**, or instructor **Profile** |
| Create an assignment or manage practice tests/grades | Instructor workspace; instructor access must be provisioned    |

On smaller screens, use **Menu** to open student navigation. Sign in, open **Courses**, and choose a course where you are enrolled. Your membership sets your role in that course. You do not need instructor access to practise or submit published assignments in a course where you are a student.

## Start locally

Follow [Local setup in the Developer Guide](DeveloperGuide.md#1-local-setup) to install pinned Node 24/pnpm, start Docker/Supabase, apply migrations and configure sign-in. Then run:

```powershell
npx.cmd --yes pnpm@12.15.0 dev
```

Open the address printed by Next.js, normally http://localhost:3000. This command prepares runtime assets and starts the local runner too; do not start port 3130 separately. For an occupied port, see the [Developer Guide](DeveloperGuide.md). Database resets delete local data and are not needed for ordinary sign-in.

## Account and appearance

Account buttons show a spinner and progress such as **Signing in…** or **Sending reset link…** while working. A slow request shows a message asking you to keep the page open. Wait for the result; if an error appears, you can try again. Saves, posts, reviews, code runs and searches also show progress while they finish.

The top bar shows **Courses**, **Profile** and, for admins, **User roles** as buttons. When you choose one of these, a course sidebar section, a breadcrumb, a course card, a paging control or another button-style link, a spinner appears on it until the next page starts. The page area then shows a **Loading …** message such as **Loading courses…** while its data arrives. A collapsed sidebar still names each section for screen readers.

Choose **Create student account** and enter **Username**, email, **Password** and **Confirm password**. Usernames must be unique regardless of capitalization, contain 1–80 characters and exclude @ or line breaks. Passwords must match; each has a Show/Hide eye button. Public registration creates a student. Your admin provisions instructor access. In **Email or username**, enter either identifier with your password. Local email confirmation is disabled by default; hosted confirmation depends on the team's setup. Use **Sign out** when finished; a failure lets you retry.

For a forgotten password, choose **Forgot password?**, enter your email and select **Send reset link**. The acknowledgement does not reveal whether an account exists. Open the newest email link in the same browser, enter matching passwords of at least eight characters and choose **Update password**. Then sign in again. Invalid/expired/reused links offer **Request a new link**. Resend delays or provider limits may require a wait. Local emails appear in [Mailpit](http://localhost:54324); hosted delivery is unverified.

Students open **Menu → Profile settings**; instructors choose **Profile**. Edit **Username** and select **Save changes**. Leading/trailing spaces are removed. A taken name asks you to choose another; failed saves retain your typed username. After a successful change, use the new username to sign in; your email still works. Email and role are read-only here.

If an older account's username is shared or unavailable for sign-in, use your email, then choose and save an available username in Profile settings. Existing accounts are not renamed automatically. If sign-in reports too many attempts, wait before trying again.

The moon/sun control changes light/dark mode across account pages and the workspace. Your browser remembers the choice; without one, the app follows your device preference. Switching themes preserves your code/results.

## Course workspaces

Open **Courses** after signing in. Each course is a separate workspace, and your role is set for each course, so you can teach one course and study in another. Course owners and instructors manage the course's members and features; students can enroll in more than one course.

Instructors create a course with a title and optional description. To add people, invite them by email or share the student join code. An invite or code grants membership only after the person signs in with a verified matching email. Local email links appear in Mailpit; hosted email delivery depends on deployment configuration and has not been verified here.

The course owner and instructors can add instructors and add or remove students. Only the owner can remove another instructor, transfer ownership, or archive the course. Permanent deletion is available only for an empty course and asks for confirmation. Archived courses are read-only. Owners and instructors can enable or disable the shipped assessments, AI, discussions, XP and leaderboard features for each course.

The **Legacy** course contains existing work that has no known class boundary. It is archived and has no owner until a platform admin assigns one. Do not infer or assign a class from the old data.

## Student: assignments and deadlines

Choose a course, then select **Assignments** in its activity links. Only published assignments from that course appear. Enter part of a title, choose **All languages**, **Python** or **Java**, then **Apply filters**. **Clear filters** restores all assignments in the selected course. The course stays in the address when you open an assignment or filter results. Open an assignment to read instructions above the editor. Its language is fixed by the instructor. Empty lists show **No assignments yet**; failures offer **Try again**. Draft or missing assignments are unavailable.

Due dates use Singapore time (SGT). An assignment without one shows **No deadline**.

| Status         | Meaning                                                               |
| -------------- | --------------------------------------------------------------------- |
| Not submitted  | You have not saved a revision.                                        |
| Overdue        | The deadline passed and you have not submitted. You can still submit. |
| Submitted      | Your latest revision was saved on time or without a deadline.         |
| Submitted late | Your latest revision was saved after its deadline.                    |

Late submissions are accepted without an automatic grade penalty. Revisions retain the deadline that applied when saved and show **Late**, **On time**, or **Submitted** without a deadline. Later deadline edits do not rewrite old timing. Status updates when you open/refresh the page or save a revision.

## Student: write, run and submit

The editor shows line numbers and syntax colours. **Tab** indents, **Shift+Tab** unindents, and **Enter** continues indentation. Select several lines to adjust a block. **Escape**, then **Tab**, moves focus outside the editor. **Ctrl+Z** was verified in Chromium. These controls assist indentation; they are not a full IDE/formatter.

### Run code

Enter a complete Python program or Java program with one public `Main` class. Enter optional **Standard input**, then **Run code**. Printed output appears in **Output**, with errors when present. Returning a value alone does not print an answer. Source edits make previous results stale. Runs happen in your browser and do not save revisions, publish grades or award XP. Leaving the assignment ends the run. If unavailable, check setup/connection and retry; your code stays in the editor.

Java supports the documented basic `Scanner` and `BufferedReader` input methods, but not all standard library features. `Thread.start()`, examples waiting with `join()`, and `Thread.sleep()` currently fail compilation. Calling a `Runnable` with `.run()` can work sequentially. Recognized compatibility errors explain the unsupported feature; ordinary compiler errors retain their details.

Input is limited to 4,096 UTF-8 bytes and combined output to 8,192 bytes per case. Execution has a five-second limit per case, with a separate Java preparation/compilation deadline. Timing depends on your device. Local Chromium has runtime evidence; other browsers and hosted role journeys still need verification. If a hosted Run action is unavailable, contact the team with the visible error rather than assuming your solution is incorrect.

For a quick runner check, Python `print("Hello, CodeLeet!")` should print `Hello, CodeLeet!`. A Java assignment needs a complete program, for example:

```java
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, CodeLeet!");
    }
}
```

These checks exercise printing only; follow the assignment's instructions and published cases for your actual solution.

### Test cases

Your instructor can publish up to five cases for an assignment. Under **Published test cases**, expand a case to read its input and expected output. Select **Run published tests** to run your current source against the latest published set. Results distinguish **Passed**, **Wrong output**, compilation/runtime errors and timeouts, with actual output and diagnostics. Comparisons ignore line-ending differences and one final newline; other spaces and capitalization matter. Passing public cases does not prove correctness for every input or change your grade.

Use **Refresh tests** to reload the cases. Changed cases hide old verdicts and ask you to run again; your code remains in the editor. A failed load shows a retry message, while **No published test cases** means the assignment has no published cases. Test runs do not submit a revision. Leaving the page ends active loading/running.

Only in explicit local development configuration, an assignment with no published cases may offer **Use example test cases**. These standalone sum examples are not your instructor's tests and never appear in production or replace a failed real-data request. Developer fixture setup is in the [Developer Guide](DeveloperGuide.md).

### Submit revision

Select **Submit revision** below the run/test section to save code, up to 8,000 characters. Blank, invalid or oversized source shows an error. Success adds an immutable revision to **Your revisions** and leaves the code in the editor. Failed saves retain the draft for retry.

**Unsaved changes** means the source differs from the last successful submission on that page. Running does not submit it. New edits made during a submission remain unsaved. Navigation/sign-out ask for confirmation; reload/close warnings depend on the browser, and Back/Forward protection requires supported navigation events.

Your unfinished code is automatically saved on this browser/device after a short pause. **Draft saved on this device** confirms the local save; use **Submit revision** to submit your work. When you return after a refresh or closing the tab, choose **Restore draft** or **Discard draft** before editing. Each assignment and each saved revision you continue editing has a separate draft. If another tab changes the same draft, choose **Load other draft** or **Keep this tab’s code**.

Drafts are kept for seven days, with up to ten editor drafts on this browser. Older drafts may be removed to make room. They do not move between devices or browser profiles, and signing out clears this browser's CodeLeet drafts. Browser storage clearing/private browsing can remove them too; avoid leaving unfinished code on a shared device. If you see **Couldn't save draft on this device**, keep the page open and submit your revision. Very recent edits may not survive an abrupt closure before autosave finishes.

## Student: submissions, feedback and grades

### My submissions

From an assignment in the selected course, choose **My submissions** in the sidebar/Menu. Only revisions from that course appear, newest first, with assignment, language, revision and SGT timestamp. **Next**/**Previous** navigate pages of up to 25 entries. Title/language filters and course context persist when paging. On mobile, scroll inside the table.

Open an assignment title in a row for saved code, learning-feedback controls and any published grade. **All submissions** returns to the list; **Back to assignment** opens an available problem. An unavailable assignment's own revisions remain accessible under **Assignment unavailable** without searchable hidden titles. Empty accounts show **No submissions yet**; failed requests offer **Try again**. Other students' code, private rubrics and unpublished grades remain hidden.

Choose **Continue editing** from a revision or **Your revisions** to load saved source. **Editing revision N** identifies the starting point. Edit and submit a new revision; the original stays unchanged. Switching revisions with unsaved edits asks for confirmation. Ordinary assignment visits start with an empty editor unless you restore an available browser draft.

### Compare revisions

Open a saved revision, choose **Compare revisions**, enter **From revision**/**To revision**, then **Compare**. Added/removed lines have plus/minus signs and line numbers. Identical source shows **No changes between these revisions**. You can reverse direction or compare a revision with itself. Save a second revision before comparing different versions.

The default compares with the previous revision; revision 1 compares with your latest. Refresh/Back preserve the selected pair. Comparison never changes source. On mobile, scroll inside the changes area.

### Learning feedback

On a saved submission, select **Request review** under **Learning feedback** for a summary, strengths, next steps and questions. Check hints against your code: AI can be wrong and does not change grades. Requesting feedback sends saved code and assignment context to the configured SoCLaaS service; student context excludes private rubrics. Disabled/unavailable AI or exhausted usage shows an error while keeping the submission accessible. Retry later as appropriate. Recorded AI evaluations use a small synthetic sample and do not guarantee feedback quality for every program.

### My grades

From an assignment in the selected course, choose **My grades** in the sidebar/Menu for published grades from that course, newest first. Expand **Instructor feedback** or **View revision**. Scores have no assumed percentage/maximum. Filters/pagination work like My submissions. Empty course histories show **No published grades yet**. Your published grades remain available when an assignment is unavailable, without exposing its hidden title.

### My XP

Open **My XP** from a course's activity links to see your total and assignment awards in that course. Your best currently published result for each assignment counts. XP is your score divided by that grade's rubric maximum, multiplied by the assignment's maximum XP and rounded down. For example, 8 out of 10 on a 100-XP assignment earns 80 XP. Saving more revisions does not add duplicate awards.

Corrected or withdrawn grades and changes to an assignment's maximum XP can increase or decrease your total. Draft grades, AI suggestions, running code and forum activity do not earn XP. **Next**/**Previous** browse up to 25 awards per page. An unavailable assignment keeps its award without showing its hidden title. Loading failures offer **Try again**.

## Student: My progress

Within your selected student course, choose **My progress** in the sidebar or mobile **Menu** for an overview of that course's work. Assessments and XP sections depend on the course's enabled features:

- **Submitted assignments** counts published assignments with at least one saved revision, including late submissions. Saving several revisions of one assignment still counts once.
- **Outstanding assignments** have no saved revision from you. **Overdue assignments** are the outstanding assignments whose deadline has passed. Assignments without deadlines still count as outstanding.
- **Total XP** shows your current awarded XP. Select it to open your XP breakdown.
- **Coming up** shows up to five outstanding assignments with upcoming deadlines, earliest first. Dates and times use SGT. Open an assignment to continue working.
- **Recent submissions** and **Recent grades** show up to five of your latest saved revisions and published grades. **View all** opens the corresponding full list.

The progress bar tracks saved submissions, rather than passing tests or receiving grades. Browser drafts and code runs do not count as submitted. An assignment removed from publication leaves the current assignment totals. If a section cannot load, it shows an unavailable message and **Try again**; other sections can still be used. Refresh the page to see newer submissions, grades or deadline changes.

## Leaderboard

Choose **Leaderboard** from the selected course's activity links. Students with positive XP in that course appear highest first, with **Rank**, **Username** and **XP**. Equal XP shares a rank: two students in first place are followed by rank 3. Within a tie, usernames sort ignoring capitalization; duplicate usernames have a consistent order.

Students see **Your rank** and **Your XP** even when their row is on another page. **You** identifies their row. Zero XP shows **Unranked** and is not listed. Instructors/admins can browse but are not ranked. **Next**/**Previous** browse 25 rows at a time; mobile tables scroll within their panel when needed.

Refresh or reopen the page after grades or maximum XP change to see updated totals. Running code, AI suggestions and forum activity do not improve rank. An empty board shows **No rankings yet**; a failed load offers **Try again**. Only signed-in members can browse usernames/totals; the leaderboard does not display emails, submissions or assignment-level awards.

## Instructor: assignments and grading

1. Open the course you teach, then choose **New assignment**. Assignments, submissions and grades are scoped to that course. Enter **Title**, **Instructions**, **Language**, **Maximum XP** and 1–20 private rubric criteria. Maximum XP must be a whole number from 0 to 100,000; enter 0 for no XP.
2. Optionally set **Due date and time (SGT, optional)**. Blank means no deadline; clearing it removes one.
3. Choose **Draft** or **Published** under **Status**, then **Save assignment**. Drafts stay hidden. Use **Edit** to update an owned assignment. Language cannot change after a submission.
4. Choose **Submissions** on an assignment, then a revision to review saved source/timing. Available **Run code** executes it in your browser.
5. Under **AI rubric suggestions**, choose **Request review** for advisory criterion scores/comments. Review them yourself; this does not save/publish a grade.
6. Enter criterion scores and feedback. **Save draft** keeps the grade private. Select **Publish this grade to the student**, then **Save and publish**, to release it. If another edit changed the record, reload before retrying.

Instructors can review submissions/private rubrics only for assignments in courses where they are instructors. AI cannot publish grades. Open **AI usage** from the selected course for your recent usage there. In an active AI-enabled instructor course, **Context comparison** is also available from that course. Counts may be estimates when provider counts are absent; two uncached comparisons can consume two request slots. Configuration/experiment details are in the [Developer Guide](DeveloperGuide.md).

Publishing or correcting a grade updates the student's assignment XP automatically. Changing **Maximum XP** recalculates existing awards. Later rubric edits do not change the denominator captured with an earlier publication. Assignments created before XP was added start at zero; review and republish older grades before they can earn XP.

### Publish practice tests

Choose **Practice tests** on an assignment in your instructor list or from its edit page. Select **Add test case**, then enter **Name**, **Input** and **Expected output**. Use a complete stdin/stdout example: returning a value from a function does not print it. Empty input/output is allowed. Names allow 120 characters; each case allows 4,096 UTF-8 input bytes and 8,192 expected-output bytes. Whitespace in input/output is kept.

**Save draft** keeps edits private. **Publish tests** saves and releases the edited set. Later draft edits leave the previous published cases available to students until you publish again. **Unpublish tests** removes student-visible cases but keeps your saved draft. A draft assignment remains hidden even if its test set is published. Publishing requires at least one case; you may save an empty draft. Use **Remove** to delete a case from the edited set.

Only the owning instructor can manage these cases. Failed saves retain your inputs; if another edit changed the set, reload before saving again. Publishing tests does not grade student code.

## Forums

Choose **Discussions** from the selected course's activity links. Instructors and students in that course share its discussions. Select **New discussion**, enter title/message, then **Create discussion**. In a discussion, use **Your reply → Post reply**.

**Search discussions → Search** finds titles/opening messages, ignoring capitalization and treating punctuation literally; replies are not searched. **Clear search** restores all discussions. Paging preserves search; refresh/Back retain its address.

Threads/replies appear newest first, 25 per page, with author username/role at posting time and SGT timestamp. Titles allow 160 characters, messages 8,000. Posts are plain text, including code/markup. Failures retain your draft. If posting too quickly, wait a minute. Editing/deletion and attachments are unavailable. Forum activity does not change grades or award XP.

## Admin accounts

Admins also have instructor access and an **Admin panel** link to manage roles. Signup cannot create admins. Trusted admin access is required; the app prevents removing the last admin. Self-role changes ask for confirmation and may return you to another workspace. First-admin provisioning is an operator task described in [database setup](../supabase/README.md).

## Troubleshooting

| What you see                                  | What to do                                                                                                                          |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| No assignments                                | Check with your instructor that an assignment has been published                                                                    |
| Signing in or another action is still loading | Keep the page open for its result. If an error appears, retry; avoid submitting the same action in several tabs                     |
| Username cannot be used                       | Sign in with your email, then choose and save an available username in Profile settings                                             |
| Reset email is missing                        | Check your email/spam folder and use the newest link in the same browser. Local testers use Mailpit                                 |
| No printed output                             | Check that your code prints an answer and that any requested Standard input is supplied                                             |
| Wrong output on a test                        | Compare expected and actual output, including spaces and capitalization; a matching result does not save or grade the code          |
| No grade or XP                                | Wait for instructor publication; running code and requesting AI feedback do not award either                                        |
| Browser draft is unavailable                  | It may belong to another device, have expired, been cleared on sign-out, or failed to save. Check saved revisions in My submissions |

## Suggested student acceptance check

With a synthetic student account and an instructor-provided published assignment:

1. Sign in using email, then repeat using your username. Check sign-out and the light/dark control.
2. Open an assignment, enter code, run it and run any published tests. Repeat on a separate assignment for the other language.
3. Submit a revision and open it in **My submissions**. Continue editing, save a second revision and compare the two.
4. Leave an unfinished edit, refresh, and use **Restore draft** if offered. A recovered draft still needs submission.
5. Request learning feedback if AI is enabled. Check **My grades** and **My XP** after an instructor publishes a grade.
6. Create or reply to a discussion and search for its title. Check navigation on a narrow screen.

Use the separate [developer verification/release checks](DeveloperGuide.md#8-verification-commands-and-evidence-scope) for privacy denials, configuration, mail delivery and hosted acceptance. This checklist is a test procedure, not a claim that every hosted check has passed.

## Current limits and test coverage

- No uploads, achievement badges, hidden tests or automatic grading from browser runs is available.
- Use synthetic accounts/code for testing. A verified hosted address, public tester accounts and complete supported-browser matrix are not recorded yet.
- Automated UI tests may mock AI or skip missing prerequisites. They do not establish live-model quality, hosted email delivery or deployed runner security.
- Reproduction commands, historical evidence and release checks are in the [security evidence report](../workflow/evidence/2026-11-02-security-testing.md).
