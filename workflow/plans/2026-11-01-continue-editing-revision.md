# Continue editing saved revisions implementation plan

**Goal:** Students can reopen an owned saved Python/Java revision, edit/run/test it and submit a new revision without changing the original.

**Issue:** [#50](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/50). Branch: `feat/continue-editing-revision` from develop `a80d205`. Spec: build-programming-platform, assignments-and-grading, task group 20. Inline execution; no specialist delegation authorized.

## Design and approaches

Use the existing real assignment page with a `fromRevision` UUID query parameter. Resolve verified identity and published assignment first; an explicit ownership/assignment/language-filtered read supplies validated revision ID, number and exact source. The URL contains no source. This implements the user's accepted next-feature outline. A separate editor route duplicates workspace behavior; browser storage adds stale/private persistence outside this scope. Server loading needs no new dependency, endpoint, migration or storage.

Add Continue editing on submission detail only when its assignment is available with matching language, and a compact accessible edit link in assignment revision history. Invalid/duplicate/missing/peer/mismatched IDs fail closed. Preview fixtures never load real revisions. Normal assignment visits stay blank. Use assignment plus revision ID as editor identity so selecting a revision resets source, while refresh after saving preserves newer edits. Initialize source and saved baseline from the exact loaded source. Show Editing revision N; actual edits activate the existing guard, including query-only navigation. Existing submit API creates an immutable revision with request-bound retries.

## Constraints and review focus

- Node 24; existing React/Next/Supabase/RLS and browser-only runner. No AI, grade, XP or schema changes. Do not merge AI PR #49.
- Source stays out of URLs/storage; server never compiles or executes it. Preserve whitespace and the existing 8,000-character limit.
- Preserve `.env.local` and unrelated next-env.d.ts development edit. Use scoped synthetic fixtures; no database reset.
- Check returning to a revision, selecting another revision, save refresh with newer edits, peer forgery, malformed IDs and unpublished assignments.
- Author review only; independent teammate and human log verification remain pending.

## Tasks

- [x] Write failing query/loader tests for strict IDs, exact owned reads, invalid data and safe failures; implement projected server loader/link helper.
- [x] Add page integration, revision actions and initial draft baseline; verify query selection resets editor while refresh retains edits. Keep editor/submit disabled until form hydration; deterministic paused-JavaScript regression verified RED then GREEN.
- [x] Add both-language browser journeys for exact prefill, run/edit/new revision/original preservation, canceled replacement and private/mismatched/unpublished/invalid targets. Run unsaved-code regressions and applicable unit/build/static/database checks. Final full run: 54 passed/seven skips; six focused new checks include both browser runtimes. 267 unit tests and 124 database assertions passed.
- [ ] Update verified guides/log/specs, commit verified milestones, push and create labelled PR to develop. Leave AI PR #49 untouched.
