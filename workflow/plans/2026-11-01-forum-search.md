# Forum search implementation plan

Issue [#54](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/54); branch `feat/forum-search` from develop `ec7bcde`. Active OpenSpec: build-programming-platform, community-and-xp, task group 22. Primary agent implements inline; no delegation requested. Started independently of then-open My grades PR #53; after its external merge, integrate updated develop and rerun combined verification.

## Design and approaches

Implement the user's requested thread title/content search on the existing forum list. Agent-selected scope: literal case-insensitive substring search over titles and opening posts, not reply text. Reuse the existing RLS-protected projected thread query and newest-created_at/ID ordering; searching downloaded pages would miss older matches, while full-text indexing/RPC would introduce schema and stemming behavior not needed for this scope. Apply a bounded OR filter before existing 25-row paging. Escape regex metacharacters and separately quote/escape PostgREST values; never interpolate raw terms into grammar. Search is not an authorization boundary; existing member verification and RLS remain enforced.

Use a GET Next Form with q in the URL, explicit Search and Clear search controls, 160-character trimmed bound, no control characters/duplicate parameters and a helpful no-match state. Empty queries browse all discussions. Applying/clearing returns to page one; pager preserves q. Keep reply paging unaffected and text safe through React escaping. Existing posting/replies, quotas and data projections stay unchanged. No schema, dependency, AI, environment, XP or grade changes.

## Review focus

CI follow-up requested by the user: reuse [runtime issue #31](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/31), OpenSpec task 13.9 and PR #55. The compiler currently matches its reviewed bytes/hash; historic CI received bytes were not recorded. Reproduce retries stuck on a cached bad response, then add fresh same-origin query nonces and no-cache requests only after mismatches. Keep three attempts, redirect rejection, inventory approval and exact hash/size gates. Add public size/hash diagnostics. Verify unit/static checks and the actual GitHub application build before claiming resolution; do not change approved hashes or commit distributions.

Quotes/backslashes/commas/parentheses and injection-shaped terms must stay literal; wildcard characters must not match everything. Filtering must precede pagination, with stable ties and no private columns added. Validate roles/fixture boundaries, Back/refresh and pagination query retention, blank/invalid queries and mobile/theme. Preserve environment values and the pre-existing generated next-env edit. Use scoped synthetic fixtures, no database reset. Author review only; independent teammate/log verification pending.

## Tasks

- [x] Write failing query parsing, real SDK filter/projection/order and pager/empty-state regressions; implement escaped search and URL helpers.
- [x] Integrate list loading, search controls, empty copy and query-preserving pagination; preserve existing reply and post behavior.
- [x] Verify title/body matches, literal punctuation/injection, paging/ties, browser history, access denial, safe rendering and mobile/theme with synthetic browser tests; run applicable unit/build/static/database and forum regressions. Combined with merged My grades: 324 unit tests, 124 database assertions, 59 browser passes/seven skips; direct Next build/types/lint/format/spec/scaffold passed.
- [x] Update verified guides/spec/log evidence, commit verified milestones, push and create labelled [PR #55](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/pull/55) to develop. No merge of this PR/deployment performed; independent teammate/log review pending.
