# Instructor-configured assignment XP — approved design

Issue [#77](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/77); branch `feat/assignment-xp` from merged develop `00ae158`. OpenSpec: `build-programming-platform`, community-and-xp and assignments-and-grading. Status: explicitly approved by the requester on 2 November 2026, including recalculation, bounds and legacy rollout. Implementation and verification are in progress. This is requester approval, not a claim of teammate review.

## Confirmed rules

- The instructor sets each assignment's maximum XP when creating/editing it.
- Award `floor(earned published score / maximum rubric score * assignment XP)`.
- Count only the student's best currently published result for that assignment; never sum repeated submissions.
- Grade corrections replace/recalculate the resulting award; repeated or concurrent publication cannot duplicate XP.
- Unpublished grades and browser test results award no XP. If a grade becomes unpublished, recompute from remaining published candidates.
- Students see their own total XP and assignment-level awards. Leaderboard is a later feature.

## Confirmed maximum-XP edit policy

The requester chose recalculation: changing an assignment's maximum XP recalculates its existing awards using the new maximum, in the same transaction as the configuration change, with auditable deltas rather than duplicate awards. Maximum XP is not locked after grading. Published grade score/denominator snapshots remain the basis; only the assignment XP multiplier changes.

## Approved implementation choices

Add a required numeric **Maximum XP** field to the new/edit assignment UI, with explicit whole-number bounds of 0–100,000; zero means no XP. Existing assignments default to zero, and older API clients omitting the field preserve existing values. The requester approved these concrete bounds/defaults with the design.

Keep the authoritative award per student/assignment in server-controlled storage and record actual deltas/reasons in an auditable ledger. Derive the amount from authorized published grade data. Perform grade publication/corrections/unpublication and award adjustment in the same database transaction, serialized for the affected assignment/student. Compare resulting amounts before recording adjustments so retries do not inflate totals. Browser/AI/client XP claims cannot write awards.

Capture each new published grade's rubric maximum so later rubric edits do not silently change the meaning of an old score. Existing published grades lack a historical maximum snapshot; approved rollout is to require instructor review/republishing before those grades earn XP, rather than inventing a historical denominator. Changing this rollout choice requires an explicit documented alternative.

Show own total and assignment breakdown through verified-student, source-free queries with RLS. Public assignment maximums may be shown, but unpublished grades, private rubrics and other students' award details remain hidden. No new provider calls, uploads, badges or server execution. Keep leaderboard/private-data-safe ranking for the next change.

## Verification and rollout

Test fractional-score flooring, zero XP, boundaries, best of multiple revisions, ties, lower corrected grades, withdrawal of the best grade, no remaining published grade, identical publication retries and concurrent grading of different revisions. Verify owner-only configuration/publication and deny student/foreign-instructor forged awards. Verify rollback preserves both grade and XP state on errors, plus existing assignment/submission/deadline/test-case flows.

Use additive migrations and synthetic transactional/browser fixtures only; do not reset existing data. Record independent review scope, exact checks/skips and hosted migration requirements. Push verified milestones and pass branch/final PR CI before handoff. Teammate/human review and hosted release remain separate.
