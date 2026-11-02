# CS3227-2610-MP4

A Coursemology-inspired programming assignment platform for students and instructors.

Status: authenticated student/instructor workflows, browser-only Python/Java practice, forums and instructor-configured XP are implemented with local synthetic verification. Leaderboard and complete hosted acceptance remain pending. See the [User Guide](docs/UserGuide.md) for current features and limits.

## Product scope

- Students enter, run, and submit single-file Python or Java programs, receive AI hints, and view published grades.
- Instructors create assignments and rubrics, review submissions, request AI grading suggestions, and approve grades for publication.
- Both roles have profiles and access to discussion threads. Students can view their own XP; leaderboard is planned separately.
- Python execution and Java source compilation/execution happen in the browser. Local and same-project runtime builds are available; hosted acceptance, browser coverage and distribution/provenance review remain separate gates.
- No file uploads, badges, package installation, or server-side code execution.

## Technology direction

Implemented with Next.js App Router, React, TypeScript, Tailwind CSS, shadcn configuration, ESLint, Prettier, Vitest, Playwright, Supabase Auth/PostgreSQL/RLS, Zod and pnpm. Exact dependencies are recorded in package.json and pnpm-lock.yaml. Local migrations/security tests and SoCLaaS integration are available. Hosted rollout/acceptance is tracked separately. The Docusaurus product site is configured for GitHub Pages; a verified public release is not established by local builds.

Technology choices were informed by MP3. Its implementation and project files have not been copied; this is a fresh MP4 scaffold.

## Start here

1. Read [project scope](workflow/ProjectBrief.md) and the [assignment checklist](workflow/AssignmentChecklist.md).
2. Review the [initial proposal](openspec/changes/build-programming-platform/proposal.md), [design](openspec/changes/build-programming-platform/design.md), and [tasks](openspec/changes/build-programming-platform/tasks.md).
3. Follow the [development workflow](workflow/AgentProcess.md). Product feature tasks remain unchecked; the shared app foundation is a separate setup milestone.
4. Run `node workflow/scripts/check-scaffold.mjs` for local scaffold checks.
5. With OpenSpec 1.8.0 available, run `openspec validate --all --strict`.

OpenSpec 1.8.0 generated project-local Codex skills under `.agents/skills/`. Restart the coding client to discover newly generated skills. Their installation does not prove that a multi-agent workflow has run.

## Repository layout

| Location | Purpose |
| --- | --- |
| `src/` | App Router shell, student preview, browser runner client, and separate local runtime lab |
| `openspec/` | OpenSpec configuration, proposed changes, and accepted capability specifications |
| `workflow/` | Development policy, specialist roles, templates, and evidence |
| `docs/` | Required user guide, developer guide, and reflections |
| `logs/` | Development interaction summaries and verification status |
| `tests/` | Unit and browser preview suites; database security tests live in `supabase/tests/` |
| `supabase/` | Fresh local configuration, profiles/trusted roles migration, and pgTAP access tests |
| `website/` | Docusaurus product site configured for GitHub Pages |
| `.github/` | CI and contribution templates |

## Run locally

Use Node.js 24.22.1 and pnpm 12.15.0 (`npm install --global pnpm@12.15.0` if pnpm is missing), then:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open http://localhost:3000. The coming-soon page needs no credentials or environment variables. You can also run the pinned package manager without a global install: `npx --yes pnpm@12.15.0 dev` (replace `dev` with the desired pnpm arguments). The exact Node patch is pinned in `.node-version`; use that file with your Node version manager.

Run `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test:unit` and `pnpm build`. For browser checks, run `pnpm exec playwright install chromium`, build, then `pnpm test:e2e`. See [Developer Guide](docs/DeveloperGuide.md) for boundaries and shared-work handoff.

For local database work, start Docker Desktop, run `pnpm db:start`, then `pnpm db:reset` and `pnpm db:test`. `pnpm db:reset` deletes and recreates the local database. The checked-in migration contains no real user data or hosted credentials. Supabase Auth is not yet connected to application routes.

## Student assignment preview

For UI tests only, set `PLAYWRIGHT_ASSIGNMENT_FIXTURES=true` in the test server environment and start/restart `pnpm dev`. Visit http://localhost:3000/student/assignments (use the port printed by Next.js). Browse the Python/Java sample assignments and open their instructions. Draft samples are hidden.

This is development-only synthetic data, not a login or database-backed flow. Production ignores the flag and denies these preview pages. Assignment details include a plain-text code editor with the fixed language, a 32 KiB UTF-8 counter and local input checks. Submit code remains disabled; code is not saved or submitted. The separate runner preview can execute code locally in the browser when enabled; follow the [runner setup and limitations](docs/UserGuide.md#browser-runs-and-published-practice-tests-additional-local-opt-in). Local list state examples are `?preview=empty`, `?preview=slow` and `?preview=error`; error recovery returns to the normal list.

The [browser runtime feasibility experiment](workflow/evidence/runtime-feasibility/README.md) records real Python/Java probes and coordinated security/testing evidence. [Java buffered input works](workflow/evidence/runtime-feasibility/java-input-resolution.md) for the documented basic Scanner/BufferedReader subset. Authenticated assignments support Run code and instructor-published practice tests without making browser results official grades or XP. Runtime provenance/distribution review, supported-browser coverage and complete hosted runner verification remain pending.
