# Session: 30 October 2026 My submissions

- Timezone: Asia/Singapore
- Participants: requester and primary Codex agent; no specialist delegation
- AI tool: Codex; model/token/cache measurements unavailable
- Issue: [#23](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/23), refs #5
- OpenSpec: build-programming-platform task group 10
- Branch: feat/my-submissions from origin/develop a714fa6
- PR: pending
- Human verification: pending; verifier/date not recorded

## Prompt and interaction summaries

1. Requester accepted the proposed My submissions feature: sidebar tab, own cross-assignment revision list with title/language/revision/date, links to existing code/feedback/published grades, loading/empty/error states and privacy checks. Remote deployment/runtime and the shared AI gateway remain teammate-owned work.
2. Read brief/process, current routes/shared shell, verified session helper, RLS and relevant planning/TDD/Supabase/Next documentation. Verified the checkout was docs/run-code-check, fetched develop and created feat/my-submissions from a714fa6, preserving the generated Next declaration edit. Created issue #23 before implementation. No migration is required; existing RLS protects revisions and grade publication.
3. Design: metadata-only session-scoped query, 25 rows plus one lookahead, stable newest-first ordering, bounded page numbers and unavailable-title fallback. Share the workspace across list/detail and preserve safe role/session checks. No synthetic authenticated history or grade/source preload. Retrieved official Supabase select/range docs; changelog.md could not be opened by the web tool because its Markdown content type was unsupported. No dependency/API migration was introduced.
4. Wrote history parsing/query tests before their modules existed and observed the missing-module failure. Implemented the metadata-only loader, validation, list/pagination/empty state, route loading/safe retry UI, role-guarded layout and authenticated navigation. Existing details now share the workspace and offer All submissions; assignment title mapping accepts actual object joins as well as arrays, correcting the old blank-title assumption. The new 18 tests passed, including page-level identity rejection and safe failure/loading markup; full unit suite: 125 passed.
5. Real browser fixtures use four synthetic local accounts, Python/Java assignments, 27 own revisions with equal timestamps to test ID tiebreak ordering, one peer revision, private rubrics and published/draft grades. Fixture teardown owns its independent request context and deletes only generated records. An initial assertion read streamed rows before they were ready; added a row-count wait. The next run waited for Sign out on the generic not-found page; tests now return to the list before continuing the account switch.
6. Adding a loading boundary means Next can stream a not-found HTML page with HTTP 200. Confirmed this in the installed Next documentation and failure snapshot; adjusted privacy assertions to require the not-found UI, no source element and the unchanged API 404. No access control was relaxed. The final real browser journey passed, covering both language metadata, paging, forged student_id ignored, mobile fit, inert HTML-like titles, original source/published grades, hidden draft data, unavailable assignment title, empty account, peer denial and instructor/signed-out redirects. Build/TypeScript and all 59 existing database assertions passed without a migration/reset.

## Work and verification

- Plan: workflow/plans/2026-10-30-my-submissions.md
- Checks/results: 125 unit tests; 59 existing DB assertions; one comprehensive authenticated history browser journey; build/type checks passed. Production/workspace regressions and publication pending.
- Independent review: not performed; human review pending
- Failures/retries: expected initial missing-module red check; streaming-row wait; return navigation after generic 404; documented streamed HTML status expectation. Lint-driven props/helper extraction, shared path/text constants and fixture callback rename (to avoid treating the Playwright callback as a React hook).
- Resource measurements: unavailable
