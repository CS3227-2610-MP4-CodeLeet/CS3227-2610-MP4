# Compare revisions implementation plan

Issue [#56](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/56); branch `feat/compare-revisions` from develop `bfc26dd`. Active OpenSpec: build-programming-platform, assignments-and-grading, task group 23. Implement inline; no specialist delegation requested. Human verification remains pending.

## Goal and design

Let students inspect changes between two own saved submissions for one assignment/language without editing or executing either. Add Compare revisions on revision detail and a dedicated server-rendered comparison route anchored by that owned revision. Use From revision / To revision numeric controls, bounded to the latest own revision, with GET URL state. Default to predecessor/current; opening revision one defaults to first/latest. One saved revision gets a helpful empty state. Both columns have line numbers; one unified change list uses Added/Removed markers and theme-aware colours, with a keyboard-scrollable region on mobile. Same revision/identical source produces No changes. Preserve originals; no AI, grades, XP or execution writes.

Approaches considered by the agent: a unified view is compact and works on mobile; side-by-side comparison consumes width and a new editor/diff dependency increases shipped code and review scope. Select unified server-rendered text with no dependency. Numeric revision controls avoid downloading an unbounded revision list. Agent-selected details are not recorded as teammate decisions.

## Interfaces and boundaries

- `comparison-selection.ts`: parse optional positive decimal revision numbers up to PostgreSQL int max; reject arrays/duplicates, zero, signs, decimals, huge values; `comparisonPath(id)` contains only the revision UUID.
- `revision-comparison.server.ts`: verify anchor UUID, projected own metadata and language; load latest revision metadata with explicit student/assignment/language filters, then at most two selected sources with identical scope and existing RLS. Reuse the source contract (1–8,000 characters, no NUL). Return null on unavailable/invalid/error; no backend details. Preserve own history when assignment title is hidden, using its existing neutral label. Read no rubric/grade or peer data.
- `revision-diff.ts`: pure whitespace-sensitive line comparison, normalize CRLF/CR only for display/comparison, retain trailing empty lines. Trim common prefix/suffix, compute longest common subsequence only up to 250,000 middle cells; otherwise display removed/added middle blocks. Bound work/memory without claiming every diff is minimal. Output rows contain kind, text, old/new line numbers.
- `revision-comparison.tsx` and route `/student/submissions/[submissionId]/compare/page.tsx`: verified student guard, safe React text, normal GET navigation and back links, existing loading/error ancestors. No source in query strings, logs or persistent browser state.

## Review focus

Peer/cross-assignment selection; hidden titles; missing/duplicate/out-of-range revision parameters; repeated/blank/Unicode/HTML-looking lines and final newline; equal/reversed revisions; worst-case 8,000-character input; no horizontal viewport overflow; refresh/Back resetting form state; no database writes and exact source preservation.

## Tasks

- [x] Add failing selection/diff tests, observe failure, implement bounded comparison, verify and commit the pure helpers.
- [ ] Add real-SDK query/validation tests and page/render tests first; implement own metadata/selected source loading and comparison view/link, then verify and commit.
- [ ] Add scoped local synthetic Python/Java browser tests for selection/defaults/navigation, privacy, hidden/single/identical revisions, themes/mobile and immutable data. Verify local full units, applicable database/browser/build/type/lint/format/spec/scaffold checks; update guides and chronological log.
- [ ] Author-review the final diff, push feature branch, wait for branch CI, create linked PR to develop with normal-sized body text, then wait for final PR checks to pass. No merge/deployment action. Independent review pending.

## CI prerequisite

PR #55 is still open. Include its already-verified runtime download fix as two exact source/test files, not the forum feature. Preserve approved hashes, byte sizes and three-attempt rejection. Related runtime issue #31. Record that prerequisite in PR evidence. All GitHub checks must pass on the final PR head before handoff; skipped prerequisites must be stated.
