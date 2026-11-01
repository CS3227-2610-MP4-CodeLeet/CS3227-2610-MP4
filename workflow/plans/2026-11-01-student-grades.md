# My grades implementation plan

Issue [#52](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/52), branch `feat/student-grades` from develop `ec7bcde`. OpenSpec: build-programming-platform, assignments-and-grading, task group 21. Inline implementation; no specialist delegation requested.

## Design and approaches

Implement the accepted independent My grades feature with existing tables and policies. A dedicated student page is clearer than adding grades to every submission row, and querying existing published grades avoids a new aggregate/schema contract. List one entry per graded revision, newest published_at then ID descending, 25 entries plus a lookahead. Show assignment title, language, revision, numeric score without an invented denominator, SGT publication time, expandable plain-text feedback and a link to the existing revision page. Empty/loading/unavailable/filter states and mobile/theme support reuse the workspace. Add My grades after My submissions in authenticated navigation.

The server requires student identity, filters grades by non-null published_at and the nested submission's verified student ID, and projects only list/feedback fields. Apply bounded literal title/language filters before pagination using existing list utilities. Preserve own grades when assignments are hidden through an outer assignment join; title searches require an inner title join and cannot search hidden metadata. Invalid/duplicate filter/page values use not-found; unknown identity query fields are ignored. Return safe failure UI without backend details. Share pagination with submission history to avoid duplicating filter/paging behavior.

## Constraints and review focus

Node 24, existing Next/React/Supabase; no dependency, schema, AI gateway, grade publication, XP or environment changes. No percentages/averages inferred from private rubrics. Null scores render as unavailable while published feedback remains accessible. Preserve source/rubric/peer/draft privacy and existing unpublished-grade RLS. Keep `.env.local` and the pre-existing next-env.d.ts edit. Use scoped synthetic fixtures and no database reset. Independent teammate and human log review remain pending.

## Tasks

- [x] Write failing projected-query/parser and safe-render tests; implement owned published-grade loader and DTO parsing.
- [x] Add My grades routes, workspace navigation, filters, feedback and shared pagination; preserve history behavior.
- [x] Verify synthetic publication/ownership/hidden-data boundaries, title/language filtering before paging, deterministic ties, empty/error/mobile/theme and revision navigation; run applicable regressions and static/build/database checks. 312 unit tests, 124 database assertions and 57 full-suite browser checks passed; seven opt-in/prerequisite skips.
- [x] Update verified guides/spec/log evidence, commit verified milestones, push and create labelled [PR #53](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/pull/53) to develop. No merge or deployment performed; independent teammate/log review pending.
