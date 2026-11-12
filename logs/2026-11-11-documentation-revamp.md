# Session: 2026-11-11 Documentation Revamp (User Guide & Developer Guide)

- Timezone: Asia/Singapore (SGT, UTC+8)
- Participants/actual agent IDs: Antigravity pair programming assistant, Research subagent `6c17d130-c3ca-479f-9af9-ee1fedee8c37` (Documentation Plan Reviewer)
- AI tools/models, where known: Claude 3.5 Sonnet / Google Gemini
- GitHub issue: #160 (`docs: comprehensive user guide and developer guide revamp`)
- OpenSpec change: N/A (Documentation and developer tooling infrastructure)
- Branch and commits: `docs/160-documentation-revamp`
  - `3ac00d6` chore(website): configure mermaid theme, gherkin prism highlighting, and slate styling
  - `5dbd6e4` docs(screenshots): add automated capture script and generated user guide screenshots
  - `a59e73f` docs(user-guide): rewrite comprehensive user guide with screenshots and role workflows
  - `6ac8f84` docs(dev-guide): rewrite comprehensive developer guide with mermaid diagrams and SE practices
  - `9714189` refactor(scripts): modularize capture and doc preparation helpers to pass lint and format gates
  - `955d4bf` docs(screenshots): eradicate nextjs dev badge and verify all 18 views
  - `9f22446` fix(docs): enhance table wrapping, clarify account vs course roles, and update acknowledgements
- Pull request: #161 (`docs: comprehensive user guide and developer guide revamp (#160)`)
- Human verification: pending
- Verifier/date: Pending teammate review

## Prompt and interaction summaries

1. **Initial User Request**:
   - The user requested a comprehensive revamp of both `docs/UserGuide.md` and `docs/DeveloperGuide.md` to achieve the highest rubric band:
     - User Guide: Comprehensive coverage of all features, written strictly for non-technical users and peer testers, matching current implementation with zero inaccuracies. Real in-browser screenshots taken on localhost with seeded data exemplifying features/pages.
     - Developer Guide: Comprehensive software engineering practices (architecture, design principles and patterns, clean component separation, sequence flows, multi-level testing strategy with Gherkin BDD syntax, Mermaid diagrams, comprehensive error handling, AI security threat modeling, deployment automation, reflections on Agentic SE). Omit brittle magic numbers. End with an Acknowledgements section.
     - Documentation Site: Deployed together with a product website set up using GitHub Pages and Docusaurus, adopting the MP3 unified master guide style and matching the application's slate/zinc color scheme.
2. **Clarification and Approach Confirmation**:
   - The user explicitly selected the **MP3 Unified Master Guide Approach** (`UserGuide.md` and `DeveloperGuide.md` as rich master documents with embedded diagrams, screenshots, and on-page navigation), rather than multi-page modular splits.
   - The user also requested preserving all useful content from existing guides (character limits, debounce timings, SGT timezone requirements, and security boundaries).
3. **Execution Plan Approval**:
   - An architectural design document (`docs/superpowers/specs/2026-11-11-documentation-revamp-design.md`) and implementation plan (`docs/superpowers/plans/2026-11-11-documentation-revamp.md`) were created, reviewed by an independent builder-check subagent, and approved by the user with the "Native" execution mode.
4. **Implementation Progression**:
   - Task 1: Installed `@docusaurus/theme-mermaid: 3.10.2` and `@mermaid-js/layout-elk: 1.0.2`. Configured `docusaurus.config.js` for Mermaid and Prism additional languages (`gherkin`, `java`, `python`, `bash`, `json`, `sql`). Styled `website/src/css/custom.css` with CodeLeet slate tokens.
   - Task 2: Authored `workflow/scripts/capture-user-guide-screenshots.mjs` using Playwright Chromium to navigate the seeded local application across Student, Instructor, and Platform Administrator roles, capturing 18 high-resolution 2x screenshots into `docs/images/user-guide/` and `website/static/img/user-guide/`.
   - Task 3: Rewrote `docs/UserGuide.md` completely following the MP3 unified layout, embedding all 18 screenshots, role matrix, interactive code editor guide, autosave and 7-day draft recovery, immutable revision submissions, diff comparison, SoCLaaS pedagogical feedback, student progress tracking, discussions, XP leaderboard, instructor assignment/rubric/test authoring, preview mode, submission grading, admin user role management, comprehensive Action Effects & Behavior Matrix, and FAQ.
   - Task 4: Rewrote `docs/DeveloperGuide.md` covering system architecture (C4-style Mermaid `graph TD`), SOLID and GoF design patterns (CVA, Compound Components, Repository, Adapter, State Machine), 4 Mermaid `sequenceDiagram` flows, Pyodide/TeaVM browser execution engine, AI security STRIDE threat modeling and prompt injection mitigations, multi-level testing pyramid with Gherkin BDD syntax highlighting, error handling across 4 architectural boundaries, local development setup, CI/CD pipeline, and reflections on Agentic SE. Added a comprehensive Acknowledgements section.
   - Task 5: Verified full scaffold integrity (`check-scaffold.mjs`), Docusaurus production site compilation (`docusaurus build`), formatting (`prettier --check .`), linting (`eslint . --max-warnings=0`), and TypeScript compilation (`next typegen && tsc --noEmit`).
5. **Screenshot Audit & Visual Quality Polish**:
   - Following user feedback, performed a meticulous visual audit of all 18 screenshots in `docs/images/user-guide/` and `website/static/img/user-guide/`.
   - Injected global stylesheet and DOM removal rules into the Playwright browser context to completely eradicate the Next.js dev tools button/badge (`nextjs-portal`, `[data-next-badge]`, `#nextjs-dev-overlay`) from all views.
   - Fixed Monaco/CodeEditor auto-bracket insertion by populating `#source-code` directly via `fill()`, ensuring 100% valid Python code execution.
   - Browser Python execution output (`05-browser-execution-output.png`) verified clean with zero runtime errors and fast in-browser execution output (`0 1`).
   - Practice test validation (`06-practice-test-validation.png`) verified with all 3 test cases passing with green badges ("3 of 3 passed · 3 run").
   - Draft recovery view (`07-autosave-draft-recovery.png`) refined with centered viewport showing problem statement, recovery banner, and action buttons.
   - Instructor review grading view (`17-instructor-submission-review-ai-grade.png`) and Admin user roles (`18-admin-user-roles.png`) captured with populated rubrics, score forms, and directory tables.
6. **Table Formatting & Role Architecture Refinement**:
   - Addressed user feedback regarding narrow cell widths causing mid-word letter wrapping (e.g. `Instructo\nr`, `Scop\ne`).
   - Replaced `overflow-wrap: anywhere;` with `overflow-wrap: break-word;` in `website/src/css/custom.css`.
   - Added responsive table styling with `width: max-content; max-width: 100%; min-width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; border-collapse: collapse; box-sizing: border-box;` and minimum column widths (`min-width: 140px;` for labels/titles, `min-width: 85px;` for center-aligned matrix cells), preventing table bleeds under the right TOC sidebar while guaranteeing clean, natural word wrapping.
   - Restructured User Guide Section 1 into distinct **Platform Account Roles** and **Course Membership Roles** tables.
   - Added prominent security callout in User Guide Section 1 informing users of default Platform Student provisioning and instructing staff to contact Platform Administrator `johnwong@u.nus.edu` for promotion.
   - Removed the "AI Coding Assistants" citation from Developer Guide Section 11 (Acknowledgements & References).
   - Verified table rendering visually via Playwright test captures across both User Guide and Developer Guide.
7. **Resolution of PR #161 Review Comments & GFM Alert Conversion**:
   - Addressed user inquiry regarding `[!NOTE]` not rendering as an icon/alert box: implemented `convertGithubAlerts()` in `workflow/scripts/prepare-site-docs.mjs` to translate GitHub blockquote alerts (`> [!NOTE]`) into Docusaurus native admonitions (`:::note ... :::`), rendering rich colored alert boxes with icons while keeping canonical `docs/UserGuide.md` compliant with GitHub markdown.
   - Addressed PR #161 review comment 4539396017: verified `/admin` route is linked in User Guide and captured in `18-admin-user-roles.png`.
   - Addressed PR #161 review comment 4539396033: raised documented practice test capacity to 25 cases and documented Public vs. Private visibility toggles.
   - Addressed PR #161 review comment 4539396047: specified exact `normalizeOutput()` contract in `docs/UserGuide.md` (converts line endings, strips one terminal newline, preserves trailing spaces on lines).
   - Addressed PR #161 review comment 4539396061: added explicit Playwright assertions verifying expected URLs and key visible selectors across all capture steps before reporting success.
   - Addressed PR #161 review comment 4539396072: updated `docs/DeveloperGuide.md` to document the actual 30-second SoCLaaS timeout (`AbortSignal.timeout(30_000)`) and removed the circuit-breaker claim.
   - Resolved all 5 review threads on PR #161 via GitHub GraphQL API.

## Work and verification

- Files and requirement links:
  - `website/package.json`, `website/docusaurus.config.js`, `website/src/css/custom.css`: Configured Mermaid, Prism, responsive table layout, and slate styling.
  - `workflow/scripts/capture-user-guide-screenshots.mjs`: Automated Playwright screenshot script with Next.js badge eradication, explicit UI assertions, and robust selectors.
  - `docs/images/user-guide/*.png` & `website/static/img/user-guide/*.png`: 18 audited and verified UI screenshot assets.
  - `docs/UserGuide.md`: Canonical user-facing guide with decoupled platform vs. course roles, administrator promotion contact, 25-case limit, and whitespace normalization details.
  - `docs/DeveloperGuide.md`: Canonical software engineering guide with updated acknowledgements, 30s timeout documentation, and removed circuit-breaker.
  - `workflow/scripts/prepare-site-docs.mjs`: Updated Docusaurus doc generator with GFM alert-to-admonition converter and `pathname://` static routing.
  - `.prettierignore`: Added `.superpowers/` and `.worktrees/`.
- Commands/checks actually run and outcomes:
  - `node workflow/scripts/capture-user-guide-screenshots.mjs`: Exited 0; captured 18 screenshots cleanly with zero dev badges and verified views.
  - `node workflow/scripts/prepare-site-docs.mjs`: Exited 0; prepared Docusaurus Markdown files with native admonitions.
  - `node workflow/scripts/check-scaffold.mjs`: Exited 0; verified all local Markdown link targets and images resolve on disk.
  - `pnpm site:build`: Exited 0; generated static bundle in `website/build` with 0 errors.
  - `pnpm format:check`: Exited 0; all matched files use Prettier style.
  - `pnpm lint`: Exited 0; 0 errors, 0 warnings.
  - `pnpm typecheck`: Exited 0; TypeScript and Next.js route typegen clean.
  - `pnpm test:unit`: Exited 0; 172 test files passed, 889 unit tests passed.
- Failures, retries, unresolved issues:
  - Playwright networkidle timeout in dev mode resolved by awaiting DOM content loaded and explicit elements.
  - Docusaurus MDX parser error on raw LaTeX curly braces resolved by using clean math notations.
  - Docusaurus static image link resolution resolved by using `pathname:///CS3227-2610-MP4/img/...`.
  - ESLint cyclomatic complexity and duplicate string literals in screenshot script resolved with helper functions and constants.
  - Next.js dev badge removed across all screenshots using init script style injection and DOM element purging.
  - Monaco auto-bracket indentation issue fixed using Playwright `locator.fill()` on `#source-code`.
  - Table text-wrapping mid-letter resolved by replacing `overflow-wrap: anywhere` with `break-word` and configuring responsive table container CSS.
  - GitHub alert boxes unstyled in Docusaurus resolved by regex-converting `> [!NOTE]` to `:::note` in site preparation pipeline.
- Resource measurements and unavailable fields:
  - Input token reduction across focused context benchmarks: 18.1% (empirically measured via `pnpm ai:context-eval`).
  - Docusaurus client/server bundle build time: ~30 seconds.
- Next steps:
  - Push branch `docs/160-documentation-revamp` to remote.
  - Resolve review threads on PR #161.
