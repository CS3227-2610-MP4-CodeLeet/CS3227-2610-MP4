# Course feature toggle behavior audit

- Date: 10 November 2026 (Asia/Singapore)
- Participants: user and `/root` (no subagents)
- GitHub issue: [#141](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/141)
- OpenSpec change: `build-programming-platform`, task 33.6; task artifacts record completion
- Branch: `docs/141-course-feature-toggle-audit` (created remotely; local `.git` is read-only)
- Commits: [`4cc182d`](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/commit/4cc182df02aa8aa5efe8858563782e345b95c4a1) updates the User Guide; [`39c6dbb`](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/commit/39c6dbb474b4808d1536217592fa854981e2c5e4) adds the audit log
- Pull request: [#143](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/pull/143), open against `develop`
- Human verification: pending
- Verification: static source and migration review; no test suite run

## Prompt and interaction summaries

1. User requested an exhaustive explanation of each course instructor feature switch for students and instructors, a thorough independent-toggle behavior review for possible bugs, and corresponding User Guide documentation.
2. Repository instructions and the project brief were read. The relevant OpenSpec course-workspaces section was reviewed; it specifies five implemented, independently controlled features, server/data enforcement, direct-call denial, retained records, and archived read-only history.
3. Source review traced the settings UI/API, role/course access checks, feature navigation, pages, APIs, database policies/RPCs, archive behavior, and XP recomputation. No agents were delegated.
4. The User Guide was updated with per-feature student/instructor effects, data retention, XP re-enable behavior, independent XP/Leaderboard behavior, progress dependencies, archive behavior, and the Context comparison interaction.
5. User requested branch creation, push and PR. Issue #141 was created because the original course-workspaces issue #85 is closed. The remote branch was created from `develop`, the two files were committed separately, branch Vercel status succeeded, and PR #143 was opened against `develop` with `Closes #141`.

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
- `git diff --check`: passed for the tracked diff; the untracked log was separately checked for trailing whitespace.
- OpenSpec status CLI: attempted using the repository-pinned CLI; the restricted shell lacked `pnpm`/`node`, and the elevated invocation did not return usable status output. OpenSpec task completion was read from `openspec/changes/build-programming-platform/tasks.md`.
- No tests or builds were run (documentation-only change). GitHub contents commits and PR creation were performed through the connected GitHub tools because local `.git` is read-only.
- Vercel status succeeded for commit `39c6dbb474b4808d1536217592fa854981e2c5e4` before PR creation. PR-head checks after the final audit-log update are pending verification.
- Pre-existing edits in `workflow/experiments/2026-11-06-context-strategy-evaluation.json` and `workflow/experiments/2026-11-06-development-context-experiment.json` were preserved and not included in this work.

## Follow-up

- Decide whether Context comparison should be hidden or display an explicit explanation when Assessments is disabled.
- Decide whether XP off should also suppress leaderboard values, or retain the current independent-switch behavior.
- Create the PR after branch CI completes; teammate review remains pending.

