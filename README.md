# CS3227-2610-MP4

A Coursemology-inspired programming assignment platform for students and instructors.

**Status: local Next.js foundation and an opt-in student assignment preview with synthetic data. Authenticated student/instructor features and deployment are not implemented yet.**

## Planned product

- Students enter, run, and submit single-file Python or Java programs, receive AI hints, and view published grades.
- Instructors create assignments and rubrics, review submissions, request AI grading suggestions, and approve grades for publication.
- Both roles have profiles and access to discussion threads. Students earn XP and appear on a leaderboard.
- Python execution and Java compilation/execution must happen entirely in the browser. Runtime selection is pending a compatibility and isolation experiment.
- No file uploads, badges, package installation, or server-side code execution.

## Technology direction

Initialized: Next.js App Router, React, TypeScript, Tailwind CSS, shadcn configuration, ESLint, Prettier, Vitest, Playwright and pnpm. Exact dependencies are recorded in package.json and pnpm-lock.yaml. Supabase Auth/PostgreSQL/RLS, Zod, SoCLaaS and Vercel integration remain future work. The product website will use GitHub Pages; Docusaurus is the intended documentation framework.

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
| `src/` | Current App Router shell/styles and shared utilities; future feature services/runtime adapters |
| `openspec/` | OpenSpec configuration, proposed changes, and accepted capability specifications |
| `workflow/` | Development policy, specialist roles, templates, and evidence |
| `docs/` | Required user guide, developer guide, and reflections |
| `logs/` | Development interaction summaries and verification status |
| `tests/` | Future unit, database, browser, and AI evaluation suites |
| `supabase/` | Future database migrations, policies, and synthetic seed data |
| `website/` | Static product website source for GitHub Pages |
| `.github/` | CI and contribution templates |

## Run locally

Use Node.js 24 and pnpm 12.15.0 (`npm install --global pnpm@12.15.0` if pnpm is missing), then:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open http://localhost:3000. The coming-soon page needs no credentials or environment variables. You can also run the pinned package manager without a global install: `npx --yes pnpm@12.15.0 dev` (replace dev with the desired pnpm arguments).

Run `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test:unit` and `pnpm build`. For browser checks, run `pnpm exec playwright install chromium`, build, then `pnpm test:e2e`. See [Developer Guide](docs/DeveloperGuide.md) for boundaries and shared-work handoff.

## Student assignment preview

Add `STUDENT_PREVIEW_ENABLED=true` to ignored `.env.local` and start/restart `pnpm dev`. Visit http://localhost:3000/student/assignments (use the port printed by Next.js). Browse the Python/Java sample assignments and open their instructions. Draft samples are hidden.

This is development-only synthetic data, not a login or database-backed flow. Production ignores the flag and denies these preview pages. Assignment details now include a plain-text code editor with the fixed language, a 32 KiB UTF-8 counter and local input checks. Submit code remains disabled: code is not saved, transmitted or executed. Local list state examples are `?preview=empty`, `?preview=slow` and `?preview=error`; error recovery returns to the normal list.

The [browser runtime feasibility experiment](workflow/evidence/runtime-feasibility/README.md) records real Python/Java probes and coordinated security/testing evidence. [Java buffered input works](workflow/evidence/runtime-feasibility/java-input-resolution.md) for the documented basic Scanner/BufferedReader subset. An additional opt-in local editor now supports Run code and synthetic published practice tests; follow the [User Guide](docs/UserGuide.md#browser-runs-and-published-practice-tests-additional-local-opt-in). Teacher publishing/storage, runtime provenance/distribution review and production runner verification remain incomplete.
