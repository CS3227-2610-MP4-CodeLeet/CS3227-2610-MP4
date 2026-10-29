# Developer Guide

Status: CodeLeet student/instructor MVP routes, assignment/submission/grade flows, SoCLaaS integration, context comparison, usage views, and additive Supabase RLS/RPC migrations are implemented. Local schema and security tests are available. Hosted Supabase/Vercel setup and live SoCLaaS verification remain external gates.

## Technology and setup

Use Node.js 24.22.1 from `.node-version` and pnpm 12.15.0 from `package.json`. Install pnpm directly with `npm install --global pnpm@12.15.0`, or prefix commands with `npx --yes pnpm@12.15.0`. Corepack is not required. Run `pnpm install --frozen-lockfile`, then `pnpm dev` and open http://localhost:3000. The home page uses local system fonts and needs no Supabase/SoCLaaS keys.

Application source is in src/app; shared utilities in src/lib; future shadcn components in src/components/ui. The @/* import alias points to src/*. components.json and CSS tokens configure shadcn; add reviewed components as needed with `pnpm exec shadcn add <component>`. Nothing was copied from MP3. Dependencies are exact-pinned and the pnpm lockfile is committed as a reproducibility artifact when this work is committed. The workspace permits native build scripts only for Tailwind oxide, esbuild and sharp; review any additional build-script request before expanding that list.

Shared commands:

| Command | Current purpose |
| --- | --- |
| pnpm dev | Next.js local development server |
| pnpm build / pnpm start | Production build / local production server |
| pnpm lint | ESLint for app, tests and configuration |
| pnpm format:check / pnpm format | Check/write formatting for owned code/configuration |
| pnpm typecheck | Generate route types and run strict TypeScript |
| pnpm test:unit | Auth identity, request/response boundaries, CodeLeet schemas/context, and browser-practice domain tests |
| pnpm test:e2e | Local Supabase role journeys, production auth/preview boundary checks on port 3100, and isolated dev-preview journeys on port 3101 |
| pnpm db:start / pnpm db:stop | Start/stop the repository-pinned local Supabase stack; requires Docker Desktop |
| pnpm db:reset | Destructively recreate the local database and apply checked-in migrations |
| pnpm db:test | Run pgTAP access-control tests against the local database |
| pnpm db:status | Show local Supabase endpoints and generated development credentials |
| pnpm site:build | Build the Docusaurus site for GitHub Pages |
| pnpm check:scaffold / pnpm spec:validate | Artifact/Markdown links and strict OpenSpec checks |

Build before running browser tests. Install Chromium locally once using `pnpm exec playwright install chromium`. CI uses the official Playwright v1.64.1-noble container with browsers/OS libraries already installed, avoiding apt mirror stalls. Keep that image version aligned with @playwright/test when updating dependencies. actions/setup-node selects the exact Node patch from `.node-version`; application CI also verifies the Node 24 major version. Browser checks have a five-minute step timeout and failed traces are retained for seven days. See the [official Playwright image documentation](https://playwright.dev/docs/docker).

The default browser suite was verified locally with 18 passing tests and four opt-in browser-runtime tests skipped because runtime assets were not enabled. It covers the authenticated student/instructor journey against local Supabase with mocked AI, the production auth/preview boundary, and local sample navigation/layout behavior. The suite runs one browser worker to avoid concurrent compilation/asset startup contention. The authenticated journey verifies a two-criterion rubric, two immutable revisions, AI feedback/review and explicit grade publication. Application CI installs the frozen lockfile and runs formatting/lint/types/unit/build/Chromium checks; a separate database job starts local Supabase and runs pgTAP. Live SoCLaaS, hosted Supabase and Vercel deployment remain unverified.

## Temporary student preview and handoff

### Practice cases in real assignments (issue #19)

Issue #21 simplifies `workspace-shell.tsx` to one Assignments navigation entry in the sidebar/Menu and a padded nonshrinking brand. `SubmissionForm` places submission/status in a footer after practice; server-rendered history remains last. The shared runner keeps Run code above input/output and composes the example selector before cases plus a test-action slot beside the cases heading. All run/test buttons explicitly use `type="button"`; the separate save button uses `type="submit"`. Runner lifecycle, source state and write payloads are unchanged. `workspace-layout.spec.ts` covers navigation/branding, and the authenticated language journeys check action order and mobile fit.

The [public-case handoff](../workflow/contracts/published-practice-cases.md) specifies the DTO, publication/authorization requirements and limits for the teammate implementing teacher persistence. It does not claim a loader/endpoint exists. `assignment-practice.server.ts` supplies only standalone development examples, returning null unless `NODE_ENV=development`, `STUDENT_RUNNER_PREVIEW_ENABLED=true` and `STUDENT_TEST_CASE_FIXTURES_ENABLED=true`. The assignment page passes that server-approved data to `AssignmentPractice` through the real submission form. Keep fixture imports out of API/storage services; never use them as a fallback for missing published data.

`assignment-practice.tsx` requires explicit unchecked-by-default selection and explains that the sum-of-two-integers examples are not assignment tests. Example mode changes only runner/result labels, reusing the existing sandbox, matching and timeout code. Selection changes key/remount the runner to cancel active work and discard results without clearing editor source. Results remain local and the submission DTO is unchanged. No schema, grade/XP write or dependency is added. Production supplies no fixture cases and continues to deny local browser execution.

The fixture unit suite covers environment/flag denial, case bounds and caller isolation. Set process-only `RUN_ASSIGNMENT_CASE_TESTS=1` when running `java-assignments.spec.ts` against a real-data development server with all fixture/runner flags enabled and local test credentials. This extends the Python/Java journeys with success, mismatch, error/timeout, stale output, opt-out cancellation, no practice API writes and immutable private saves. Leave that test flag unset against default/production servers to assert absence of the fixture controls. Use a 180-second per-test timeout for the extended cases. Keep the privileged test key out of application environments; the normal CI suite skips authenticated opt-ins without it.

### Real assignment languages (issue #17)

Apply `20261029032830_java_assignments_and_submissions.sql` with `pnpm exec supabase migration up --local` on an existing local database; do not reset it to upgrade. This expands assignment languages to Python/Java and backfills each existing revision's language. The seven-argument `save_assignment` overload preserves the existing ownership/version/rubric checks and six-argument Python compatibility. A database trigger captures submission language from the locked assignment; clients submit only assignment ID, source and request ID. Another trigger prevents language changes after any submission, including concurrent saves. Failed changes roll back assignment and rubric updates together. Existing RLS/grants continue to protect student history, private rubrics and unpublished grades.

Instructor forms, student editor/browser runner, revision pages and bounded AI context use the validated stored language. Java still requires a single public `Main` class and the supported browser runtime libraries; source is never executed by the application server. Production runner hosting remains pending. To reverse an application release, retain the additive schema and the compatible old RPC; do not drop revision language or relabel historical code. Review backup/recovery before any schema rollback.

`java_assignments.test.sql` covers both languages, immutable revisions, server-derived language, retries, unpublished assignments, role/ownership restrictions and language locking. `java-assignments.spec.ts` uses synthetic local instructor/two-student accounts for UI/API save/history/privacy checks and deletes only its own fixtures. It skips without a local Supabase URL and process-only `MP4_E2E_SERVICE_ROLE_KEY`. Set `ACCOUNT_TEST_BASE_URL` to a development server with real assignments and `RUN_AUTHENTICATED_RUNTIME_TESTS=1` to include both browser runs; the static runtime server/assets must be ready. Do not pass the test admin key into Next.js or public variables.

Set STUDENT_PREVIEW_ENABLED=true in ignored .env.local and restart the development server. Student pages under /student/assignments then render synthetic Python/Java assignments. Data lives in src/features/student-assignments/preview.server.ts with a server-only import marker. Layout and adapter guards both require NODE_ENV=development and the explicit flag; this is never a production fallback for missing credentials or auth.

Public DTO selectors project known fields and filter publication status; components accept those DTOs and render plain text. The opt-in preview uses synthetic data; when the preview flag is off, the same assignment routes use authenticated Supabase-backed CodeLeet services. The preview does not simulate persisted submissions, grades or AI reviews.

The local list accepts preview=empty/error/slow only after the development gate. The error recovery action deliberately performs a fresh document navigation to clear both the failed RSC response and synthetic scenario; router navigation plus reset retained the failed view during testing. The one scoped ESLint exception documents that reason.

The source-entry preview is in src/features/student-submissions/code-entry.tsx, mounted only by the guarded assignment-detail page with assignment ID as its React key. Instructions remain server-rendered; the client receives the language only. A pure source-validation.ts helper counts UTF-8 bytes with TextEncoder and rejects blank, NUL, malformed Unicode and source over 32,768 bytes. No maxLength/truncation is applied because byte limits differ from character limits and invalid input must remain editable. Checks retain the original source state and display accessible associated messages.

This synthetic practice code-entry preview is a local component with input-check actions; its **Submit code** button remains disabled. The separate CodeLeet assignment workflow stores bounded Python/Java source as immutable revisions, with server validation and database ownership policies. The browser-practice tests check that a source sentinel is not transferred, oversized multibyte source remains in the editor, HTML-like source is inert, languages are fixed and another assignment starts empty. Unit tests cover byte boundaries, surrogate pairs and invalid/blank inputs.

Playwright starts a separate development server with PLAYWRIGHT_PREVIEW=true, output in ignored .next-preview and tsconfig.preview.json so an existing developer server is not stopped. Production tests start normally from .next. Do not use the test-only output flag for hosting. Next manages next-env.d.ts during type/build/dev runs; do not treat generated import-path changes as feature logic.

Prettier intentionally excludes existing planning/docs, generated skills, generated Next types and the lockfile; use scoped formatting for those documents when appropriate. Do not reformat generated OpenSpec skills or unrelated teammate files as part of a feature. No automated deployment is introduced by application CI.

OpenSpec was initialized using CLI 1.8.0 with Codex core integration. Current checks:

```sh
node workflow/scripts/check-scaffold.mjs
openspec validate --all --strict
```

Copy `.env.example` to ignored `.env.local`. The app reads the local Supabase URL and publishable key from `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; use only those public values in browser-visible variables. Never copy the local secret key, JWT secret or service-role key to a browser variable. Product AI stays disabled until `SOCLAAS_AI_ENABLED=true` and the SoCLaaS URL/key/model are configured server-side. Local auth/assignment/grade workflows remain available with AI disabled.

## Implemented application architecture

Password recovery uses the existing Supabase SSR PKCE client: `forgot-password-form.tsx` sends `resetPasswordForEmail` with a fixed same-origin `/auth/callback?next=/reset-password` redirect. The callback accepts only that exact recovery path, exchanges the code and verifies `getUser`; arbitrary next values never become redirect targets. Invalid/replayed/expired codes and provider exceptions return a generic request-another-link page. The `/reset-password` Server Component verifies identity before rendering `reset-password-form.tsx`, which compares passwords and calls `updateUser`. This also permits an already authenticated user to update their own password; no client-supplied user ID or role is accepted.

Recovery request responses do not disclose account existence; client pending/resend controls complement Supabase's authoritative rate limits. On successful update, Auth global sign-out is attempted; if it fails, the UI reports that the password changed and offers sign-out rather than claiming the update failed. Existing access JWTs are not claimed to be instantly revoked across every service. No recovery codes, tokens, email bodies, passwords or privileged keys are logged by these components. No schema change or new dependency is introduced.

Follow [Supabase's password recovery guide](https://supabase.com/docs/guides/auth/passwords). Configure each hosted environment's Site URL, explicit allowed callback URLs and SMTP before release. The local config allows the port-3000 development origins; open reset links in the requesting browser because PKCE uses its verifier cookie. Local Mailpit is on port 54324. `password-recovery.spec.ts` covers public/error boundaries with mocked provider replies; callback unit tests cover redirect/verification failures. `password-recovery-local.spec.ts` uses a synthetic account, local Mailpit and process-scoped test admin key to verify the real email flow, password mismatch/provider rejection, old/new password behavior and one-use link replay. It cleans up only that created account and skips without explicit local prerequisites. Tokens/traces remain ignored artifacts; no hosted SMTP test is claimed.

The shared editor's keyboard behavior lives in `student-submissions/indentation.ts` (pure range/selection edits) and `use-code-indentation.ts` (DOM integration). Tab/Shift+Tab handle collapsed/selected lines; Enter keeps leading whitespace and adds a level after Python block colons or open delimiters; Java blank-line closing braces dedent one level. A small unfinished-buffer lexical mask ignores string/comment delimiters, including multiline content; it is not a full parser or language service. Escape then Tab exits keyboard indentation mode. Composition and Ctrl/Alt/Meta shortcuts remain native; edits that would exceed the textarea maximum length are rejected intact.

Keyboard insertion uses native `insertText` to preserve undo in the verified Chromium browser, with `setRangeText` as a fallback. [MDN documents](https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand) that execCommand is deprecated but still used where native edit history has no standard replacement. The fallback preserves content/selection but is not claimed to preserve native undo across all browsers. Browser matrix verification remains a release task; no new editor dependency, server execution or persistence change is introduced.

Issue #15 reuses the theme store through `features/auth/app-theme.tsx` at the root layout, so account actions and authenticated pages inherit the same colors. `password-field.tsx` provides independent accessible visibility controls; signup compares confirmation before contacting Auth. `sign-out-button.tsx` signs out the current browser session, redirects only on success and exposes retryable failures. The real student list/detail uses `WorkspaceShell` with `authenticated=true`; fixture notices remain confined to explicitly selected development fixtures. Home navigation is omitted.

The real Python/Java `SubmissionForm` shares its in-memory source with `PracticeRunner` only when the server passes `NODE_ENV=development && STUDENT_RUNNER_PREVIEW_ENABLED=true`. No runner is enabled in production. Source limits and the authenticated persistence API remain unchanged. Saving refreshes server-rendered history with `router.refresh()` while preserving the editor. Real authored practice cases are not connected. Revision language is derived and stored by the database. For local testing in Windows PowerShell with script execution disabled, use `npx.cmd --yes pnpm@12.15.0` in place of `pnpm`.

`account-controls.spec.ts` covers theme persistence, separate eye controls and mismatch rejection; the mismatch test requires configured public Supabase values. The authenticated journey covers source retention, absence of sample/Home navigation and sign-out error recovery. With local services configured and `ACCOUNT_TEST_BASE_URL` pointing at a development server with the runner enabled, `RUN_AUTHENTICATED_RUNTIME_TESTS=1` also exercises a real Python run before submission. Never expose `MP4_E2E_SERVICE_ROLE_KEY` to application processes or public variables. The production Playwright server sets `APP_SITE_URL` to its own port 3100 so a developer's local port 3000 setting does not break legitimate test requests; application CSRF checks remain enforced.

Next.js provides the UI and authenticated server routes. Supabase Auth supplies identity; PostgreSQL and RLS enforce access. Shared services separate assignment/submission persistence, grading, XP, AI context construction, quotas/cache, and usage metadata.

The browser runner accepts source and stdin through a minimal validated bridge. Python execution and Java source compilation/execution stay on the client. Use a credential-free isolated execution origin and workers where feasible. Decide CSP, frame isolation, cross-origin headers, dependency loading, cancellation, and supported browsers through a measured feasibility experiment. Do not promise OS-style memory/process quotas in browsers without evidence.

The server stores submissions independently of practice-run results. Grade publication authorizes XP updates atomically; reruns, AI requests, and repeated publication must not create extra awards.

The AI gateway queries authorized fields, constructs role-specific bounded context, checks a scoped response cache, reserves quotas atomically, invokes SoCLaaS, validates structured output, and records sanitized usage metadata. Instructor-only rubric/grade data lives in protected tables, rather than columns exposed by student-readable queries. AI has no database tools or publication authority.

## Browser runtime feasibility lab

The [runtime experiment](../workflow/evidence/runtime-feasibility/README.md) contains actual coordinated researcher/reviewer/tester evidence, asset hashes, local measurements and reproduction commands. All source execution/Java compilation occurs in Chromium; src/runtime-lab/server.mjs only serves static local files. Downloaded distributions live in ignored .runtime-cache and are not installed as app dependencies or shipped in Git. The additional local editor integration is gated by both development preview flags; see the [User Guide commands](UserGuide.md#browser-runs-and-published-practice-tests-additional-local-opt-in).

Pyodide 314.0.7 is a conditional Python candidate. The TeaVM-javac snapshot plus [first-party input compatibility classes](../workflow/evidence/runtime-feasibility/java-input-resolution.md) now passes 31 Java checks, including System.in, UTF-8 BufferedReader, basic Scanner, EOF and Stop/rerun. It is not a full JDK library: supported APIs and limits are documented in that report. Replay results from the existing 11-case boundary harness were produced by the coordinator, not a new independent reviewer. Runtime distribution/provenance and production-origin/CSP integration still need review. Task 1.2 records evaluation, while 1.3/3.2 remain incomplete.

The [published practice contract](../workflow/PublishedPracticeTests.md) specifies ownership, future API/schema constraints, comparison, quotas and the local-only bridge. The student browser client checks origin, source window, nonce, request ID and bounded results. The bridge uses a fixed separate loopback origin and retains the inner opaque worker boundary. Different ports do not isolate cookies; use this synthetic preview only, and select a genuinely credential-free deployment origin before release. New bridge/lifecycle changes have coordinator testing but no new independent security review.

Domain comparator/suite tests run in the normal unit suite. Full real-runtime website tests are opt-in because binaries are not distributed in Git: fetch assets, build, then set `$env:RUN_BROWSER_RUNTIME_TESTS="1"` and run `pnpm test:e2e`. Default CI runs existing website tests and skips the four opt-in cases. For sandboxed Windows environments where Playwright's process-tree shutdown stalls, manually launch production port 3100, isolated preview port 3101 (PLAYWRIGHT_PREVIEW=true and both preview flags true), and static runner port 3130; set PLAYWRIGHT_MANUAL_SERVERS=1 for the test command and stop only those owned terminal sessions afterward. The manual mode is ignored in CI. Standalone probes remain under workflow/scripts; their executionMs now measures execution only, separately from compilation/setup. A 20-second preparation watchdog bounds runs that never reach execution; repeated executing messages are rejected.

## Data and API contracts

The CodeLeet MVP data model uses profiles/roles, public assignment rows, separately stored private rubrics, immutable submission revisions, draft/published grades, AI review cache, quota reservations, and usage records. Forums, XP awards and broad analytics are outside this selected MVP. `openspec/changes/deliver-codementor-mvp/design.md` defines ownership, RLS, RPC boundaries, lifecycle/versioning, and quota behavior.

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

The refined student UI groups Menu and an icon-only theme action at the far-right of the sticky header on all screen sizes. Practice actions share one toolbar above the smaller input/output panels; the requester removed the Run details disclosure and redundant completion/practice-feedback message; output, test verdicts, progress and actionable errors remain. The visible Stop action has been removed at the requester's direction; internal browser-client termination, preparation/execution/suite deadlines and unmount cleanup remain unchanged. Website tests now verify navigation cancellation/frame teardown and fresh rerun, while the standalone runtime harness still exercises its stop API.

The workspace light/dark preference uses useSyncExternalStore with a stable light server snapshot, browser-local validated preference, system color-scheme subscription and current-session fallback when storage is blocked. Only `codeleet-workspace-theme` is persisted. Theme classes/variables live on the application wrapper and student shell rather than html; account and public pages share the preference while the isolated runner document remains separate. Native input color schemes, editor colors, neutral surfaces and semantic result/error colors adapt together. No theme dependency or change to execution/identity/persistence services was added.

The student workspace uses original Coursemology-inspired presentation: WorkspaceShell provides responsive navigation, assignment components provide the compact table and problem panel, CodeEntry provides a native textarea with a scroll-synchronized line gutter, and PracticeRunner/PracticeResults present existing browser outcomes. Theme overrides are shared by `.app-theme` and `.student-workspace`, covering the public home and account forms as well. The shared CodeEditor now adds Prism syntax colours to both native input surfaces, with the line gutter and highlight layer synchronized to the textarea. It renders React text tokens without injecting HTML. Highlighting falls back to plain text above 32,768 characters; at most 32,769 line labels cover all valid preview source. Oversized source stays editable, and forced-colors mode shows native text. This addition changes no runtime bridge/comparison/security policy. [UI evidence](../workflow/evidence/student-workspace-ui/README.md) records actual checks/screenshots and limits.

Add Vitest for domain/context/schema logic; PostgreSQL/RLS tests for access and concurrent grade/XP/quota operations; Playwright for role journeys and real browser runtime behavior; mocked AI tests for deterministic guards; and bounded real SoCLaaS evaluations for prompt-injection/quality evidence. Mocked model output alone does not demonstrate model resistance to attacks.

## Deployment and environments

Plan separate development and production Supabase projects/credentials, corresponding Vercel environments, and team-controlled GitHub Actions automation. `master` is release/grading; `develop` is the planned integration branch. Do not expose production secrets to untrusted PR jobs. Review migrations and keep rollback/recovery steps before release. The product website is deployed separately to GitHub Pages. Nothing has been deployed by this scaffold.

## Acknowledgements and AI use

- Source syntax colouring uses [prism-react-renderer](https://github.com/FormidableLabs/prism-react-renderer) 2.4.1 and [Prism](https://prismjs.com/) 1.30.0, both MIT licensed; `@types/prismjs` 1.26.6 supplies development types. These versions were already resolved for the website and are now pinned as direct app dependencies. The Java/Python grammars are loaded explicitly. Theme definitions are imported from the package; the editor layout and synchronization are first-party code.

- Coursemology's [public guide](https://coursemology.github.io/coursemology-help/) informed assignment, grading, feedback, and discussion journeys. No guide text or code was copied.
- The requester's Coursemology screenshots and [student/instructor-view guide](https://coursemology.github.io/coursemology-help/assessments/student-instructor-view) informed the compact navigation/assignment list and problem-above-editor layout. The UI is an original adaptation; no Coursemology assets, student identity, course content or implementation were copied.
- The team's [MP3 repository](https://github.com/CS3227-2610-MP3-ConnectTalent/CS3227-2610-MP3) informed technology selection only. MP4 implementation and configuration are written fresh.
- The user-provided `Brainstorm AI App Ideas.pdf` informed two role-specific AI features and security/resource experiment ideas. Its no-execution recommendation was superseded by the user's browser-runner requirement.
- [OpenSpec](https://github.com/Fission-AI/OpenSpec), CLI 1.8.0, generated the `.agents/skills/` integrations. Preserve generated attribution/license references.
- The fresh bootstrap follows official [Next.js installation](https://nextjs.org/docs/app/getting-started/installation), [Tailwind PostCSS integration](https://tailwindcss.com/docs/installation/framework-guides/nextjs), and [shadcn manual setup](https://ui.shadcn.com/docs/installation/manual) conventions. No previous MP configuration was copied.
- Codex assisted with source review, scope synthesis, and generation of this scaffold. Team members must review these files and update this declaration with actual later use before submission.
- Runtime/library acknowledgements and licenses: pending selection. Record them before distributing any runtime assets.
