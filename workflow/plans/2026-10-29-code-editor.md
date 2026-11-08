# Syntax colours and line numbers

Issue #15; PR #16; branch `fix/account-workspace-controls`; active OpenSpec `build-programming-platform`, task 7.17. This follows the request to add IDE-like syntax colours and line numbers to the real editor.

Use one native textarea editor with a read-only, aria-hidden React token layer and line gutter. `prism-react-renderer` 2.4.1, Prism 1.30.0 and its development types 1.26.6 are already resolved by the product website; pin it as a direct application dependency (MIT). Use Python/Java grammars and light/dark themes. React renders source tokens as text, never HTML. Preserve textarea accessibility, exact source, validation/focus, existing submission character limit and practice byte limit. Keep typography, tab width and both scroll axes aligned. Fall back to plain text for source beyond the practice size bound; preserve oversized input for correction. Do not add server execution, uploads, network requests from typing or a full IDE service.

- [x] Add browser regressions for token colors/line numbers in both languages, themes, scrolling, mobile fit and source preservation; observe failure.
- [x] Build the shared editor and replace both textarea presentations; keep form/runner data flow unchanged.
- [x] Run focused and existing regressions, unit/lint/type/build checks; update guides, dependency acknowledgement and log.
- [x] Commit/push the verified editor addition and update PR #16; human review remains pending.
