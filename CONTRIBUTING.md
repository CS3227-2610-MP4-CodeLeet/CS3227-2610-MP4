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

## Issue and pull request titles

Use the Conventional Commit format `<type>[optional scope]: <imperative summary>` for issue and pull request titles. Choose a type from the supported list above and keep it aligned with the branch and commits for the change.

Examples:

```text
feat(auth): add protected student sessions
fix: preserve profile settings after refresh
docs: standardize issue and pull request titles
```

In each pull request description, replace the template's `Closes #<issue-number>` placeholder with the matching issue number. GitHub automatically closes the issue when the pull request merges into this repository's default branch (`develop`).

## Quality Standards

All contributors, pull requests, and automated workflows must meet the following descriptors across all evaluated criteria:

| Category | Descriptor | Key Expectations |
| :--- | :--- | :--- |
| **GUI** | Good GUI. Significantly different from generic templates. | Custom styling, thoughtful layout, polished UI/UX that transcends standard component scaffolds. Responsive, accessible, and purpose-built for student and instructor programming workflows. |
| **Functionalities** | Noticeably more functionalities than expected, i.e., has gone the extra mile. | Rich feature set beyond minimal requirements: course-scoped workspaces, interactive test runners, revision comparison, forum search, leaderboard, autosaving, role diagnostics, and AI-assisted workflows. |
| **Bugs** | No bugs. | Zero regressions. Defensive edge-case handling across network errors, malformed payloads, role mismatches, and execution timeouts. Passing all automated checks. |
| **User Guide** | Covers all functionality. Easy to read. Very useful. | Comprehensive user documentation in `docs/UserGuide.md`, covering workflows for every role, clear walkthroughs, screenshots/diagrams, and verified current behavior. |
| **Developer Guide** | Covers all software engineering practices. Easy to read. Very useful. | Thorough developer documentation in `docs/DeveloperGuide.md`, documenting architecture, component diagrams, design patterns, testing strategy, and environment setup. |
| **Design** | Excellent design, good design principles and patterns followed, components properly separated with a clean flow of interactions, evidence of extensibility / maintainability, design decisions well-discussed. | Clean separation of concerns (SOLID, DRY), server/client boundaries, decoupled runner services, extensible schemas, and documented design trade-offs. |
| **Code Quality** | Very well-managed codebase. Clean, neat and readable. Clear sign of following good software engineering practices throughout the repo. Clear sign of following good coding convention and the design in the documentation. | Clean code, strict TypeScript types, SonarJS compliance, standard formatting, consistent naming conventions, and well-structured modules under `src/`. |
| **Tests and Error Handling** | Multi-level testing with a lot of test cases. Comprehensive error handling. | Unit tests (Vitest), integration/database tests (pgTAP/Supabase), end-to-end browser tests (Playwright), error boundaries, and explicit failure path assertions. |
| **AI Security in the App** | A comprehensive set of AI security features implemented and tested in the app. | Threat modeling, robust prompt injection defenses, server-side private rubrics and keys, untrusted input containment, and automated evaluation (e.g. Promptfoo). |
| **Deployment** | Proper separation of development and production environment well managed with automation. | Clear isolation between local dev, preview, and production environments; CI/CD pipeline automation; safe migration strategies and smoke tests. |
| **Reflections on Agentic SE** | Comprehensive reflection on agentic SE workflow, with strong evidence of Multi-Agent SE, Context Engineering and Resource-aware Use. Multiple examples for each topic shown and discussed in detail. | In-depth reflection documentation (`docs/Reflections.md`, `docs/JohnReflections.md`, `docs/PaulReflections.md`) backed by quantitative and empirical evidence from logs and experiments. |
| **Workflow-related Artefacts** | Very well-managed artefacts. Clean, neat, and readable. Strong sign of following good convention and design. | Traceable OpenSpec changes (proposals, specs, design, tasks), chronological session logs in `logs/`, handoffs, and verification records. |
| **Git Version Control Practices** | Excellent commit history, appropriately sized commits with meaningful messages, frequent and focused commits, clear descriptive messages, changes generally grouped into logical units of work, logical progression showing an iterative development process. | Strict Conventional Commits, cohesive commit units, traceable PR and issue links, and a clean, progressive branch history. |

Current scaffold checks:

```sh
node workflow/scripts/check-scaffold.mjs
openspec validate --all --strict
```

The application foundation uses Node.js 24 and pnpm 12.15.0. Run `pnpm install --frozen-lockfile`, `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test:unit`, and `pnpm build`. For production-boundary and development-preview browser checks, install Chromium with `pnpm exec playwright install chromium`, then run `pnpm test:e2e`. Local Supabase access tests use `pnpm db:start`, `pnpm db:reset`, and `pnpm db:test`; `db:reset` deletes the local database. Run `pnpm site:build` to verify the Docusaurus Pages site. These checks do not establish that the still-proposed authenticated product features are implemented.

The local database seed lives in `supabase/seed.sql` and is applied explicitly by `pnpm db:seed` (also included in `pnpm db:reset`). Automatic Supabase CLI seeding is disabled so local fixtures are not loaded by a linked/hosted reset. Update or add seed data whenever a schema change adds or alters tables, columns, constraints, relationships, or required fixture scenarios; keep it synthetic and usable with a fresh local database. Both commands rebuild the local database from migrations and seed data, deleting existing local database contents.
