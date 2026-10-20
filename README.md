# CS3227-2610-MP4

A Coursemology-inspired programming assignment platform for students and instructors.

**Status: planning scaffold. No application features or deployment are implemented yet.**

## Planned product

- Students enter, run, and submit single-file Python or Java programs, receive AI hints, and view published grades.
- Instructors create assignments and rubrics, review submissions, request AI grading suggestions, and approve grades for publication.
- Both roles have profiles and access to discussion threads. Students earn XP and appear on a leaderboard.
- Python execution and Java compilation/execution must happen entirely in the browser. Runtime selection is pending a compatibility and isolation experiment.
- No file uploads, badges, package installation, or server-side code execution.

## Technology direction

Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui, Supabase Auth/PostgreSQL/RLS, Zod, SoCLaaS, Vitest, Playwright, pnpm, GitHub Actions, and Vercel. The product website will use GitHub Pages; Docusaurus is the intended documentation framework. Exact application dependency versions will be selected and locked during implementation.

Technology choices were informed by MP3. Its implementation and project files have not been copied; this is a fresh MP4 scaffold.

## Start here

1. Read [project scope](workflow/ProjectBrief.md) and the [assignment checklist](workflow/AssignmentChecklist.md).
2. Review the [initial proposal](openspec/changes/build-programming-platform/proposal.md), [design](openspec/changes/build-programming-platform/design.md), and [tasks](openspec/changes/build-programming-platform/tasks.md).
3. Follow the [development workflow](workflow/AgentProcess.md). All proposed features remain unimplemented until evidence is recorded.
4. Run `node workflow/scripts/check-scaffold.mjs` for local scaffold checks.
5. With OpenSpec 1.8.0 available, run `openspec validate --all --strict`.

OpenSpec 1.8.0 generated project-local Codex skills under `.agents/skills/`. Restart the coding client to discover newly generated skills. Their installation does not prove that a multi-agent workflow has run.

## Repository layout

| Location | Purpose |
| --- | --- |
| `src/` | Future application source and browser runtime adapters |
| `openspec/` | OpenSpec configuration, proposed changes, and accepted capability specifications |
| `workflow/` | Development policy, specialist roles, templates, and evidence |
| `docs/` | Required user guide, developer guide, and reflections |
| `logs/` | Development interaction summaries and verification status |
| `tests/` | Future unit, database, browser, and AI evaluation suites |
| `supabase/` | Future database migrations, policies, and synthetic seed data |
| `website/` | Static product website source for GitHub Pages |
| `.github/` | CI and contribution templates |

No application installation or start commands exist yet. See [Developer Guide](docs/DeveloperGuide.md) for implementation and deployment prerequisites.
