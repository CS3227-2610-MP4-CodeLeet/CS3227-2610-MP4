# Course feature toggle behavior audit

- Date: 10 November 2026 (Asia/Singapore)
- Participants: user and `/root` (no subagents)
- GitHub issue: [#141](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/141)
- OpenSpec change: `build-programming-platform`, task 33.6; task artifacts record completion
- Branch: `docs/141-course-feature-toggle-audit` (created remotely; local `.git` is read-only)
- Commit history:
  - [`4cc182d`](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/commit/4cc182df02aa8aa5efe8858563782e345b95c4a1) — User Guide feature-toggle details.
  - [`39c6dbb`](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/commit/39c6dbb474b4808d1536217592fa854981e2c5e4) — initial audit log.
  - [`08fb36b`](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/commit/08fb36b6cfce07e08b1a7521a89fb03148fdcd4e) — link PR details in the log.
  - [`1317333`](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/commit/13173338d4341c4c1cd26b02bda0706ee67b5bd8) — record CI evidence.
  - [`0a51800`](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/commit/0a5180004ff21cb4e74d114861146c91c20c89e1) — record the completed check run.
  - [`0eaa1fa`](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/commit/0eaa1faeea9fb8be2199c752e72b2e6b29b6f9eb) — remove the User Guide's trailing carriage return.
- Pull request: [#143](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/pull/143), open against `develop`
- Human verification: pending
- Verification: static source and migration review; tests were not run locally

## Prompt and interaction summaries

1. User requested an exhaustive explanation of each course instructor feature switch for students and instructors, a thorough independent-toggle behavior review for possible bugs, and corresponding User Guide documentation.
2. Repository instructions and the project brief were read. The relevant OpenSpec course-workspaces section was reviewed; it specifies five implemented, independently controlled features, server/data enforcement, direct-call denial, retained records, and archived read-only history.
3. Source review traced the settings UI/API, role/course access checks, feature navigation, pages, APIs, database policies/RPCs, archive behavior, and XP recomputation. No agents were delegated.
4. The User Guide was updated with per-feature student/instructor effects, data retention, XP re-enable behavior, independent XP/Leaderboard behavior, progress dependencies, archive behavior, and the Context comparison interaction.
5. User requested branch creation, push and PR. Issue #141 was created because the original course-workspaces issue #85 is closed. The remote branch was created from `develop`, the two files were committed separately, branch Vercel status succeeded, and PR #143 was opened against `develop` with `Closes #141`.
6. User requested review-comment remediation. Two inline comments were fetched. Both were verified against the current branch: the committed Markdown files had a stray carriage return at EOF, and the audit log did not enumerate the full commit/CI/PR history. The guide newline was normalized, and this log is being corrected to include the full commit, push, CI and PR chronology.

## Review findings

- **Assessments:** active-course navigation, pages, APIs and database access for assignments, practice tests, submissions and grades use the assessments switch. Turning it off blocks active-course access while retaining records. Student progress assessment sections also follow this switch.
- **AI:** student and instructor review requests, instructor AI usage and Context comparison use the AI switch. AI is separate from manual grading. Existing usage/review data is retained. Reservation checks serialize with course feature/lifecycle changes, so a request already reserved can finish while later requests are denied.
- **Discussions:** active-course thread/reply reads and writes follow the discussions switch. Turning it off blocks list/detail access and posting without deleting forum data.
- **XP:** student XP views and progress XP section follow the XP switch. XP award recomputation is skipped while disabled; re-enabling recomputes across assignments from current published grades and XP settings. Manual grading and the Maximum XP field remain available if Assessments is enabled.
- **Leaderboard:** the ranking page and API follow the leaderboard switch independently of XP. With XP off and Leaderboard on, existing awards still contribute to rankings. This matches independent-switch behavior but may surprise instructors expecting XP off to hide all XP-derived totals; the guide now says so.
- **Progress:** no independent switch exists; the page is available when Assessments or XP is enabled and renders only the corresponding sections.
- **Archive:** feature settings cannot be changed after archive. Archived course navigation and read paths expose retained history regardless of the saved switch state; new/changed activity remains blocked.
- **Potential bug / UX gap:** instructor Context comparison navigation checks AI only. When AI is enabled and Assessments is disabled, the link remains visible but the assessment/RLS restrictions prevent submission rows from loading, yielding a misleading empty state. No assessment data bypass or unauthorized AI request was confirmed in the traced route/RLS paths. Consider hiding or explaining this link when Assessments is off.
- **No other confirmed authorization bypass** was found in the static paths reviewed. This is a source review, not proof of runtime or hosted behavior.

## Files and checks

- Updated `docs/UserGuide.md`.
- Added this dated audit record.
- Reviewed `workflow/ProjectBrief.md`, `workflow/AgentProcess.md`, OpenSpec design/tasks for issue #85, course feature UI/contracts, course routes/APIs, feature access helpers, and relevant Supabase migrations.
- The earlier local `git diff --check` did not catch carriage returns present in the GitHub contents commits. Review comment `PRRC_kwDOVPCxNM8AAAABDabuxQ` reproduced the whitespace failure on the committed files. The correction normalizes both files and verifies the remote text and the updated local diff.
- OpenSpec status CLI: attempted using the repository-pinned CLI; the restricted shell lacked `pnpm`/`node`, and the elevated invocation did not return usable status output. OpenSpec task completion was read from `openspec/changes/build-programming-platform/tasks.md`.
- No tests or builds were run locally (documentation-only change). GitHub contents commits and PR creation were performed through the connected GitHub tools because local `.git` is read-only.
- PR-head CI run [42804971657](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/actions/runs/42804971657) passed Application, database, coverage-report and authenticated synthetic browser jobs for commit `0a5180004ff21cb4e74d114861146c91c20c89e1`; Scaffold [42804971682](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/actions/runs/42804971682) and CodeQL [42804972128](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/actions/runs/42804972128) also passed. Vercel succeeded on that commit. Review-fix commits and their checks will be recorded in the follow-up commit history.
- Pre-existing edits in `workflow/experiments/2026-11-06-context-strategy-evaluation.json` and `workflow/experiments/2026-11-06-development-context-experiment.json` were preserved and not included in this work.

## Follow-up

- Decide whether Context comparison should be hidden or display an explicit explanation when Assessments is disabled.
- Decide whether XP off should also suppress leaderboard values, or retain the current independent-switch behavior.
- PR #143 is open; teammate review remains pending.
