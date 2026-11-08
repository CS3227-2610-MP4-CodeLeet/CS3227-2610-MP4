# Session: 26 October 2026, Next.js/shared-tooling bootstrap

- Timezone: Asia/Singapore
- Participants: requester and Codex main session; no specialist subagents invoked
- Human verification: pending

## Request and scope

The requester explicitly asked to initialize Next.js and shared tooling after assigning themselves bootstrap ownership. Used the OpenSpec implementation skill for build-programming-platform, task 2.1. Shared auth, migrations, assignment creation and AI gateway remain teammate-owned. This session does not implement issue #5's student journeys.

## Changes

Created fresh src/app layout/home/styles, shared cn helper, shadcn configuration, exact-pinned manifest/lockfile, Node/pnpm versions, TypeScript/PostCSS/ESLint/Prettier configuration, Vitest configuration and a Chromium production-page smoke test. Added application CI and updated current-state/setup documentation. The home page honestly says features are coming soon. No remote fonts, credentials or hosted services are required to render it. No previous MP files were copied.

The pnpm workspace explicitly permits Tailwind oxide, esbuild and sharp build scripts; it skips OpenSpec's optional completion tip and unrs-resolver's fallback installer, using platform optional packages instead. Dependencies and default versions were checked through npm and primary framework/tool documentation. Node's system certificate store was enabled for local installation only; TLS verification was not disabled. No secrets were added.

## Failures and corrections

- Initial registry lookup failed certificate verification; process-scoped NODE_OPTIONS=--use-system-ca resolved it.
- An initial pnpm build-policy setup used obsolete onlyBuiltDependencies/ignoredBuiltDependencies keys; the current pnpm 12 allowBuilds map corrected the install failure.
- ESLint 9 is marked deprecated by npm. Version 10 was tried, but Next's current React/import/accessibility plugins reported incompatible peers; reverted to exact 9.39.5. No peer-range override was used.
- Initial lint found an anonymous PostCSS default-export warning; named the config and reran successfully.
- Vitest warned about CommonJS package context; set the app manifest to type module and rechecked.

## Verification

- Dependency install and frozen-lockfile replay: passed using pnpm 12.15.0 with no lockfile changes required.
- ESLint: passed after correction.
- Route generation and TypeScript: passed, including the final ESM package context.
- Production Next.js build: passed (home and not-found prerendered), repeated successfully after the ESM metadata change.
- Playwright Chromium smoke: final run 1 passed against local production server; verifies heading/title, CSS, assets, HTTP and browser errors without service credentials.
- Prettier check: passed after final metadata updates.
- Vitest: configured and runs, zero test files; no domain-test coverage claimed.
- Scaffold/local links, strict OpenSpec validation (1 change, 0 failures) and tracked diff whitespace checks: passed.
- Hosted CI/deployment, Supabase/RLS, student features, AI and code runtimes: not run/implemented.
- Independent review: not performed. No tokens/cost/savings measurements available.

## State and next step

Task 2.1 is complete. Task 2.3 remains unchecked because database/feature checks depend on future code and shared migrations. No commit, push, PR, deployment or external teammate message is included. Next work is issue #5's fixtures/UI and a teammate handoff for auth/schema; feature acceptance requires real authorization checks later.
