# Contributing

1. Select a small capability or task from the active OpenSpec change.
2. Create a feature branch from `develop`, the integration branch. Open feature PRs against `develop`; promote tested releases to `master`, the grading/release branch, through a separate PR.
3. Record owner, scope, acceptance scenarios, security impact, and validation plan before implementation.
4. Use `workflow/templates/Handoff.md` when delegating. Coordinate shared types, schema, and files before concurrent edits.
5. Implement the smallest complete change, with appropriate tests and a separate review for material application/security changes.
6. Run applicable checks, attach evidence, and update guides/logs. Do not describe planned checks as passing checks.
7. Open a PR using the repository template. Merge through review and promote tested work to `master` for release.

Current scaffold checks:

```sh
node workflow/scripts/check-scaffold.mjs
openspec validate --all --strict
```

The application foundation uses Node.js 24 and pnpm 12.15.0. Run pnpm install --frozen-lockfile, pnpm format:check, pnpm lint, pnpm typecheck, pnpm test:unit and pnpm build. For production-boundary and dev-preview browser checks, install Chromium with pnpm exec playwright install chromium, then run pnpm test:e2e. Unit tests cover synthetic public-field projection and preview gates; database/RLS and real feature acceptance remain future work. Do not equate fixture tests with authenticated feature acceptance.
