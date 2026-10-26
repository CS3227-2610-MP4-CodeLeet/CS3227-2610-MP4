# Planned test suites

Add unit tests for shared services/context/output validation; database tests for RLS and concurrent operations; browser tests for student/instructor workflows and actual Python/Java execution; and deterministic plus bounded live AI security evaluations.

Use synthetic data and local/disposable databases. Keep hosted production credentials out of tests. Vitest now checks public DTO projection, draft filtering and preview environment restrictions. Chromium covers the production home page, denial of preview routes in production with the flag set, and the separate local preview's Python/Java navigation, empty/loading/error/unavailable states and mobile width.

Run pnpm build before pnpm test:e2e. The suite starts its own production server on 3100 and an isolated dev server on 3101, using .next-preview to avoid a developer's existing dev lock. These synthetic tests do not establish real student authorization, database/RLS or submission behavior.
