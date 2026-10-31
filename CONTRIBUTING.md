# Contributing

1. Find or create a GitHub issue for the change. Reuse an open issue only when its scope matches; include acceptance criteria and security/validation concerns.
2. Apply one or more relevant existing repository labels to every issue and PR created. Choose labels that describe the work type or area; coordinate before creating a new label when none fits.
3. Select or create the active OpenSpec change from that issue. Keep the issue, OpenSpec artifacts, branch, log summary and PR cross-linked; update proposal/spec/design/tasks when scope or decisions change.
4. Apply the relevant repository-local Superpowers skills throughout planning, TDD implementation, debugging, verification, review and closeout. Use the authorized implementation method; a role catalog is not blanket permission to delegate.
5. Create a branch from `develop`, the integration branch. Branch names use `<type>/<short-kebab-case-description>` and the type must match the corresponding Conventional Commit type, for example `feat/student-submissions` or `fix/profile-rls`.
6. Implement the smallest complete change. Commit related, verified chunks incrementally, stage only files for that change, and preserve unrelated edits. Use `workflow/templates/Handoff.md` when delegation is authorized.
7. Run applicable checks, attach actual evidence, update guides only with verified behavior, and maintain a dated `logs/` summary for the change using `logs/SessionTemplate.md`. Summarize each prompt/interaction chronologically, including steering and decisions, without saving raw transcripts, secrets, credentials, real student data or sensitive prompt text. AI-generated summaries remain marked `Human verification: pending` until reviewed.
8. Once implementation and checks are complete, finalize the log summary, push the branch and create/update a PR against `develop` using the repository template. Link the issue, OpenSpec change, log and actual check results. Merge and promote tested releases to `master` only through human review and a separate PR.

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

The local database seed lives in `supabase/seed.sql` and is applied explicitly by `pnpm db:seed` (also included in `pnpm db:reset`). Automatic Supabase CLI seeding is disabled so local fixtures are not loaded by a linked/hosted reset. Update or add seed data whenever a schema change adds or alters tables, columns, constraints, relationships, or required fixture scenarios; keep it synthetic and usable with a fresh local database. Both commands rebuild the local database from migrations and seed data, deleting existing local database contents.
