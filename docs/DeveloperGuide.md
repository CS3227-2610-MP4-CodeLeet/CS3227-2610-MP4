# CodeLeet Developer Guide

This guide describes the CodeLeet implementation and documentation tooling. Product behavior was audited against develop `dfe5936` on 3 November 2026. It is a contributor reference, not proof of a production release. The [User Guide](UserGuide.md) describes user journeys; the [acceptance record](../workflow/evidence/2026-11-03-student-acceptance.md) distinguishes actual local tests, mocked AI, CI and unverified hosted checks. Course workspaces are separate pending work and are not part of this baseline.

## Student personal progress (issue #89)

`/student/progress` verifies the student role in its dynamic layout and page, then starts independent section reads concurrently using the session's existing RLS-protected Supabase client. `src/features/student-progress/` separates assignment counts/upcoming queries, recent activity queries, validated contracts, presentation and a pending retry control. The existing workspace links to My progress on desktop and mobile; Assignments stays the landing page.

Assignment totals use exact HEAD counts of visible published assignments. Own outstanding work uses an empty `submissions()` embed filtered to the verified student and `submissions=is.null` (a PostgREST anti-join). Submitted is total minus outstanding, with revisions counted per assignment; overdue is outstanding with due_at strictly before the captured server time. Independent count reads are not a transaction snapshot: inconsistent combinations fail closed with retry. Upcoming work uses due_at at or after the same time, ordered by deadline/ID and limited to five. No page-length-derived counts or assignment-source retrieval.

Recent submissions and published grades use timestamp/ID descending order and a five-row limit. Their projections omit source, feedback, criterion scores, private rubrics and peer identity. Hidden titles use the existing unavailable-title behavior. XP reuses the authoritative own-total RPC without writing awards. Section failures stay distinct from zero, and source-bearing destination links disable prefetch. Section retries refresh data; the route error fallback invokes Next.js 16's supplied boundary retry callback inside a pending transition. No new migration, dependency, key or environment flag.

Focused unit tests cover actual SDK request filters/projections, exact counts, deadline boundaries, validation/failures, safe rendering, parallel reads and real React boundary recovery. `tests/e2e/student-progress.spec.ts` uses local-only synthetic actors to check over 1,000 assignments, repeated revisions, withdrawal, late submissions, private grades, forged URL identity, access denial and mobile/theme/keyboard navigation. It skips without explicit local fixture credentials; a CI skip is not hosted acceptance. See the [approved design](../workflow/plans/2026-11-03-student-progress-design.md), [plan](../workflow/plans/2026-11-03-student-progress.md) and [summary](../logs/2026-11-03-student-progress.md) for actual checks and limitations. The anti-join follows [official PostgREST resource embedding guidance](https://docs.postgrest.org/en/stable/references/api/resource_embedding.html#null-filtering-on-embedded-resources).


## 1. Local setup

Use the exact Node.js 24 patch in [.node-version](../.node-version) and pnpm version in [package.json](../package.json): currently Node 24.22.1 and pnpm 12.15.0. Start Docker Desktop with its Linux engine before starting Supabase. From the repository root in Windows PowerShell:

```powershell
node --version
npx.cmd --yes pnpm@12.15.0 install --frozen-lockfile
npx.cmd --yes pnpm@12.15.0 db:start
npx.cmd --yes pnpm@12.15.0 exec supabase migration up --local
npx.cmd --yes pnpm@12.15.0 db:status
```

`npx.cmd` avoids PowerShell's blocked `.ps1` wrapper without changing execution policy. If pinned pnpm is installed directly, the equivalent `pnpm` commands work. Corepack is not required.

Create ignored `.env.local` from [.env.example](../.env.example) only if it does not already exist. Preserve existing settings. Copy the generated local configuration privately; do not paste status output, passwords or keys into commits, issues, logs or screenshots.

| Setting                                                | Purpose and exposure                                                                                                                                                          |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`                             | Browser-safe URL of the matching local or hosted Supabase project                                                                                                             |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`                 | Browser-safe key; ordinary requests use the signed-in session and RLS                                                                                                         |
| `APP_SITE_URL`                                         | This environment's application origin; normally `http://localhost:3000` locally                                                                                               |
| `SUPABASE_SECRET_KEY`                                  | Server-only metadata client for reviewed username normalization, login-attempt reservation and email resolution; local development may use the local stack's service-role key |
| `AUTH_RATE_LIMIT_SECRET`                               | Independent random server-only secret of at least 32 characters for login-identifier HMACs                                                                                    |
| `SOCLAAS_AI_ENABLED`                                   | Keep `false` unless an authorized SoCLaaS environment is configured                                                                                                           |
| `SOCLAAS_BASE_URL`, `SOCLAAS_API_KEY`, `SOCLAAS_MODEL` | Server-only product AI configuration; never prefix keys with `NEXT_PUBLIC_`                                                                                                   |
| `STUDENT_TEST_CASE_FIXTURES_ENABLED`                   | Optional development examples only; production ignores it and real published cases never depend on it                                                                         |

The username migration and both server-only login settings are required for current sign-in. Older notes saying the application never uses a privileged server client predate this narrow metadata exception. Normal assignment/profile/submission/grade operations still use the user's publishable-key session; the metadata client does not create sessions, assign roles or replace RLS.

Start the app:

```powershell
npx.cmd --yes pnpm@12.15.0 dev
```

Open the printed address, normally `http://localhost:3000`. The [development script](../workflow/scripts/dev.mjs) prepares pinned runtime assets and starts both Next.js and the loopback browser-runtime lab on `127.0.0.1:3130`. Do not start the lab separately. Restart Next.js after changing environment settings.

### Existing data, fixtures and account access

`supabase migration up --local` applies pending migrations without resetting data. Review all pending migrations rather than applying only one historical feature file. Hosted migrations are a separate operator-controlled rollout.

`pnpm db:seed` and `pnpm db:reset` are destructive: both recreate the local database, apply migrations and explicitly load synthetic fixtures. They are optional for a fresh disposable development database, not an upgrade or sign-in repair. Automatic CLI seed loading is disabled. See [database setup](../supabase/README.md) for synthetic account names and first-admin provisioning.

Seeded accounts have no preset passwords. Use Forgot password and local [Mailpit](http://localhost:54324) to choose one in the requesting browser. Public signup creates students only. A trusted operator provisions the first admin; the admin panel manages later roles and prevents removal of the last admin. Never accept roles from editable signup metadata.

### Troubleshooting

| Symptom                                    | Check                                                                                                                                                      |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Docker API pipe is missing                 | Start Docker Desktop and wait for its Linux engine before `db:start`                                                                                       |
| Port 54322/54324 is occupied               | Identify the existing container/service; reuse the intended stack or stop only the known conflicting project. Do not reset data to solve a port conflict   |
| Port 3130 is occupied                      | An existing lab/dev process may be running. Reuse it or stop the known process before restarting `pnpm dev`                                                |
| Sign-in is unavailable                     | Confirm matching URL/public key/server metadata key, a 32-character-or-longer HMAC secret, current migrations and correct application origin               |
| Reset link fails                           | Use the newest link in the requesting browser; verify Site URL, allowed callback URLs and local Mailpit or hosted mail delivery                            |
| Runtime asset build fails                  | Check the approved upstream response and network trust; preserve size/SHA-256 checks and pinned assets. Never bypass verification or add a remote compiler |
| Run code is unavailable under `pnpm start` | Bare local production startup has no Vercel environment marker; use development for ordinary local execution, as explained below                           |

## 2. Source organization and request flow

| Location                                                                  | Responsibility                                                                                          |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `src/app/`                                                                | Next.js pages, layouts, route handlers and loading/error boundaries                                     |
| `src/lib/auth/`, `src/lib/supabase/`                                      | Verified identity/trusted roles, request-scoped SSR/browser clients and isolated server metadata client |
| `src/lib/http/`, `src/lib/ai/`                                            | Bounded requests/safe responses and server-only SoCLaaS adapter                                         |
| `src/features/codementor/`                                                | Shared assignment/submission/grade contracts, forms and AI context/review services                      |
| `src/features/student-assignments/`, `src/features/student-submissions/`  | Student workspace, editor, revision/history/comparison, draft recovery and browser-runner integration   |
| `src/features/assignment-deadlines/`, `student-grades/`, `student-lists/` | Timing/status, published-grade views and shared filters/pagination                                      |
| `src/features/practice-test-authoring/`                                   | Instructor draft/public case management and student public-case loading                                 |
| `src/features/assignment-xp/`, `leaderboard/`                             | Server-controlled awards and narrowly projected ranking views                                           |
| `src/features/auth/`, `profile/`, `admin-users/`, `forums/`               | Account UX, private profile editing, guarded role management and discussions/search                     |
| `src/components/ui/`                                                      | Shared pending buttons and reviewed UI components                                                       |
| `src/runtime-lab/`                                                        | Browser supervisor/worker, Java compatibility support and local static server                           |
| `supabase/migrations/`, `supabase/tests/database/`                        | Forward schema/RLS/RPC migrations and transactional pgTAP assertions                                    |
| `tests/e2e/`, `tests/unit/`                                               | Browser journeys, synthetic fixtures and cross-cutting tests                                            |
| `website/`                                                                | Separate Docusaurus product website; not the application server                                         |

The `@/*` alias resolves into `src/`. A normal protected operation follows: verified Supabase server user/trusted role → strict route contract → projected session-scoped read or authorized RPC → RLS/database ownership/version checks → sanitized response. Client identity, roles, timestamps, grades and browser test results are never authority.

## 3. Authentication and shared UI

[Username sign-in](../workflow/plans/2026-11-03-username-sign-in-design.md) uses `POST /api/auth/sign-in`, same-origin bounded JSON, private/no-store responses and normal publishable-key SSR password authentication. Private service-only RPCs normalize identifiers, reserve login attempts and resolve usernames to current Auth emails without returning those emails publicly. Unknown usernames use a stateless dummy request that cannot create app cookies. Provider failures are classified consistently.

Profiles retain `display_name`, a reserved normalized `username_key` and nullable unique `login_username`. Database locking/uniqueness protects concurrent claims; client writes cannot set canonical fields. Legacy duplicates retain email access until explicit resolution. Counters store HMAC fingerprints with ten accepted attempts per normalized identifier/minute and sixty globally/minute; provider limits still apply. This is not complete DoS protection or a claim of perfect timing equivalence.

Server authorization uses verified `getUser` and protected roles. Successful login also stops stale browser-draft writers across tabs and refreshes the browser session before navigation; source-free notifications cannot authorize requests. Profile updates affect only the verified user's username. Role changes use guarded admin routes, not profile/signup fields.

Recovery uses Supabase PKCE through `/auth/callback?next=/reset-password`; arbitrary callback destinations are rejected. The new-password page verifies identity, validates confirmation and attempts global sign-out after a successful update. A failed sign-out is reported separately from a successful password update. Hosted SMTP, allowlisted callbacks and cross-service token behavior require separate verification.

`PendingButton` exposes a decorative spinner, disabled pending state and `aria-busy`. `FormSubmitButton` uses `useFormStatus` for Next Form searches/comparison. Account navigation uses React transitions; a notice appears after ten seconds. Errors restore retry controls without automatic mutation retries. The shared theme and password visibility controls remain immediate.

## 4. Student data and grading contracts

| Capability         | Current contract/boundary                                                                                                                                                                             |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Assignments        | Published metadata for students; owned authoring/private rubric access for instructors. Python or Java; language locks after a submission                                                             |
| Source submission  | One source string, 1–8,000 characters, no NUL, assignment UUID and request UUID. Language, student identity, revision and time derive from trusted assignment/session/database state                  |
| Revisions          | Immutable server saves; identical request retries return the original revision. Captured-source acknowledgment does not mark newer edits clean                                                        |
| Deadlines          | Optional finite instant; SGT authoring/display. `created_at > due_at_submission` is late; equality is on time. Deadline snapshots/retry timing stay immutable; no automatic late penalty              |
| Own history/grades | Session ownership plus RLS; metadata lists avoid source/private-rubric reads. Only published own grades appear. Unavailable assignment titles remain hidden                                           |
| Continue editing   | Owned, assignment/language-scoped saved source initializes a new editable draft; existing revisions are unchanged                                                                                     |
| Compare revisions  | At most two owned selected sources, safe text rendering and bounded line-diff work; no execution, write or AI request                                                                                 |
| Browser drafts     | Same-device local storage, 500-ms debounce, up to ten contexts/seven days, account/assignment/language/starting-revision separation, restore/discard/conflict controls and confirmed sign-out cleanup |
| Practice cases     | Up to five public stdin/expected-output cases; owner-only drafts and atomic versioned Save/Publish/Unpublish. Draft edits preserve the previous published set                                         |
| Grades/XP          | Explicit instructor publication of an authorized grade; AI/browser results cannot publish or award XP                                                                                                 |

Draft source is intentionally stored locally for recovery. It is not encrypted account storage or a boundary against another user of the same browser profile/same-origin script. Expiry, storage denial, eviction or closing before a completed write can prevent recovery. See [draft design/evidence](../workflow/evidence/2026-11-02-draft-autosave-review.md).

Student/instructor assignment APIs live under `/api/assignments`; submissions under `/api/submissions`; grade writes under `/api/grades/[id]`. Practice owner APIs use `/api/assignments/[id]/practice-tests`, student reads `/api/student/assignments/[assignmentId]/test-cases`. These are implemented; development examples are never a fallback for a failed real-case read. Contracts live with each feature; failures are sanitized and state-changing routes check origin and bounded inputs.

Instructors set maximum XP from 0–100,000. Awards use the best currently published score/rubric-maximum fraction per student/assignment, multiplied by the current maximum XP and rounded down. Correcting/withdrawing grades or editing maximum XP recalculates awards; a ledger records nonzero deltas without client write authority. Older grades without a captured rubric maximum require review/republishing. The signed-in leaderboard exposes usernames/totals/ranks, uses shared ranks (1, 1, 3) and lists positive-XP students only.

Deep implementation/evidence: [deadlines](../logs/2026-11-01-assignment-deadlines.md), [revision comparison](../logs/2026-11-01-compare-revisions.md), [practice tests](../logs/2026-11-02-published-practice-tests.md), [XP](../logs/2026-11-02-assignment-xp.md) and [leaderboard](../logs/2026-11-02-leaderboard.md).

## 5. Browser-only code execution

[Runner environment selection](../src/features/student-submissions/runner-environment.ts) enables the loopback lab in development and the same-project runtime for Vercel preview/production. A bare local production process enables neither automatically. Real accounts/assignments and local Run code do not require the removed student-preview/runner-preview flags. Synthetic assignment fixtures are restricted to the Playwright harness.

`pnpm build` first runs `workflow/scripts/build-static-runtime.mjs`, verifies pinned size/SHA-256 metadata and prepares ignored `public/runtime/`, then builds Next.js. Browsers verify the runtime manifest/assets before use. Generated distributions are not source to commit; distribution/license/provenance approval and deployed verification remain separate gates.

Python uses Pyodide; Java source is compiled/executed in the browser using the evaluated TeaVM-based runtime and first-party input compatibility support. Java is a documented subset, not a full JVM: basic Scanner/BufferedReader work in recorded checks, while Thread start/join/sleep examples have verified compiler limits. See [runtime evidence](../workflow/evidence/runtime-feasibility/README.md) and [Java input resolution](../workflow/evidence/runtime-feasibility/java-input-resolution.md).

An opaque sandboxed frame and trusted supervisor isolate untrusted workers from app credentials/DOM and enforce messaging/lifecycle limits. Limits include 4,096 UTF-8 input bytes, 8,192 retained combined output bytes per case, execution deadlines and separate preparation/Java compilation deadlines. Fresh workers isolate runs at a startup cost. There is no hard browser memory-quota or universal-browser guarantee. Next.js/Node never compiles or executes submitted source, and no remote execution fallback exists.

Practice tests compare printed stdout, normalizing line endings and one final newline while preserving other spaces/case. Results remain untrusted local feedback; no browser result is accepted as an official grade/XP award. Source edits/refreshed cases invalidate stale results, and leaving the workspace ends the run.

## 6. Product AI, security and resource accounting

Students request learning feedback; instructors request rubric-based advisory evaluations. Both use server-only SoCLaaS. Student context excludes private rubrics; instructor context requires assignment ownership. Assignment text, source, rubric descriptions and model output are untrusted data. Models have no tools or publication authority. Output is schema/criterion-validated before safe text presentation; malformed responses and outages produce sanitized errors.

The shared review service bounds context/output, checks requester-scoped cache entries, reserves usage before provider calls and records completion/failure. Cache/context versions matter when changing prompts or contracts. Usage distinguishes provider token counts from estimates; a cache hit, provider prompt caching and development-agent context reuse are different measurements. Instructor context comparison can consume two uncached request slots. Repository quotas do not replace verification of the actual key's SoCLaaS limits.

The [historical model comparison](../workflow/experiments/2026-11-01-soclaas-model-evaluation.md) records a bounded synthetic model-selection experiment; its results are separate from development-agent token/cost measurements. [Promptfoo evidence](../workflow/evidence/2026-11-02-promptfoo-ai-security.md) records the separate synthetic offline/live evaluation. `pnpm ai:promptfoo` runs deterministic offline fixtures; `pnpm ai:promptfoo:live` is an explicit provider-consuming operation and is not part of normal CI. The pinned wrapper/config disables sharing/telemetry/update behavior and bounds live requests; do not extend those claims to arbitrary configs. Historical sample passes do not establish general prompt-injection resistance or grading accuracy. No live evaluation is required to edit documentation.

## 7. Forums and roles

Forums currently provide shared member-only threads/replies and literal case-insensitive title/opening-post search; replies are not searched. Posts are React text, not executable HTML/Markdown. Author name/role are snapshots. Lists use stable created-time/ID ordering, 25 rows plus lookahead; offset pages can shift as posts arrive. Posting uses validated request IDs, origin checks, an atomic combined ten-post/minute quota and no direct client writes. There are no attachments, editing/deletion, AI publication or forum XP awards.

The guarded admin directory/role routes use protected role state and last-admin protection. Profile editing cannot change email/role. Admin unit/database checks exist; a complete authenticated admin browser journey remains pending in the recorded evidence. These controls are distinct from pending course membership work. See [forum implementation](../logs/2026-10-31-forums.md), [search](../logs/2026-11-01-forum-search.md) and the [security evidence map](../workflow/evidence/2026-11-02-security-testing.md).

## 8. Verification commands and evidence scope

Use pinned pnpm; on Windows replace `pnpm` with `npx.cmd --yes pnpm@12.15.0` if needed.

| Command                                            | Purpose                                                                                                                       |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck` | Formatting, maintainability and generated Next route/TypeScript checks                                                        |
| `pnpm test:unit:coverage`                          | Domain, schema, route/query, UI and workflow regressions with configured coverage thresholds                                  |
| `pnpm db:test`                                     | Local pgTAP authorization, publication, retry, quota, uniqueness and concurrency-related assertions; requires the local stack |
| `pnpm build`                                       | Verified runtime distribution plus production Next build                                                                      |
| `pnpm exec playwright install chromium`            | Install the matching local browser once                                                                                       |
| `pnpm test:e2e`                                    | Production server on 3100 and fixture dev server on 3101, one browser worker; build first and leave those ports free          |
| `pnpm ai:promptfoo`                                | Offline synthetic AI assertion/configuration check; no live model calls                                                       |
| `pnpm site:build`                                  | Separate product website build                                                                                                |
| `pnpm spec:validate`, `pnpm check:scaffold`        | Strict OpenSpec and required-artifact/local-Markdown-link checks                                                              |

Authenticated browser fixtures require local public Supabase settings and test-process-only `MP4_E2E_SERVICE_ROLE_KEY`. Match their local-service guards; do not use hosted production accounts. `RUN_AUTHENTICATED_RUNTIME_TESTS=1` enables real Python/Java execution in those journeys against a development or preview-configured app. Standalone runtime and local-email suites have separate opt-ins. The username quota case also needs the same HMAC secret as the local app, supplied privately to the test process. Inspect [Playwright configuration](../playwright.config.ts) and suite guards before running opt-ins; missing prerequisites are skips, not passing coverage.

Never put the test admin key in `NEXT_PUBLIC_` settings or application configuration. Test helpers create/delete only known synthetic fixture IDs. Traces can contain sensitive session data: keep generated artifacts ignored and share sanitized summaries only. Mocked AI/browser tests establish deterministic app guards, not real-provider resistance or hosted email behavior.

Application CI runs frozen installation, format/lint/types/unit/coverage, offline AI checks, app/site builds and Chromium. Its official Playwright image matches the pinned test package, avoiding recurring apt installation. A separate database job starts local Supabase and runs pgTAP; scaffold and CodeQL checks complement these. Do not replace a recorded failure with a passing total from another commit. The [3 November acceptance record](../workflow/evidence/2026-11-03-student-acceptance.md) preserves broad-run failures, focused reruns and prerequisite skips with their actual scope.

## 9. SDD, development agents and records

Follow [AGENTS.md](../AGENTS.md) and [AgentProcess](../workflow/AgentProcess.md): link a matching issue before implementation, use a Conventional Commit branch from updated develop, read the relevant OpenSpec change, record decisions/verification, then publish a linked PR after branch CI and confirm final-head checks. Keep unrelated user edits intact. Human review, merge and release are separate steps.

| Artifact                                                              | Purpose                                                                                                      |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `workflow/ProjectBrief.md`, `workflow/AssignmentChecklist.md`         | Scope, assignment constraints, responsibility and submission/evidence requirements                           |
| `openspec/config.yaml`, `openspec/changes/`, `openspec/specs/`        | Project context, active proposals/design/spec/tasks and accepted specifications                              |
| `.agents/skills/`, `skills-lock.json`                                 | Discoverable repository skills and recorded external provenance                                              |
| `workflow/AgentProcess.md`, `workflow/agents/`, `workflow/templates/` | Coordination policy, planned role briefs and bounded handoff/review/experiment formats                       |
| `workflow/plans/`, `workflow/contracts/`                              | Per-change plans and shared interfaces; planned work is not current product behavior                         |
| `workflow/evidence/`, `workflow/experiments/`                         | Actual reviews/test results and bounded experiments with limitations                                         |
| `workflow/scripts/`, `.github/workflows/`                             | Verification/evaluation/runtime tooling and repository automation                                            |
| `logs/`                                                               | Sanitized chronological request/decision/failure/check summaries; human verification status remains explicit |
| `docs/Reflections.md`, individual reflection files                    | Index and member-owned MP4 reflections awaiting personal verification where stated                           |

Delegate only when authorized and useful. Give specialists narrow context, allowed files, budgets and a next-owner handoff. The [runtime coordination record](../workflow/evidence/runtime-feasibility/coordination.md) and [username review](../workflow/evidence/2026-11-03-username-sign-in-review.md) record actual separate executions. Role files alone are not evidence that agents ran. Product AI and development-agent coordination are separate systems. No unavailable token/cache/cost measurements or efficiency gains should be invented.

## 10. Deployment and release checks

Keep development/preview and production Supabase data, credentials, origins and AI resources separate. `develop` is integration; `master` is the grading/release branch. A localhost Supabase URL cannot serve hosted Vercel users. Configure matching public settings and server-only login/AI secrets per environment, apply reviewed migrations, configure Auth Site URL/allowed callbacks and mail delivery, then deploy through team-controlled automation. Build public environment values into the matching deployment.

The product website has an overview, on-site User Guide and Developer Guide, top navigation, a sidebar and on-page contents. `workflow/scripts/prepare-site-docs.mjs` generates the two website guide pages from the canonical files in `docs/` before website development/build. Edit the canonical files; generated copies are ignored. Relative references outside those guides become GitHub repository links. Restart `pnpm site:dev` after editing canonical guide content to regenerate it; normal builds always regenerate both pages.

[.github/workflows/pages.yml](../.github/workflows/pages.yml) builds/uploads `website/build` and publishes on relevant pushes to `develop`, or manual dispatch from `develop`, matching the existing github-pages environment branch restriction. Pull requests run build checks without publishing; merge into develop is a separate human decision. A successful local build is not publication: verify the Pages deployment and live URLs afterward. No dedicated GitHub Actions Vercel deployment workflow exists in this baseline; repository Vercel checks/builds must not be described as completed team-managed Actions deployment automation.

Before release, record the deployed commit/address, migration/configuration state, development/production separation, both role journeys, password email flow, actual Python/Java runs, published cases, privacy denials and live-AI/provider-limit checks. Keep licensing/provenance and browser compatibility limits visible. Use [AssignmentChecklist](../workflow/AssignmentChecklist.md) and the [security evidence map](../workflow/evidence/2026-11-02-security-testing.md). A green PR or preview build is not full production acceptance. Do not seed/reset hosted data or expose production secrets to untrusted PR jobs.

## 11. Acknowledgements

- [Coursemology's public guide](https://coursemology.github.io/coursemology-help/) and user-provided screenshots informed assignment/grading/discussion journeys and problem-above-editor presentation. No course identity/content/assets or implementation were copied.
- The user-provided brainstorming PDF informed feature/security ideas; explicit user requirements determine browser-only execution and current scope.
- [Next.js](https://nextjs.org/), React, Tailwind, shadcn/ui, Lucide, Zod, Supabase, Vitest, Playwright and Docusaurus provide the pinned application/tooling dependencies. Consult the lockfile and package notices for exact versions/licenses.
- [prism-react-renderer](https://github.com/FormidableLabs/prism-react-renderer) 2.4.1 and [Prism](https://prismjs.com/) 1.30.0 (MIT) provide syntax grammars/themes; editor synchronization and indentation are first-party code.
- [OpenSpec](https://github.com/Fission-AI/OpenSpec) provides SDD tooling; the current dependency is pinned in package.json rather than an early scaffold version. Preserve generated attribution and [skill provenance](../skills-lock.json).
- Runtime source/assets are identified by hashes and notices in [runtime evidence](../workflow/evidence/runtime-feasibility/README.md); distribution/provenance/license review remains a release gate. Do not commit generated runtime binaries without approval of that review.
- Promptfoo and its repository patch/provenance are documented in the [AI evaluation evidence](../workflow/evidence/2026-11-02-promptfoo-ai-security.md).
- Codex assisted with planning, code, tests, reviews and documentation as recorded in logs. Each member must verify personal contribution claims and reflection wording; generated drafts and passing checks do not establish that verification.
