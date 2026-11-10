# CS3227-2610-MP4

CodeLeet is an AI assisted learning management platform for programming courses.

This source was reconciled on 10 November 2026 against merged `develop` commit `66c6d62`. Authenticated accounts, course workspaces, assignments, browser-only Python/Java runs, practice tests, AI assistance, discussions, XP/leaderboards and personal progress are implemented. [PR #133](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/pull/133) merged the routing, authenticated-browser-CI and AI authorization audit; its [dated session log](logs/2026-11-09-project-release-audit.md) records the local investigation and historical checks. Hosted acceptance, provider limits, final `master` release and human contribution sign-off remain separate gates.

## Features and boundaries

- Students write and run single-file Python/Java solutions, save immutable revisions, compare revisions, recover browser drafts and view deadlines, published grades and progress.
- Instructors create assignments/private rubrics and practice cases, review submissions, request AI suggestions and explicitly publish grades.
- Signed-in users enter **Courses**. Each course has its own memberships, enabled features, assignments, discussions, XP and leaderboard.
- Both roles receive distinct server-side SoCLaaS assistance. Student context excludes private rubrics; models cannot publish grades or award XP.
- Python execution and Java compilation/execution happen in an isolated browser runner. Browser results never establish official grades or XP.
- No uploads, badges, arbitrary dependency installation or server-side execution of submitted code. MP4 was built fresh.

## Guides and website

- [User Guide](docs/UserGuide.md): account access and current user journeys.
- [Developer Guide](docs/DeveloperGuide.md): setup, architecture, security, testing and deployment boundaries.
- [Reflection index](docs/Reflections.md): separate individual reflections and evidence-review states.
- [Product website](https://cs3227-2610-mp4-codeleet.github.io/CS3227-2610-MP4/), [online User Guide](https://cs3227-2610-mp4-codeleet.github.io/CS3227-2610-MP4/docs/UserGuide) and [online Developer Guide](https://cs3227-2610-mp4-codeleet.github.io/CS3227-2610-MP4/docs/DeveloperGuide): published through GitHub Pages. All three URLs responded HTTP 200 on 5 November. Availability is not proof of current production application acceptance.

## Run locally

Use the exact Node.js 24 patch in [.node-version](.node-version) and pnpm version in [package.json](package.json), currently 24.22.1 and 12.15.0. Start Docker Desktop's Linux engine. In Windows PowerShell:

```powershell
npx.cmd --yes pnpm@12.15.0 install --frozen-lockfile
npx.cmd --yes pnpm@12.15.0 db:start
npx.cmd --yes pnpm@12.15.0 exec supabase migration up --local
```

Create ignored `.env.local` from [.env.example](.env.example) only if absent. Preserve existing values. Configure the matching Supabase URL/publishable key, server-only `SUPABASE_SECRET_KEY`, server-only `AUTH_RATE_LIMIT_SECRET` and `APP_SITE_URL` according to the [Developer Guide](docs/DeveloperGuide.md#1-local-setup). Keep secrets private. AI can stay disabled for ordinary account and assignment testing.

```powershell
npx.cmd --yes pnpm@12.15.0 dev
```

Open the printed address, normally http://localhost:3000. Authentication is connected to the application. Signing in opens **Courses**. The dev command prepares pinned runtime assets and starts the loopback runner automatically; do not start port 3130 separately. `npx.cmd` avoids PowerShell script-wrapper restrictions without changing execution policy. Installed pinned `pnpm` supports the same commands directly.

`pnpm db:seed` and `pnpm db:reset` are optional destructive rebuilds of a disposable local database, not an ordinary upgrade or sign-in repair. See [database setup](supabase/README.md). Never reset hosted data as part of local setup.

## Verification and development

Run `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test:unit`, `pnpm db:test`, `pnpm build` and `pnpm site:build` as applicable. Browser setup and opt-in real-runtime/synthetic account prerequisites are documented in the Developer Guide. Use `pnpm exec openspec validate --all --strict` and `node workflow/scripts/check-scaffold.mjs` for specs and local links. A skipped test is not acceptance evidence.

Read [ProjectBrief](workflow/ProjectBrief.md), [AgentProcess](workflow/AgentProcess.md), [AssignmentChecklist](workflow/AssignmentChecklist.md) and the [active OpenSpec tasks](openspec/changes/build-programming-platform/tasks.md) before changing behavior. Skills under `.agents/skills/` are procedures; actual agent executions need their own records. Normal local use uses real accounts and data, while synthetic previews are selected only by the test harness.

## Remaining release gates

Verify the deployed commit, development/production separation, both role journeys, password emails, actual provider-key limits, supported browsers and production runner behavior. [Issue #31](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/31) retains runner acceptance work. Human reflection/log approval and final tested `master` remain separate. Green CI, a preview deployment or a public documentation site does not establish complete production acceptance.

## Repository layout

| Location | Purpose |
| --- | --- |
| `src/` | Authenticated app, course services, browser runner and local runtime lab |
| `tests/`, `supabase/tests/` | Browser journeys and database assertions; unit tests are colocated with source |
| `supabase/` | Local configuration, additive migrations and synthetic seed |
| `openspec/` | Active requirements, designs, tasks and accepted specifications |
| `workflow/`, `.agents/skills/` | Process, plans, evidence, tooling and discoverable skills |
| `docs/`, `logs/` | Canonical guides, individual reflections and dated interaction summaries |
| `website/`, `.github/` | Docusaurus documentation site and repository automation |
