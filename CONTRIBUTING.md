# Contributing

1. Select a small capability or task from the active OpenSpec change.
2. Create a branch from `develop`, the integration branch. Branch names use `<type>/<short-kebab-case-description>` and the type must match the corresponding Conventional Commit type, for example `feat/student-submissions` or `fix/profile-rls`. Open feature PRs against `develop`; promote tested releases to `master`, the grading/release branch, through a separate PR.
3. Record owner, scope, acceptance scenarios, security impact, and validation plan before implementation.
4. Use `workflow/templates/Handoff.md` when delegating. Coordinate shared types, schema, and files before concurrent edits.
5. Implement the smallest complete change, with appropriate tests and a separate review for material application/security changes.
6. Run applicable checks, attach evidence, and update guides/logs. Do not describe planned checks as passing checks.
7. Open a PR using the repository template. Merge through review and promote tested work to `master` for release.

## Branch and commit naming

Use [Conventional Commits](https://www.conventionalcommits.org/) for every commit:

```text
<type>[optional scope]: <imperative summary>
```

Use the same type as the branch prefix. Supported types are `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, and `revert`. Add `!` after the type or scope for a breaking change and explain it with a `BREAKING CHANGE:` footer.

Examples:

```text
feat(auth): add protected student sessions
ci: run local Supabase policy tests
docs: standardize branch and commit names
```

Keep branch descriptions short, lowercase, and kebab-case, such as `feat/student-submissions`. Do not use personal agent names as branch prefixes.

Current scaffold checks:

```sh
node workflow/scripts/check-scaffold.mjs
openspec validate --all --strict
```

The application foundation uses Node.js 24 and pnpm 12.15.0. Run `pnpm install --frozen-lockfile`, `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test:unit`, and `pnpm build`. For production-boundary and development-preview browser checks, install Chromium with `pnpm exec playwright install chromium`, then run `pnpm test:e2e`. Local Supabase access tests use `pnpm db:start`, `pnpm db:reset`, and `pnpm db:test`; `db:reset` deletes the local database. Run `pnpm site:build` to verify the Docusaurus Pages site. These checks do not establish that the still-proposed authenticated product features are implemented.
