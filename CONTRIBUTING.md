# Contributing

1. Find or create a GitHub issue for the change. Reuse an open issue only when its scope matches; include acceptance criteria and security/validation concerns.
2. Select or create the active OpenSpec change from that issue. Keep the issue, OpenSpec artifacts, branch, log summary and PR cross-linked; update proposal/spec/design/tasks when scope or decisions change.
3. Apply the relevant repository-local Superpowers skills throughout planning, TDD implementation, debugging, verification, review and closeout. Use the authorized implementation method; a role catalog is not blanket permission to delegate.
4. Create a branch from `develop`, the integration branch. Branch names use `<type>/<short-kebab-case-description>` and the type must match the corresponding Conventional Commit type, for example `feat/student-submissions` or `fix/profile-rls`.
5. Implement the smallest complete change. Commit related, verified chunks incrementally, stage only files for that change, and preserve unrelated edits. Use `workflow/templates/Handoff.md` when delegation is authorized.
6. Run applicable checks, attach actual evidence, update guides only with verified behavior, and maintain a dated `logs/` summary for the change using `logs/SessionTemplate.md`. Summarize each prompt/interaction chronologically, including steering and decisions, without saving raw transcripts, secrets, credentials, real student data or sensitive prompt text. AI-generated summaries remain marked `Human verification: pending` until reviewed.
7. Once implementation and checks are complete, finalize the log summary, push the branch and create/update a PR against `develop` using the repository template. Link the issue, OpenSpec change, log and actual check results. Merge and promote tested releases to `master` only through human review and a separate PR.

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

## Keep local seed data compatible

When changing database schemas, auth identities, language values or grading contracts, update `supabase/seed.sql` and the local seed checks in the same PR. Preserve stable fixture UUIDs and keep all accounts/data synthetic. Run `pnpm db:seed`, `pnpm db:test` and `node tests/integration/local-seed.mjs`. The seed command is additive and rotates only seed-account passwords; `pnpm db:reset` destroys the whole local database. See [local setup and accounts](supabase/README.md). Never include local seeds in hosted deployment inputs.
