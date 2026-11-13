# Comprehensive User Guide and Developer Guide Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate CodeLeet's User Guide and Developer Guide to the highest grading rubric standards, deployed as a unified master documentation site on GitHub Pages via Docusaurus with Mermaid diagrams, Gherkin syntax highlighting, and live localhost seeded screenshots.

**Architecture:** Maintain canonical `docs/UserGuide.md` (non-technical, user-facing, peer-tester aligned) and `docs/DeveloperGuide.md` (full software engineering practices, architecture, design patterns, testing strategy, AI security, agentic SE reflections, and acknowledgements). Enhance the Docusaurus setup in `website/` with `@docusaurus/theme-mermaid`, Prism language grammars, and dark/light slate theme tokens. Provide an automated Playwright screenshot harness in `workflow/scripts/` to capture and embed crisp UI evidence across Student, Instructor, and Admin roles.

**Tech Stack:** Docusaurus 3.10, `@docusaurus/theme-mermaid`, Prism.js, Playwright, Next.js 16, Tailwind CSS, Node.js 24, pnpm 12.

**Spec:** [`docs/superpowers/specs/2026-11-11-documentation-revamp-design.md`](file:///c:/Users/John/Documents/GitHub/CS3227-2610-MP4/docs/superpowers/specs/2026-11-11-documentation-revamp-design.md)

## Global Constraints

- Preserve all verified current product behavior and exact technical limits (8,000 char source limit, 500ms debounce, 7-day browser draft recovery, SGT deadline timezone, Pyodide/TeaVM browser sandbox).
- Keep User Guide strictly non-technical and user-facing; technical setup, migrations, and test commands belong exclusively in Developer Guide.
- Zero brittle magic numbers in the Developer Guide (no hardcoded, quickly staling test counts).
- Maintain existing repository invariants: `docs/UserGuide.md` and `docs/DeveloperGuide.md` remain canonical; `check-scaffold.mjs` must pass with zero broken links.
- Strictly browser-only execution: submitted code must never run in Next.js/Node.
- Comply with Pinned Node.js 24.22.1 and pnpm 12.15.0.

## Review Focus

1. **Relative Image Path Resolution Across Dual Targets**: Relative image links must work in raw GitHub Markdown previews (`docs/images/user-guide/...`) and when compiled by Docusaurus (`/img/user-guide/...`).
   *Test: Step 4 in Task 1 asserts `prepare-site-docs.mjs` rewrites image links to `/CS3227-2610-MP4/img/user-guide/...` and static files exist in `website/static/img/user-guide/`.*
2. **Mermaid Diagram Syntax Validation in Docusaurus**: Unsupported Mermaid syntax or unquoted special characters will fail the Docusaurus build.
   *Test: Step 4 in Task 4 executes `pnpm site:build` to confirm all Mermaid diagrams compile cleanly.*
3. **Prism Syntax Highlighting for Gherkin**: Unregistered languages fail or render as unhighlighted plain text.
   *Test: Step 4 in Task 1 verifies `website/docusaurus.config.js` Prism `additionalLanguages` includes `gherkin`, `java`, `python`, `sql`, `json`, `bash`.*
4. **Scaffold & Link Integrity Verification**: Any broken relative link in `docs/` fails `workflow/scripts/check-scaffold.mjs`.
   *Test: Step 3 in Task 5 runs `pnpm check:scaffold` and verifies exit code 0.*
5. **Screenshot File Integrity & Dimensions**: Automated capture must not generate empty or truncated 0-byte images.
   *Test: Step 4 in Task 2 asserts all captured screenshots exist with size > 15 KB.*

---

### Task 1: Docusaurus Infrastructure, Plugins, and Theme Configuration

**Files:**
- Modify: `website/package.json`
- Modify: `website/docusaurus.config.js`
- Modify: `website/src/css/custom.css`
- Modify: `workflow/scripts/prepare-site-docs.mjs`

**Interfaces:**
- Consumes: Existing Docusaurus 3.10 configuration.
- Produces: Native `@docusaurus/theme-mermaid` support, Prism Gherkin/Java/Python highlighting, CodeLeet neutral slate theme tokens, and image asset mirroring in `workflow/scripts/prepare-site-docs.mjs`.

- [ ] **Step 1: Install `@docusaurus/theme-mermaid` and configure Docusaurus plugins**
  In `website/package.json`, add `"@docusaurus/theme-mermaid": "3.10.2"` to dependencies and run `pnpm --filter @cs3227/mp4-website install`.
  In `website/docusaurus.config.js`:
  - Add `markdown: { mermaid: true, hooks: { onBrokenMarkdownLinks: 'throw' } }`.
  - Add `themes: ['@docusaurus/theme-mermaid']`.
  - Under `themeConfig.prism`, add `additionalLanguages: ['gherkin', 'java', 'python', 'bash', 'json', 'sql']`.

- [ ] **Step 2: Update `website/src/css/custom.css` with CodeLeet Slate Theme Tokens**
  Align `--ifm-color-primary` and related color variables with the app's neutral slate / zinc palette (`#0f172a`, `#334155`, `#475569`, `#f8fafc`) for both `:root` (light) and `[data-theme='dark']` (dark).
  Add clean styling for callouts, tables, and full-width diagram responsiveness.

- [ ] **Step 3: Enhance `workflow/scripts/prepare-site-docs.mjs` for Image Assets**
  Update `prepareSiteDocs` in `workflow/scripts/prepare-site-docs.mjs`:
  - Copy all assets from `docs/images/` to `website/static/img/` recursively.
  - In `rewriteTarget`, ensure image links referencing `../docs/images/...` or `images/...` are transformed to `/img/...` (or prefixed with baseUrl `/CS3227-2610-MP4/img/...`).

- [ ] **Step 4: Verify Docusaurus Build with Mermaid & Image Support**
  Run: `pnpm site:build`
  Expected: Clean build output in `website/build/` with 0 broken links and 0 syntax errors.

- [ ] **Step 5: Commit Docusaurus Configuration**
  ```bash
  git add website/ workflow/scripts/prepare-site-docs.mjs pnpm-lock.yaml
  git commit -m "chore(website): configure mermaid theme, gherkin prism highlighting, and slate styling"
  ```

---

### Task 2: Automated Screenshot Capture Harness & Asset Generation

**Files:**
- Create: `workflow/scripts/capture-user-guide-screenshots.mjs`
- Create directory: `docs/images/user-guide/`
- Create directory: `website/static/img/user-guide/`

**Interfaces:**
- Consumes: Local Supabase instance, local Next.js dev server on `http://localhost:3000`, and seed fixtures (`student01@codeleet.test`, `instructor1@codeleet.test`, `admin@codeleet.test` with password `password`).
- Produces: 18 high-resolution PNG screenshots in `docs/images/user-guide/` and `website/static/img/user-guide/`.

- [ ] **Step 1: Create Screenshot Capture Script**
  Write `workflow/scripts/capture-user-guide-screenshots.mjs` using Playwright:
  - Check that `http://localhost:3000` is responding (or start Next.js dev process if needed).
  - Launch Chromium with 1280x800 viewport and device scale factor 2 for crisp screenshots.
  - **Student Flow (`student01@codeleet.test` / `password`):**
    1. `01-welcome-and-auth.png`: Sign In modal / Welcome page.
    2. `02-student-courses.png`: `/courses` list showing enrolled courses.
    3. `03-course-assignments.png`: `/courses/<id>/assignments` with filters and language tags.
    4. `04-student-editor.png`: `/courses/<id>/assignments/<id>` code editor and standard input box.
    5. `05-browser-execution-output.png`: Execution output terminal after running Python/Java code.
    6. `06-practice-test-validation.png`: Test cases tab showing Pass/Fail results.
    7. `07-autosave-draft-recovery.png`: Autosave badge and draft recovery indicator.
    8. `08-submissions-history.png`: Submissions revision history list.
    9. `09-revision-diff-comparison.png`: Side-by-side diff comparison dialog.
    10. `10-ai-learning-feedback.png`: AI feedback hint panel.
    11. `11-student-progress.png`: `/courses/<id>/progress` dashboard (metrics & upcoming deadlines).
    12. `12-course-discussions.png`: `/courses/<id>/discussions` forum threads and search.
    13. `13-course-leaderboard.png`: `/courses/<id>/leaderboard` XP ranking.
  - **Instructor Flow (`instructor1@codeleet.test` / `password`):**
    14. `14-instructor-course-admin.png`: `/courses/<id>/manage-users` (People roster & Student Join Code).
    15. `15-instructor-assignment-authoring.png`: `/courses/<id>/assignments/new` with Rubric Builder.
    16. `16-instructor-practice-test-authoring.png`: Practice test cases authoring tab.
    17. `17-instructor-submission-review-ai-grade.png`: `/courses/<id>/submissions/<id>` with AI Rubric Evaluation.
  - **Admin Flow (`admin@codeleet.test` / `password`):**
    18. `18-admin-user-roles.png`: `/admin/users` role directory and promotion/demotion.

- [ ] **Step 2: Run Screenshot Capture Script**
  Run: `node workflow/scripts/capture-user-guide-screenshots.mjs`
  Expected: All 18 screenshots captured and saved to `docs/images/user-guide/` and `website/static/img/user-guide/`.

- [ ] **Step 3: Verify File Sizes & Visual Integrity**
  Inspect file sizes: ensure all 18 images exist and each is > 15 KB.

- [ ] **Step 4: Commit Screenshot Assets and Script**
  ```bash
  git add workflow/scripts/capture-user-guide-screenshots.mjs docs/images/user-guide/ website/static/img/user-guide/
  git commit -m "docs(screenshots): add automated capture script and generated user guide screenshots"
  ```

---

### Task 3: Comprehensive User Guide Rewrite (`docs/UserGuide.md`)

**Files:**
- Modify: `docs/UserGuide.md`

**Interfaces:**
- Consumes: Screenshots from Task 2, existing verified functional behavior from `docs/UserGuide.md` and codebase contracts.
- Produces: Exhaustive, non-technical, user-friendly master User Guide adhering to MP3 standards and grading rubrics.

- [ ] **Step 1: Draft Section 1 & 2: Introduction, Quick Start & Account Management**
  - Product overview, core value propositions, and browser requirements.
  - User interface tour (Global Navigation, Breadcrumbs, Theme Toggle, Sidebar, Status Indicators).
  - Registration, login with email or unique username, password recovery via email, profile editing.
  - Embed `01-welcome-and-auth.png`.
  - Include visual callouts (> [!TIP], > [!NOTE], > [!IMPORTANT]).

- [ ] **Step 2: Draft Section 3 & 4: Course Workspaces & Complete Student Journey**
  - Course enrollment via 6-character Student Join Code.
  - Assignment browsing, filtering by language (Python/Java), deadline status.
  - Editor features: syntax highlighting, 8,000-character UTF-8 limit, custom stdin input.
  - Browser-only execution with Pyodide and TeaVM (zero server compilation).
  - Autosave and 7-day browser draft recovery across tabs and refreshes.
  - Submissions, timestamped revision history, and side-by-side diff comparison.
  - Practice test validation against instructor-published test cases.
  - Pedagogical AI learning feedback (hints and explanations, not direct answers).
  - Discussions forum, posting threads, replying, and keyword search.
  - Progress dashboard (completed, overdue, upcoming work) and Course XP Leaderboard (1, 1, 3 tied ranks).
  - Embed `02-student-courses.png` through `13-course-leaderboard.png`.

- [ ] **Step 3: Draft Section 5: Complete Instructor Journey**
  - Course creation, lifecycle management (active, archived).
  - Member management: student join code generation/rotation, inviting members by email, removing students.
  - Assignment authoring: title, instructions, language locking, deadline (SGT), max XP (0–100,000), rubric criteria authoring (levels, points, descriptions).
  - Practice test authoring: creating and publishing up to 5 public test cases.
  - Submission review: inspecting student code, requesting AI rubric evaluation, editing criteria scores/feedback, publishing official grades.
  - Embed `14-instructor-course-admin.png` through `17-instructor-submission-review-ai-grade.png`.

- [ ] **Step 4: Draft Section 6 & 7: Platform Administrator Journey & Action Effects Matrix**
  - Platform administrator user role directory, promotion/demotion between Student, Instructor, and Admin, last-admin protection.
  - Read-only course oversight.
  - Embed `18-admin-user-roles.png`.
  - **Comprehensive Action Effects & Behavior Matrix**: Complete table mapping every user action to:
    - Trigger / UI element
    - Immediate UI feedback (spinners, disabled buttons, toasts)
    - Persistent state change / backend mutation
    - Edge cases & recovery steps (network drops, validation errors, timeouts).

- [ ] **Step 5: Verify User Guide with Scaffold and Site Build**
  Run: `pnpm check:scaffold && pnpm site:build`
  Expected: PASS with 0 broken links and clean documentation generation.

- [ ] **Step 6: Commit User Guide**
  ```bash
  git add docs/UserGuide.md
  git commit -m "docs(user-guide): rewrite comprehensive user guide with screenshots and role workflows"
  ```

---

### Task 4: Comprehensive Developer Guide Rewrite (`docs/DeveloperGuide.md`)

**Files:**
- Modify: `docs/DeveloperGuide.md`

**Interfaces:**
- Consumes: Codebase architecture, database schemas, SoCLaaS client, Playwright harness, and existing verified developer documentation.
- Produces: Rigorous, clear, and comprehensive software engineering Developer Guide with Mermaid diagrams, Gherkin scenarios, and acknowledgements.

- [ ] **Step 1: Draft Section 1 & 2: Local Setup, Environment & Troubleshooting**
  - Prerequisites (Node.js 24.22.1, pnpm 12.15.0, Docker Desktop with Linux engine).
  - Step-by-step local bootstrap (`pnpm install`, `pnpm db:start`, `pnpm exec supabase migration up --local`, `pnpm dev`).
  - Environment variables reference (`.env.local` vs `.env.example`).
  - Common troubleshooting scenarios (occupied ports, Docker daemon, HMAC secrets).

- [ ] **Step 2: Draft Section 3 & 4: Architecture, Design Patterns & Component Separation**
  - High-level Architecture C4 Component Diagram (Mermaid `graph TD`).
  - Design Principles: Separation of Concerns, Defense in Depth, Principle of Least Privilege, Single Responsibility.
  - Design Patterns:
    - **CVA (Class Variance Authority)** for component variants.
    - **Compound Components** for complex UI flows.
    - **Repository/Service Pattern** for database queries and business logic.
    - **Adapter Pattern** for the SoCLaaS AI gateway.
    - **Finite State Machine** for in-browser execution states.
  - **Interaction Flow Sequence Diagrams (Mermaid `sequenceDiagram`):**
    1. Code Submission & Revision Snapshot Flow.
    2. In-Browser Isolated Pyodide/TeaVM Execution Flow.
    3. Instructor Rubric Authoring & AI Evaluation Flow.
    4. Student Progress Anti-Join Query Flow.

- [ ] **Step 3: Draft Section 5 & 6: Browser-Only Execution & AI Security Threat Modeling**
  - Browser-only isolation architecture: sandboxed iframe, credential-free Web Worker supervisor.
  - Pyodide WebAssembly runtime and TeaVM Java in-browser compiler.
  - Resource bounds: 4,096 input bytes, 8,192 retained output bytes, strict timeout execution limits.
  - **AI Security Threat Modeling (STRIDE)**:
    - Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege.
  - Prompt Injection Mitigations: XML delimiter containment, system prompt isolation, schema validation.
  - Server-side secret isolation, preflight token budget reservations, zero tool/grade-publishing permissions for LLMs.

- [ ] **Step 4: Draft Section 7 & 8: Testing Strategy, DevOps & Agentic SE Reflections**
  - Multi-tier testing pyramid: Unit (Vitest), Database (pgTAP), End-to-End (Playwright), AI evaluation (Promptfoo & context benchmarks).
  - **Gherkin BDD Feature Scenarios**: Concrete `Feature:`, `Scenario:`, `Given`, `When`, `Then` blocks with syntax highlighting.
  - CI/CD Automation: GitHub Actions workflow matrix (`application.yml`, `pages.yml`, `codeql.yml`).
  - Environment Separation: Development, Preview, Production.
  - **Reflections on Agentic Software Engineering**:
    - Multi-Agent Software Engineering (roles, handoffs, specialist coordination).
    - Context Engineering (spec-driven handoffs, 95.5% input token reduction, SNR optimization).
    - Resource-Aware Tool Use (budget-gating, caching, avoiding redundant tool polling).
  - **No magic numbers**: omit ephemeral test counts that become obsolete.

- [ ] **Step 5: Draft Section 9: Formal Acknowledgements**
  - Citing Coursemology (journey inspiration), Pyodide, TeaVM, Docusaurus, shadcn/ui, Lucide, Vitest, Playwright, Promptfoo, OpenSpec, and AI pair-programming assistants.

- [ ] **Step 6: Verify Developer Guide with Scaffold and Site Build**
  Run: `pnpm check:scaffold && pnpm site:build`
  Expected: PASS with 0 broken links and clean documentation generation.

- [ ] **Step 7: Commit Developer Guide**
  ```bash
  git add docs/DeveloperGuide.md
  git commit -m "docs(dev-guide): rewrite comprehensive developer guide with mermaid diagrams and SE practices"
  ```

---

### Task 5: End-to-End Verification, Formatting, and Git Closeout

**Files:**
- Create: `logs/2026-11-11-documentation-revamp.md`

**Interfaces:**
- Consumes: All completed documentation, screenshots, and Docusaurus configuration.
- Produces: Passing test & lint suite, formatted repository, dated session summary, and Git branch ready for PR.

- [ ] **Step 1: Run Full Verification Suite**
  Run:
  - `pnpm check:scaffold`
  - `pnpm site:build`
  - `pnpm format:check` (or `pnpm format` if formatting needed)
  - `pnpm lint`
  - `pnpm typecheck`
  Expected: All checks pass with 0 errors and 0 warnings.

- [ ] **Step 2: Create Dated Session Summary Log**
  Write `logs/2026-11-11-documentation-revamp.md` from `logs/SessionTemplate.md` documenting:
  - Request and goals.
  - Decisions, files modified, and screenshots captured.
  - Verification results across scaffold check, site build, lint, and typecheck.
  - Limitations and human verification status.

- [ ] **Step 3: Final Commit and Branch Push**
  ```bash
  git add logs/2026-11-11-documentation-revamp.md
  git commit -m "docs: finalize comprehensive documentation revamp and record session audit"
  ```
