# Session: 1 November 2026 compare revisions

- Timezone: Asia/Singapore
- Participants: user and primary Codex agent; no specialist delegation
- AI tools/model: Codex; exact model and hidden reasoning/cache metrics unavailable
- Issue: https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/56
- OpenSpec: build-programming-platform, assignments-and-grading, task group 23
- Branch: feat/compare-revisions from updated develop bfc26dd
- Plan: workflow/plans/2026-11-01-compare-revisions.md
- PR: pending
- Human verification: pending
- Verifier/date: pending

## Prompt and interaction summaries

1. User resumed Compare revisions after the previous PR CI fix, requesting that future PRs pass all CI. Read the brief/process, applicable skills, current revision/history/auth/test code, installed Next page/Form documentation and current Supabase filter documentation. Changelog Markdown could not be rendered by web; no package/API upgrade planned. Selected a compact unified server-rendered diff with From/To revision numbers, explicit own metadata/source reads, existing RLS and immutable source. Existing feature approval authorizes implementation; no further confirmation requested. No agents delegated.
2. Fetched origin and confirmed PR #55 remains open; develop remains bfc26dd. Created independent enhancement issue #56 and feat/compare-revisions from origin/develop, preserving next-env.d.ts and .env.local. Included exactly the verified runtime downloader/test files from PR #55 as a CI prerequisite, no forum implementation or remote merge. Recorded design/plan and OpenSpec task 23; new work and checks pending. Persisted the user's final-head CI handoff preference in the agent process.

## Work and verification

- Planned source scope: src/features/student-submissions and the new compare route; tests, verified guides and workflow/OpenSpec records.
- Actual checks and results: pending.
- Limitations: independent review, hosted smoke and human log verification pending; no comparison product behavior claimed yet.

3. Test-first pure helpers: new suite failed because modules did not exist, then 18 selection/diff tests passed. Implemented strict positive bounded revision numbers, line-ending normalization for comparison only, whitespace/final-newline retention, deterministic line numbers, prefix/suffix trimming and a 250,000-cell middle comparison cap with conservative remove/add fallback. Reconstructed both sides for repeated/Unicode/markup and 8,000-character worst-case cases. Full 331 unit tests and strict OpenSpec validation passed; focused lint passed. No source mutations or new dependency.

4. Added SDK-backed query tests, observed missing-module failure, then implemented server-only projected own anchor/latest reads and at most two explicitly scoped source reads. Fourteen loader tests passed for both languages, selected/equal/reversed/default pairs, hidden titles, invalid anchors, source bounds and missing rows. Added view tests before its module, observed failure then implemented safe text and accessible unified diff, numeric GET controls and single/identical states. Added route guard/parameter tests. Full suite passed 349 units; local TypeScript found Vitest array test data needed wrapping as objects (otherwise each row became positional arguments); corrected and confirmed the intended invalid arrays are actually supplied. Author-rechecked privacy and source bounds.

5. Four focused real production Chromium journeys passed with scoped local synthetic accounts/assignments: both languages, immutable originals, selection/reversal/equality/refresh/Back, hidden metadata, single revision, mobile/themes/keyboard focus and peer/invalid/role denial. Existing 124 transactional database assertions passed; no reset or migration. Local network runtime build failed even with elevated permissions; staged already-reviewed ignored cached assets through the unchanged full size/hash/approval verifier, then direct Next production build passed. This is not a successful local network download claim. Iterated lint helpers/constants to fit repository limits; full browser regression run pending. Added verified comparison guide paragraphs and design record. Independent reviewer/human log verification remain pending.
