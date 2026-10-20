# Developer Guide

Status: scaffold only. The architecture below is proposed; application dependencies, infrastructure, and deployment are not configured.

## Technology and setup

Use Node.js 24 and pnpm for the planned Next.js/TypeScript application. Select and lock supported package versions during bootstrap. No `package.json`, app start command, or runtime adapter exists yet.

OpenSpec was initialized using CLI 1.8.0 with Codex core integration. Current checks:

```sh
node workflow/scripts/check-scaffold.mjs
openspec validate --all --strict
```

Copy `.env.example` to ignored `.env.local` when application configuration is implemented. Fill values from the appropriate development environment; leave AI disabled until provider limits and security checks are verified.

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
- Codex assisted with source review, scope synthesis, and generation of this scaffold. Team members must review these files and update this declaration with actual later use before submission.
- Runtime/library acknowledgements and licenses: pending selection. Record them before distributing any runtime assets.
