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

Application lint, types, build, database tests, browser tests, and deployment checks will be added with the application tooling. No application test suite exists yet.
