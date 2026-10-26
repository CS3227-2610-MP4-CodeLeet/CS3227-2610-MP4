# Developer Guide

Status: Next.js app foundation initialized. The coming-soon page runs locally; feature services, authentication, database, AI, browser runtimes and deployment are not configured. The architecture below remains proposed beyond this foundation.

## Technology and setup

Use Node.js 24 and pnpm 12.15.0, pinned in package.json. Install pnpm with `npm install --global pnpm@12.15.0`, or prefix commands with `npx --yes pnpm@12.15.0`. Run `pnpm install --frozen-lockfile`, then `pnpm dev` and open http://localhost:3000. The home page uses local system fonts and needs no Supabase/SoCLaaS keys.

Application source is in src/app; shared utilities in src/lib; future shadcn components in src/components/ui. The @/* import alias points to src/*. components.json and CSS tokens configure shadcn; add reviewed components as needed with `pnpm exec shadcn add <component>`. Nothing was copied from MP3. Dependencies are exact-pinned and the pnpm lockfile is committed as a reproducibility artifact when this work is committed. The workspace permits native build scripts only for Tailwind oxide, esbuild and sharp; review any additional build-script request before expanding that list.

Shared commands:

| Command | Current purpose |
| --- | --- |
| pnpm dev | Next.js local development server |
| pnpm build / pnpm start | Production build / local production server |
| pnpm lint | ESLint for app, tests and configuration |
| pnpm format:check / pnpm format | Check/write formatting for owned code/configuration |
| pnpm typecheck | Generate route types and run strict TypeScript |
| pnpm test:unit | Vitest configured for future unit tests; no tests yet, explicit passWithNoTests |
| pnpm test:e2e | Chromium smoke test against a local production build on port 3100 |
| pnpm check:scaffold / pnpm spec:validate | Artifact/Markdown links and strict OpenSpec checks |

Build before running browser tests. Install Chromium once using `pnpm exec playwright install chromium` (CI uses --with-deps). The browser test checks the home response, document/heading, built styles, assets and browser errors; it does not prove student functionality. Application CI installs the frozen lockfile and runs formatting/lint/types/unit-runner/build/Chromium checks. Database checks remain pending teammate-owned schema/auth work; task 2.3 is not fully complete.

Prettier intentionally excludes existing planning/docs, generated skills, generated Next types and the lockfile; use scoped formatting for those documents when appropriate. Do not reformat generated OpenSpec skills or unrelated teammate files as part of a feature. No automated deployment is introduced by application CI.

OpenSpec was initialized using CLI 1.8.0 with Codex core integration. Current checks:

```sh
node workflow/scripts/check-scaffold.mjs
openspec validate --all --strict
```

Copy `.env.example` to ignored `.env.local` when integrating shared services. Fill values from the appropriate development environment; leave AI disabled until provider limits and security checks are verified. No app code reads these credentials yet.

## Proposed design

Next.js provides the UI and authenticated server routes. Supabase Auth supplies identity; PostgreSQL and RLS enforce access. Shared services separate assignment/submission persistence, grading, XP, AI context construction, quotas/cache, and usage metadata.

The browser runner accepts source and stdin through a minimal validated bridge. Python execution and Java source compilation/execution stay on the client. Use a credential-free isolated execution origin and workers where feasible. Decide CSP, frame isolation, cross-origin headers, dependency loading, cancellation, and supported browsers through a measured feasibility experiment. Do not promise OS-style memory/process quotas in browsers without evidence.

The server stores submissions independently of practice-run results. Grade publication authorizes XP updates atomically; reruns, AI requests, and repeated publication must not create extra awards.

The AI gateway queries authorized fields, constructs role-specific bounded context, checks a scoped response cache, reserves quotas atomically, invokes SoCLaaS, validates structured output, and records sanitized usage metadata. Instructor-only rubric/grade data lives in protected tables, rather than columns exposed by student-readable queries. AI has no database tools or publication authority.

## Data and API contracts

To be designed before implementation: profiles/immutable roles, assignments/public criteria, private rubrics, immutable submission revisions, draft/published grades, discussion threads/replies, XP awards, AI cache, quota reservations, and usage records. Define ownership, foreign keys, unique constraints, RLS policies, lifecycle/versioning, and race behavior in the capability design.

## Workflow artifact catalog

| Location | Purpose |
| --- | --- |
| `AGENTS.md` | Short repository entry instructions |
| `openspec/config.yaml` | Project context and artifact rules |
| `openspec/changes/` | Proposed requirements, design, and unchecked implementation tasks |
| `openspec/specs/` | Accepted specs after changes are implemented and archived |
| `.agents/skills/openspec-*/` | CLI-generated Codex workflow integrations |
| `workflow/ProjectBrief.md` | Scope, sources, constraints, ownership assumptions |
| `workflow/AssignmentChecklist.md` | Grading/submission requirements and evidence map |
| `workflow/AgentProcess.md`, `workflow/agents/` | Coordination policy and specialist task briefs |
| `workflow/templates/` | Handoff, security, runtime, and experiment templates |
| `workflow/evidence/` | Future actual task/review/experiment records |
| `workflow/scripts/check-scaffold.mjs` | Required artifact and local Markdown link checks |
| `logs/` | Interaction summaries and human verification status |
| `.github/` | Contribution templates and scaffold CI |

OpenSpec and tool skills remain at their conventional discovery paths; other process artifacts are consolidated in `workflow/` as requested by the assignment. Specialist roles have not been installed as executable custom-agent profiles.

## Test strategy

Add Vitest for domain/context/schema logic; PostgreSQL/RLS tests for access and concurrent grade/XP/quota operations; Playwright for role journeys and real browser runtime behavior; mocked AI tests for deterministic guards; and bounded real SoCLaaS evaluations for prompt-injection/quality evidence. Mocked model output alone does not demonstrate model resistance to attacks.

## Deployment and environments

Plan separate development and production Supabase projects/credentials, corresponding Vercel environments, and team-controlled GitHub Actions automation. `master` is release/grading; `develop` is the planned integration branch. Do not expose production secrets to untrusted PR jobs. Review migrations and keep rollback/recovery steps before release. The product website is deployed separately to GitHub Pages. Nothing has been deployed by this scaffold.

## Acknowledgements and AI use

- Coursemology's [public guide](https://coursemology.github.io/coursemology-help/) informed assignment, grading, feedback, and discussion journeys. No guide text or code was copied.
- The team's [MP3 repository](https://github.com/CS3227-2610-MP3-ConnectTalent/CS3227-2610-MP3) informed technology selection only. MP4 implementation and configuration are written fresh.
- The user-provided `Brainstorm AI App Ideas.pdf` informed two role-specific AI features and security/resource experiment ideas. Its no-execution recommendation was superseded by the user's browser-runner requirement.
- [OpenSpec](https://github.com/Fission-AI/OpenSpec), CLI 1.8.0, generated the `.agents/skills/` integrations. Preserve generated attribution/license references.
- The fresh bootstrap follows official [Next.js installation](https://nextjs.org/docs/app/getting-started/installation), [Tailwind PostCSS integration](https://tailwindcss.com/docs/installation/framework-guides/nextjs), and [shadcn manual setup](https://ui.shadcn.com/docs/installation/manual) conventions. No previous MP configuration was copied.
- Codex assisted with source review, scope synthesis, and generation of this scaffold. Team members must review these files and update this declaration with actual later use before submission.
- Runtime/library acknowledgements and licenses: pending selection. Record them before distributing any runtime assets.
