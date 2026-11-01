# Student list search and filters implementation plan

**Goal:** Let students find assignments and their own saved revisions by title and Python/Java language.

**Issue:** [#44](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/44). **Branch:** `feat/student-list-filters`, directly from `develop` (`35daede`). **OpenSpec:** `build-programming-platform`, assignments-and-grading, task group 18. **PR:** [#45](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/pull/45).

**Execution:** Codex inline, no specialist delegation. The requester approved title search, All languages/Python/Java, helpful empty states, Clear filters and own-history privacy. User-facing wording stays concise. No AI/schema/runtime changes or new dependencies.

## Design and alternatives

Use shared server-rendered Next.js Form GET controls with `q` and `language` URL parameters; **Apply filters** commits both and resets history page to one. **Clear filters** links to the unfiltered list. Back/Forward, bookmarks and refresh retain applied filters. Search is trimmed, case-insensitive literal substring, at most 160 characters. Reject duplicate/nonstring query values, unsupported languages and control characters through the existing not-found boundary; unknown identity fields never influence access.

Filter database queries before history range/25-row lookahead, keeping verified student ID, stable created_at/id descending ordering and metadata-only projection. With title search, use `assignments!inner(title)` so only visible assignment titles can match; otherwise keep the outer join so own revisions of unpublished assignments remain accessible under the neutral title. Language uses stored submission language. Use escaped PostgreSQL `imatch` for literal search, avoiding `%`, `_` and PostgREST `*` wildcard semantics. Assignment queries retain published status and RLS. Preview fixtures apply the same semantics in memory.

Alternatives: filtering the current history page would miss other matching revisions; loading all history into the browser would waste resources. Live per-keystroke requests add calls and pending state for little benefit here. Native GET forms initially restored unapplied form values on Back; use the installed framework's Form client navigation and URL-keyed controls instead. No custom client state is needed.

## Tasks

- [x] Write failing tests for query parsing/literal matching, history query projection/filter ordering and filtered pagination URLs.
- [x] Implement shared filter parsing/form/empty state, assignment filtering and metadata-only history filtering before pagination. Update page tests for verified identity and filter forwarding.
- [x] Verify real local student journeys: both languages, combined title filters, 25-row pagination/reset, literal special characters, hidden titles, peer privacy, empty/clear states, reload/history and mobile/theme.
- [x] Run full unit/lint/format/type/build checks, relevant browser regressions, strict OpenSpec/scaffold/whitespace checks. Use synthetic fixture records without local reset.
- [x] Update verified guides, dated log and task completion; commit/push and create a labelled PR to develop linking issue/spec/plan/log/evidence.

## Review focus

1. Title matches beyond the first unfiltered history page must be returned before pagination.
2. Hidden assignment titles must not influence search, while language-only filters retain own hidden history.
3. Regex/LIKE punctuation, Unicode, HTML and query syntax remain literal safe text.
4. Next/Previous preserve applied filters; applying/clearing filters resets page one.
5. Repeated query keys, invalid languages and forged identity cannot broaden access.

## Evidence

157 unit tests, 59 pgTAP assertions, 14 production Chromium passes with one local-email skip, and 22 fixture UI/layout passes on full rerun. Next production build/TypeScript, lint/format, six strict OpenSpec items, scaffold and whitespace checks pass. The fixture Menu test had one transient detached-element timeout before passing in isolation and on full rerun; no fix claimed. No new source execution, live AI or deployment checks. Independent teammate review and human summary verification remain pending.
