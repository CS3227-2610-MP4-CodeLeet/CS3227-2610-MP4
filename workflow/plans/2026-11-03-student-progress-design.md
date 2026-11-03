# Student personal progress overview

Status: approved on 3 November 2026 by the requester's latest reply, superseding an earlier revise selection. [Issue #89](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/89). Branch: `feature/student-progress-dashboard`, from develop `dfe5936`. Active OpenSpec: `build-programming-platform` / assignments-and-grading.

## Intent and chosen approach

The requester chose a simple overview over charts and activity trends. Add a student-only **My progress** page at `/student/progress`, linked from the existing desktop sidebar and mobile menu. Keep Assignments as the existing landing page.

The alternative charts approach would require agreeing on activity periods and meaningful historical measures; this overview answers what needs attention using existing records. No chart dependency, AI calls, activity tracking, new grading rule or XP writes are proposed.

## What students see

1. Four summary cards: Submitted assignments, Outstanding assignments, Overdue assignments, Total XP. Show submitted versus total published assignments as a simple accessible progress indicator. A saved revision counts as submitted; this is not a claim of correctness or grading. Overdue is a subset of outstanding, not an additional total.
2. **Coming up**: up to five outstanding assignments with future deadlines, earliest first, with assignment links and Singapore date/time. Assignments without deadlines still count as outstanding. A link opens the existing assignment list, including overdue work.
3. **Recent submissions**: the five latest own saved revisions, showing assignment, language, revision and time, with existing revision links and a View all action. Multiple revisions may appear; summary counts count each assignment once.
4. **Recent grades**: the five latest own published grades, with assignment, score when available, publication time and links to the existing grades page. No private rubric, draft grade, AI suggestion or peer information.

Keep copy concise, use existing components and theme styles, stack sections on mobile, and provide sensible empty/loading/error states. Unavailable data must never be displayed as zero. Each section may show its own retry state so an XP failure does not erase assignment information. Avoid a percentage score average because assignments may have different grading scales.

## Data and privacy

Use the existing verified student session and user-scoped Supabase client. Reuse current XP/history/grade contracts where appropriate and project only the metadata needed for this page; do not fetch source code. Published assignment visibility and own-submission/publication rules remain authoritative.

Summary totals must be exact across the visible collection, not calculated from the first history page or a silently truncated assignment response. Use exact server counts with own-student filters and distinct assignment semantics, plus bounded recent/upcoming queries. Verify the database query behavior and existing RLS before implementation choices are finalized. If exact aggregation requires a new database contract, update this design and coordinate that change rather than introducing a truncated count.

Use the server's current time and existing deadline semantics: an outstanding assignment is overdue only after its deadline; a late saved revision counts as submitted. Browser runs and local drafts never count as saved submissions. XP is the existing authoritative server total, including corrections.

Course workspaces are a separate open change. This implementation follows current visibility and does not invent membership filters; recheck contracts against updated develop before integration. No service-role key or shared cross-user response cache.

## Acceptance and verification

- New student, no assignments, undated assignments, mixed languages, repeated revisions and withdrawn assignment visibility.
- Exact counts beyond existing list/page limits; overdue boundary and submitted-late behavior; deterministic top-five ordering.
- Signed-out/other-role denial, own-data isolation, unpublished-grade and source/rubric exclusion.
- Unavailable sections distinguished from empty states; safe rendering of untrusted titles/usernames.
- Real navigation, loading, mobile, keyboard access and light/dark mode checks using synthetic data.
- Applicable unit/database/browser/build/lint/types/format/OpenSpec checks and final-head CI before PR handoff. No hosted acceptance claim from local checks.

## Approval and next step

The overview and written design are approved. Execute the implementation plan and OpenSpec tasks, verify, and publish the linked PR to develop. Existing unrelated `next-env.d.ts` changes remain untouched. No PR merge or deployment is included.
