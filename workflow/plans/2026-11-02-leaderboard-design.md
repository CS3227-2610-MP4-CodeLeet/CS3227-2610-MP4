# XP leaderboard — proposed design

Issue [#80](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/80); branch `feat/leaderboard` from develop `00ae158`. Active OpenSpec: `build-programming-platform`, community-and-xp/task 5.2. Dependency: [XP PR #79](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/pull/79), open when checked. Status: concrete proposal awaiting requester approval; no product implementation. The requester authorized leaderboard work but has not yet confirmed the tie-rule question or this design.

## Intended experience

- Add **Leaderboard** to student navigation and the instructor workspace.
- Show a simple table with **Rank**, **Username** and **XP**, 25 rows per page with Previous/Next. Reuse existing light/dark/mobile patterns; no badges or decorative achievement system.
- List current students with positive total XP, highest first. Avoid exposing a directory of unused zero-XP accounts.
- Proposed shared ranks: equal XP receives the same rank, e.g. **1, 1, 3**. Within a tie, sort by case-insensitive username, then a stable internal identifier. Neither alphabetical order nor the identifier changes the shared rank. Duplicate usernames remain possible.
- Students also see their own XP/rank even when their row is on another page. Highlight their row with **You**. A student with zero XP sees zero and an unranked state. Instructors/admins can browse but are not ranked and have no student summary.
- An empty board says **No rankings yet**. Errors offer **Try again**, without presenting failed loads as an empty board. Refresh/reopen obtains current results; no automatic polling or realtime subscription.

These details, including positive-XP membership and shared ranks, are coordinator recommendations for this review, not previously confirmed requester decisions.

## Approaches considered

1. **Live aggregation from trusted XP awards — recommended.** Sum existing server-owned awards, rank current students and return the page/own position from one database statement. Grade corrections, maximum edits and withdrawals appear on the next request; no second persisted total can drift.
2. **Persisted/cached leaderboard.** Faster at much larger scale, but adds invalidation, duplicate state and correction consistency work without a demonstrated need in this shared-course project. Defer until measured demand justifies it.

For ties, shared competition ranks reflect equal achievement. Unique ordinal positions are an alternative if requested, but would assign different ranks to equal XP. The earlier async question remains unconfirmed; approval of this document would select the recommended approach and shared-rank policy.

## Data and privacy boundary

Use the existing app, Supabase and XP storage; add no runtime, model/provider or execution dependency. The authoritative value is each student's summed current `xp_awards`, not browser test results or client claims. Preserve the existing published-grade formula, best-revision rules, correction/withdrawal behavior and hidden-assignment XP policy. Do not recompute from private rubric/grade/source tables or list assignment titles.

Keep profile/award RLS and own-only My XP unchanged. A narrowly granted database read function checks verified student/instructor/admin membership, uses a fixed empty search path and returns only rank, username, total XP, row position and an own-row boolean. Raw user IDs, email, profiles, private awards, grade identifiers, submissions and rubrics are excluded. Sorting may use a private stable ID internally, but it is not returned. Missing profile metadata uses a neutral Student fallback, never email. Anonymous and unprovisioned callers are denied.

Compute totals, competition ranks, page lookahead and the student's own position in one statement for a consistent snapshot. Represent totals/ranks as exact decimal strings; keep deterministic page ordering. Page input is an integer bounded to 1–10,000, with 25 rows and one-row lookahead. Reject duplicate or unexpected query parameters, including forged identity/XP/rank selectors. The GET API uses private no-store responses. No client write API or broad profile-read grant is added.

Render usernames as plain escaped text. The signed-in shared collection is the existing product scope; this does not add courses, public internet rankings, search, downloads, personal profile links or leaderboard-driven XP writes.

## Verification, evidence and integration

Before implementation, update the active OpenSpec and write the implementation plan after design approval. Include failing-first tests for shared ties across page boundaries, stable duplicate/untrusted usernames, exact totals, own position outside the page, zero/empty/error states, role changes, signed-out/unprovisioned denial, forbidden peer fields/direct writes and XP corrections/withdrawals/configuration updates. Confirm leaderboard reads do not change award/ledger state.

Use scoped local synthetic students, owned assignments and authorized grade publication to seed different totals and equal-XP cases. Fixture cleanup touches only known synthetic IDs and does not reset existing coursework. No production seeding or provider call is part of this change. Validate student/instructor navigation, mobile/theme behavior and existing My XP privacy in browser checks.

Apply any additive read-function migration before app rollout. XP PR #79 must be present on develop before dependent implementation is integrated; this task does not authorize merging it. Record actual checks, scoped review, failures/skips and human-verification limits in the [summary](../../logs/2026-11-02-leaderboard.md). Push verified commits, pass branch CI before creating the PR, then verify final-head checks. Hosted acceptance and final release remain separate.
