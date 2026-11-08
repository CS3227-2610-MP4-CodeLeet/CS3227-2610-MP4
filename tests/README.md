# Planned test suites

Add unit tests for shared services/context/output validation; database tests for RLS and concurrent operations; browser tests for student/instructor workflows and actual Python/Java execution; and deterministic plus bounded live AI security evaluations.

Use synthetic data and local/disposable databases. Keep hosted production credentials out of tests. Vitest now checks public DTO projection, draft filtering and preview environment restrictions. Chromium covers the production home page, denial of preview routes in production with the flag set, and the separate local preview's Python/Java navigation, empty/loading/error/unavailable states and mobile width.

Source-entry tests add ASCII/multibyte byte-limit boundaries, blank/NUL/malformed Unicode and inert text checks. Browser checks verify disabled submission, no source transfer, input preservation after errors, fixed language and assignment isolation. These are local preview checks, not real submission or server-side validation evidence.

Run pnpm build before pnpm test:e2e. The suite starts its own production server on 3100 and an isolated dev server on 3101, using .next-preview to avoid a developer's existing dev lock. These synthetic tests do not establish real student authorization, database/RLS or submission behavior.
