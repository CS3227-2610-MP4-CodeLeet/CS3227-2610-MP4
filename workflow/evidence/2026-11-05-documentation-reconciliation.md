# Documentation and reflection reconciliation, 5 November 2026

Issue [#98](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/98), branch `docs/98-reflection-evidence-audit`, baseline develop `29b6c1a7df07e5e08bcbc2db9dee0bb98f7427c7`. This is a source/evidence audit, not new product acceptance or member sign-off.

## Current facts and proof

| Fact | Evidence inspected | Scope |
| --- | --- | --- |
| Course workspaces merged | [PR #91](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/pull/91), [fixes #93](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/pull/93), `src/app/courses/`, `src/lib/courses/`, course-aware routes/tests | Supersedes current-status wording that PR #91 is open. Historical logs retain what was true at the time. |
| Authentication connected, updated server-key name | [PR #95](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/pull/95), [PR #97](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/pull/97), `src/app/page.tsx`, sign-in routes/service and `metadata.server.ts` | Home redirects authenticated members to Courses. `SUPABASE_SECRET_KEY` and `AUTH_RATE_LIMIT_SECRET` are server-only. No secret values inspected. |
| Baseline application/database CI succeeded | [Run 41861503188](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/actions/runs/41861503188), head `29b6c1a` | Application and database succeeded. Coverage-report job skipped. These are historical baseline checks, not a fresh run of this audit. |
| Documentation site published and available | [Pages workflow 41861502845](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/actions/runs/41861502845), Pages API and HTTP HEAD checks | [Overview](https://cs3227-2610-mp4-codeleet.github.io/CS3227-2610-MP4/), [User Guide](https://cs3227-2610-mp4-codeleet.github.io/CS3227-2610-MP4/docs/UserGuide), [Developer Guide](https://cs3227-2610-mp4-codeleet.github.io/CS3227-2610-MP4/docs/DeveloperGuide) each returned HTTP 200 on 5 November. Does not prove deployed app acceptance or freshness of every served paragraph. |
| Deadline closeout merged and final checks verified | [PR #60](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/pull/60), [deadline log](../../logs/2026-11-01-assignment-deadlines.md), [final application/database run 41318181680](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/actions/runs/41318181680) | Inspected final head `90481eff5b0153b631da8b04238da0860e95e881`: application, database, scaffold, both CodeQL analyses/gate and Vercel statuses succeeded. Supabase Preview skipped. GitHub reports merged on 1 November. Human/independent review remains distinct. |
| Final grading branch not yet current | GitHub compare `master...develop` on 5 November | Develop ahead by 63 commits, none behind. No merge or release performed. Count can change after this audit. |

## Paul's contribution and conclusion audit

Paul's session statements confirm student focus, browser execution constraints, deadline late-acceptance policy, progress overview design and his report that John also independently found or verified the retry issue. The [runtime coordination](runtime-feasibility/coordination.md), [deadline log](../../logs/2026-11-01-assignment-deadlines.md) and [dashboard log](../../logs/2026-11-03-student-progress.md) identify actual agent actions separately. The dashboard log records `/root/student_progress_review`, not a named human reviewer. Paul's report about John is additional human context, not invented log evidence.

The reflection's runtime 11/11, Java follow-up 31 cases and dashboard 674 unit/321 database/three browser journeys are historical, scoped results from their linked records. The local runner's output cap, network recorder and timeout observations do not establish general browser/production security. No matched development baseline, internal reasoning percentage or total token/cost saving is available. Budget assignments are not measured usage. These limits are retained.

Paul's reflection is evidence-reviewed, not automatically personally approved. John's reflection and teammate verification of interaction summaries remain untouched/pending. The user requested an audit, not certification that every generated first-person statement reflects their final view.

## Student contract reconciliation

Early contract v1 remains historical planning, not the current interface. [Current contracts](../../src/features/codementor/contracts.ts), [submission route](../../src/app/api/submissions/route.ts), [archived MVP specification](../../openspec/changes/archive/2026-10-29-deliver-codementor-mvp/specs/programming-assignments/spec.md) and [course requirements](../../openspec/changes/build-programming-platform/specs/course-workspaces/spec.md) supersede incompatible scaffold assumptions.

| Concern | Early plan | Current source and evidence |
| --- | --- | --- |
| Session/access | `requireStudent` and global student role | Verified member session plus course membership/feature checks and RLS. See `src/lib/auth/verified-user.ts` and `src/lib/courses/access.ts`. |
| Payload/routes | Student-specific planned endpoints | `POST /api/submissions` validates assignment ID, source and requestId; derives course/identity from trusted records/session and calls `submit_code`. |
| Source size | 32 KiB UTF-8 preview contract | Current persisted source uses a maximum of 8,000 characters in the strict Zod contract. The old byte-bound expectation is not silently marked tested. |
| Languages/history | Python/Java, immutable revisions | Language derives from assignment/RPC; owned immutable history, retry handling and privacy checks are in Java integration and student acceptance records. |
| Errors/timing | Planned response and identity fields | Current route/HTTP helpers and RPC own identity, revision, timestamp/deadline metadata. Client results cannot publish grades or XP. |

## Broad OpenSpec task decisions

These decisions reconcile duplicate early unchecked rows with later evidence. They do not broaden test claims or mark a partial release complete.

| Tasks reconciled as complete | Evidence |
| --- | --- |
| 1.1 names/task budgets, 1.4 contract mapping | Current brief, runtime coordination, and explicit compatibility table above. No claim that current mapping preceded historical implementation. |
| 2.9 real-runtime journeys, 3.2 adapters | Task group 19 and [diagnostics log](../../logs/2026-11-01-java-runner-diagnostics.md) record six actual browser runtime tests. [Java input](runtime-feasibility/java-input-resolution.md) and [boundary review](runtime-feasibility/independent-test-review.md) retain detailed scope. |
| 3.1 assignment/rubric/browsing, 3.3 immutable revisions | Current assignment/submission routes and course services, [Java integration](../../logs/2026-10-29-java-assignments.md), [student acceptance](2026-11-03-student-acceptance.md), merged course PRs. |
| 4.2 gateway/contracts, 4.3 cache/quotas/timeouts, 4.4 role AI/advisory publication, 4.5 automated negative checks | `src/features/codementor/`, `src/lib/ai/`, [security evidence](2026-11-02-security-testing.md), baseline CI and [course fixes](../../logs/2026-11-04-course-workspace-fixes.md). Product provider limits remain a separate open gate under 4.1. |
| 4.6 bounded live evaluation | [Promptfoo evidence](2026-11-02-promptfoo-ai-security.md) records historical 5/10, 9/10 and 10/10 runs, synthetic scope and limitations. No live call made for this audit. |
| 6.1 actual coordination, 6.5 site publication | Runtime actual agent IDs/handoffs; Pages workflow and three public HTTP checks above. |
| 7.2 fixtures, 7.3 browsing, 7.4 editor, 7.5 authenticated saves, 7.6 own history, 7.7 actual local privacy | [Student acceptance](2026-11-03-student-acceptance.md), [Java assignment log](../../logs/2026-10-29-java-assignments.md), [security map](2026-11-02-security-testing.md), current source/tests and baseline CI. Test counts/skips retain recorded baselines. |
| 24.4 deadline PR/CI closeout | Deadline log, merged PR #60 and final head/check results recorded above. Merge alone was insufficient, so final status evidence was inspected during this audit. The task's independent/human-review caveat is retained, not certified by merge. |

Still open: 1.3 supported-browser/security acceptance, 3.5 exhaustive original cross-boundary/race matrix, 4.1 live key-specific limits, 6.2 controlled development context/handoff comparison, 6.3 full guide/log/member approval, 6.4 deployment separation/recovery, 6.6 hosted role/security journeys and 6.7 final human approval/archive/master. Task 7.1 still asks for pre-integration compatibility, 7.8 includes an obsolete byte-bound test matrix, and 7.9 requires its own full integration/review closeout. This audit records their mismatch without pretending an old gate was satisfied retroactively. Tasks 13.5/13.6 remain open for issue #31. No requirement was narrowed to manufacture completion.

## Fresh documentation verification

Recorded after execution in the [session log](../../logs/2026-11-05-reflection-doc-audit.md). No product behavior, schema, secret, deployment or master change is part of this work. Final branch and PR checks are separate from baseline CI.
