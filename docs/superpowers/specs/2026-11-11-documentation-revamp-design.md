# Design Document: Comprehensive User Guide and Developer Guide Revamp

**Date:** 2026-11-11  
**Status:** In Review  
**Target Branches:** `develop`  
**Reference Models:** [MP3 ConnectTalent](https://cs3227-2610-mp3-connecttalent.github.io/CS3227-2610-MP3/) (Unified Master Guide Approach) & [MP2 NUSynapxe](https://cs3227-2610-mp2-nusynapxe.github.io/CS3227-2610-MP2/)

---

## 1. Intent and Why

CodeLeet is a university module project evaluated against the highest grading band for documentation:
1. **User Guide**: Must cover **all functionality**, be **easy to read**, and be **very useful**. It is targeted at non-technical users and peer testers; thus, technical implementation details (testing commands, database migrations, security internals) must not appear here. Every feature, action effect, UI state, and behavior for each user role must precisely reflect the actual application to prevent tester-reported discrepancy bugs.
2. **Developer Guide**: Must cover **all software engineering practices**, be **easy to read**, and be **very useful**. It must describe system architecture, clean component separation, design patterns and principles, sequence interactions, extensibility/maintainability, multi-tier testing strategy, error handling across boundaries, AI security threat modeling & mitigations, deployment automation, and reflections on Agentic SE (Multi-Agent SE, Context Engineering, Resource-Awareness), without relying on brittle "magic numbers" (such as hardcoded test counts). It must conclude with formal acknowledgements citing all reused ideas, code, and documentation.
3. **Product Website & Tools**: Deployed on GitHub Pages via Docusaurus, aligned with CodeLeet's slate/zinc color scheme, supporting native Mermaid diagram rendering and Prism Gherkin syntax highlighting.
4. **Visual Evidence**: Screenshots captured from a live local instance with seeded data must accompany the User Guide to clearly exemplify each feature and page across roles.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
- **Unified Master User Guide (`docs/UserGuide.md`)**:
  - Clear visual layout with Table of Contents, iconography, callout blocks (Tips, Notes, Warnings), and clear action effect summaries.
  - Role-specific breakdown: **Student Experience**, **Instructor Experience**, and **Platform Administrator Experience**.
  - Detailed feature coverage: Authentication & Account Management, Theme Switching, Course Workspaces & Join Codes, Assignment Browsing & Filtering, Code Editor & In-Browser Execution (Python & Java), Browser Autosave & Draft Recovery, Revision History & Diff Comparison, Practice Test Validation, AI Learning Feedback (Student), Rubric Authoring & AI Evaluation (Instructor), Grade Editing & Publishing, Course Discussions & Search, Student Progress Dashboard, Assignment XP & Course Leaderboards, and Member/User Administration.
  - High-resolution UI screenshots embedded for every key view and interaction flow.
- **Unified Master Developer Guide (`docs/DeveloperGuide.md`)**:
  - Comprehensive Software Engineering documentation: System Architecture (Frontend, API/Routes, Browser-Only Runner, Supabase Database & Auth, SoCLaaS Gateway), Design Principles (SOLID, Separation of Concerns, Defense in Depth, Principle of Least Privilege) & Design Patterns (CVA, Compound Components, Repository/Service Pattern, Adapter Pattern, State Machine).
  - Component hierarchy and clean data flows illustrated with native Mermaid diagrams.
  - Multi-level Testing Strategy: Unit testing (Vitest), Database testing (pgTAP), End-to-End testing (Playwright), AI evaluation (Promptfoo & context benchmarks), and manual peer-testing protocol.
  - Error Handling: Boundary handling across client UI, Next.js API routes, Supabase RPCs/RLS, and sandboxed Web Workers.
  - AI Security in the App: Threat modeling (STRIDE), prompt injection mitigations, server-side secret isolation, preflight token budget checks, and privacy boundaries.
  - Deployment & Environments: CI/CD automation (`application.yml`, `pages.yml`, `codeql.yml`), environment separation (`.env.local` vs. hosted production), and GitHub Pages deployment.
  - Agentic SE Reflections: Multi-Agent Software Engineering, Context Engineering (spec-driven handoffs), Resource-Aware tool use.
  - Formal Acknowledgements citing Coursemology, Pyodide, TeaVM, Docusaurus, shadcn/ui, Promptfoo, OpenSpec, and AI pair-programming tools.
  - No brittle magic numbers (no ephemeral test counts).
- **Screenshot Automation Harness**:
  - Automated Playwright script (`workflow/scripts/capture-user-guide-screenshots.mjs`) that spins up against `localhost:3000` with local seeded database fixtures (`student01`, `instructor1`, `admin`), navigates all key pages/features, captures screenshots, and saves them to `website/static/img/user-guide/` and `docs/images/user-guide/`.
- **Docusaurus Enhancements**:
  - Install `@docusaurus/theme-mermaid` in `website/` and enable `markdown: { mermaid: true }`.
  - Configure Prism syntax highlighting in `website/docusaurus.config.js` to include `gherkin`, `bash`, `java`, `python`, `json`, and `sql`.
  - Update `website/src/css/custom.css` to align with the application's modern dark/light slate palette.
  - Update `workflow/scripts/prepare-site-docs.mjs` to copy or map image assets correctly without triggering link-rewrite errors.
  - Ensure zero broken links and strict compliance with `pnpm check:scaffold` and `pnpm site:build`.

### Non-Goals
- Modifying core application runtime or database schema.
- Adding server-side execution of Python or Java (strictly preserving browser-only runner).
- Creating unverified features or writing forward-looking roadmaps into user-facing guides.

### Anti-Goals
- Including technical setup, CLI commands, or database schemas inside `UserGuide.md`.
- Including brittle test counts or temporary audit statistics in `DeveloperGuide.md`.
- Creating multi-page sprawl in the repository that breaks `check-scaffold.mjs` or desynchronizes repo documentation.

---

## 3. Constraints

1. **Scaffold Checks**: `workflow/scripts/check-scaffold.mjs` strictly verifies that `docs/UserGuide.md` and `docs/DeveloperGuide.md` exist and that all internal relative Markdown links point to valid existing files.
2. **Website Build Script**: `workflow/scripts/prepare-site-docs.mjs` reads `docs/UserGuide.md` and `docs/DeveloperGuide.md`, transforms relative links into GitHub URLs or relative site links, and outputs to `website/docs/`. Images referenced in Markdown must resolve cleanly in both raw GitHub view and Docusaurus.
3. **Execution Sandbox**: The browser runtime for Python and Java must run strictly in the browser iframe/Web Worker; no remote execution service is permitted.
4. **Node & Package Tools**: Must use pinned Node 24 (`24.22.1`) and pnpm (`12.15.0`).

---

## 4. Approaches Considered

### Approach A: Unified Master Guide Approach (MP3 Style) — *Selected by User*
- Maintain `docs/UserGuide.md` and `docs/DeveloperGuide.md` as single, comprehensive, deeply structured master documents.
- Features: Rich table of contents, anchored sections, embedded callouts, inline Mermaid sequence and class diagrams, Gherkin scenario code blocks, and embedded screenshots.
- **Pros**:
  - Fully matches the user's explicit preference ("Let's follow MP3's unified master guide approach").
  - Seamlessly maintains existing repository invariants (`check-scaffold.mjs`, `.github/workflows/pages.yml`, and `prepare-site-docs.mjs`).
  - Single authoritative source of truth for both offline repository browsing and GitHub Pages deployment.
- **Cons**:
  - The files are long, requiring careful organization, clear headings, and structured navigation anchors.

### Approach B: Modular Multi-Page Guide Approach (MP2 Style)
- Split documentation into multiple files: `docs/UserGuide.md`, `docs/StudentGuide.md`, `docs/InstructorGuide.md`, `docs/ArchitectureAndDesign.md`, `docs/TestingStrategy.md`, etc.
- **Pros**:
  - Shorter individual Markdown files.
- **Cons**:
  - Requires re-scaffolding Docusaurus sidebar structure, rewriting `prepare-site-docs.mjs`, updating `check-scaffold.mjs`, and modifying GitHub Actions paths.
  - Desynchronizes repository reading experience from the website.
  - Rejected in favor of Approach A.

---

## 5. Architectural & Implementation Details Decided

### A. User Guide Structure (`docs/UserGuide.md`)
1. **Introduction & Quick Start**: Product overview, key benefits, system requirements (modern web browser with JavaScript enabled), and interface layout overview (Header, Navigation, Workspace, Footer).
2. **Account Management & Settings**: Registration, Email confirmation flow, Sign in (Email or unique username), Password recovery via reset link, Profile customization (username update), Theme toggle (Light/Dark mode).
3. **Course Workspaces**: Course concept, Enrolling via Student Join Code, Navigating active vs. archived courses.
4. **Student User Journey**:
   - Course Dashboard & Assignment Browsing (filtering by language, deadline, status).
   - In-Browser Coding: Monaco/custom editor, keyboard shortcuts, UTF-8 limit (8,000 characters).
   - Local Browser Execution: Running Python (Pyodide) and Java (TeaVM) with custom standard input, viewing stdout/stderr, execution timeouts.
   - Practice Test Verification: Running against instructor-published test cases, diff inspection.
   - Autosave & Browser Draft Recovery: Local draft preservation across sessions/refreshes, restore vs. discard prompts.
   - Submission & Revision History: Submitting solutions, viewing timestamped immutable revision history, side-by-side diff comparison between revisions.
   - AI Learning Feedback: Requesting contextual pedagogical hints and explanations (hints, not direct solutions).
   - Student Progress Dashboard: Visual summary of completed, overdue, and upcoming assignments, total earned XP.
   - Discussions & Forums: Creating discussion threads, replying, keyword search across titles and opening posts.
   - Gamification & Leaderboard: XP earning mechanics, leaderboard rankings (1, 1, 3 tied ranks).
5. **Instructor User Journey**:
   - Course Creation & Management: Title, description, lifecycle management (active, archived).
   - Course Administration & Join Codes: Generating and rotating student join codes, inviting instructors/students by email, removing members.
   - Assignment Authoring: Setting title, instructions, language (Python/Java), deadline with SGT timezone handling, max XP (0–100,000), rubric criteria authoring (levels, points, descriptions).
   - Practice Test Authoring: Creating, editing, saving drafts, and publishing up to 5 public test cases.
   - Submissions Review & Grading: Viewing student submission rosters, inspecting student code revisions, running AI rubric evaluation (advisory criterion scoring), editing scores/feedback, publishing grades.
   - Discussion Moderation: Answering student questions and participating in course threads.
6. **Platform Administrator Journey**:
   - User Role Management: Directory of all system users, promoting/demoting between Student, Instructor, and Admin, last-admin deletion/demotion protection.
   - Read-only Course Oversight: Inspecting course lifecycle and ownership across the platform.
7. **Action Effects & Error Handling Reference**:
   - Matrix of user actions, expected immediate UI feedback (spinners, toasts, disabled buttons), resulting backend mutations, and edge case error recovery.

### B. Developer Guide Structure (`docs/DeveloperGuide.md`)
1. **Setting Up the Development Environment**:
   - Prerequisites (Node.js 24.22.1, pnpm 12.15.0, Docker Desktop with Linux engine).
   - Step-by-step local bootstrap (`pnpm install`, `pnpm db:start`, `pnpm exec supabase migration up --local`, `pnpm dev`).
   - Environment variables breakdown (`.env.local` vs. `.env.example`).
   - Troubleshooting common developer environment issues (occupied ports 54322/54324/3130, Docker socket, HMAC secrets).
2. **System Architecture**:
   - High-level architecture diagram (Mermaid C4/component diagram): Next.js App Router (SSR & Client components), Supabase Database (PostgreSQL + RLS + custom RPCs), Supabase Auth, Sandboxed Browser Execution Runner (Web Workers, Pyodide, TeaVM), SoCLaaS AI Gateway.
   - Design Principles: Separation of Concerns, Defense in Depth, Principle of Least Privilege, Single Responsibility.
   - Design Patterns Applied: CVA (Class Variance Authority) for component variants, Compound Components, Repository/Service pattern for database operations, Adapter pattern for SoCLaaS AI client, Finite State Machine for code execution states.
3. **Component Separation & Interaction Flows**:
   - Sequence diagrams (Mermaid):
     - Code Submission & Revision Snapshot Flow.
     - In-Browser Isolated Code Execution Flow.
     - Instructor Rubric Authoring & AI Evaluation Flow.
     - Student Progress & Anti-Join Query Flow.
4. **Browser-Only Code Execution Design**:
   - Isolation boundary: Opaque iframe, credential-free Web Worker supervisor.
   - Python engine (Pyodide WebAssembly) and Java engine (TeaVM in-browser bytecode compiler + JVM emulator).
   - Security constraints: Resource budgets, execution timeouts, output truncation, zero server-side execution.
5. **AI Architecture & Security Threat Modeling**:
   - Threat Modeling (STRIDE breakdown for AI features).
   - Prompt Injection Mitigations: System/user prompt isolation, untrusted input containment, XML tag sanitization, strict schema validation of model responses.
   - Server-Side Secret Isolation & Quotas: Preflight token budget reservation, atomic usage recording, rate-limiting, zero tool/grade-publishing permissions for LLMs.
6. **Testing Strategy**:
   - Multi-Tier Testing Pyramid: Unit & Component tests (Vitest + React Testing Library), Database Integrity & RLS tests (pgTAP), End-to-End tests (Playwright with synthetic fixtures), AI evaluation (Promptfoo synthetic injection tests + context strategy benchmarks).
   - Gherkin Syntax Feature Scenarios: Concrete BDD specification examples showcasing syntax highlighting.
7. **DevOps, CI/CD, and Environments**:
   - Pipeline architecture: `.github/workflows/application.yml` (multi-job matrix: lint, typecheck, unit, coverage, build, e2e, db-test, codeql), `.github/workflows/pages.yml` (GitHub Pages publication).
   - Environment separation: Development, Preview, Production.
8. **Agentic Software Engineering Reflections**:
   - Multi-Agent SE Workflow: Specialized agent roles (Researcher, Author, Verifier), handoff protocols.
   - Context Engineering: Spec-driven handoffs, measuring token savings and noise reduction.
   - Resource-Aware Tool Use: Bounded tool calls, reproducible evaluation scripts, avoiding wasteful loops.
9. **Formal Acknowledgements**:
   - Full citation of libraries, upstream tools, inspirations (Coursemology), and AI pair-programming frameworks.

### C. Docusaurus & Theme Enhancements
1. **Mermaid Diagram Support**:
   - Add `@docusaurus/theme-mermaid` to `website/package.json`.
   - Update `website/docusaurus.config.js`:
     - `markdown: { mermaid: true }`
     - `themes: ['@docusaurus/theme-mermaid']`
2. **Prism Syntax Highlighting**:
   - Update `themeConfig.prism.additionalLanguages` to `['gherkin', 'java', 'python', 'bash', 'json', 'sql']`.
3. **Color Palette Alignment**:
   - Update `website/src/css/custom.css` to match CodeLeet's slate colors (`#0f172a`, `#334155`, `#64748b`, `#f8fafc`, `#09090b`).
4. **Documentation Sync Script (`workflow/scripts/prepare-site-docs.mjs`)**:
   - Support image paths: Ensure `docs/images/user-guide/` images are copied to `website/static/img/user-guide/` or that image paths are resolved cleanly without throwing relative link errors.

### D. Automated Screenshot Generation
1. Create `workflow/scripts/capture-user-guide-screenshots.mjs`.
2. Using Playwright:
   - Ensure local dev server (`http://localhost:3000`) and Supabase are up.
   - Sign in as `student01@codeleet.test` (password `password`):
     - Welcome page / Sign in page.
     - Student Courses dashboard.
     - Student Course Assignments list (CS101 Python, CS102 Java).
     - Student Code Editor (Monaco/syntax highlighter, custom stdin input, execution output).
     - Test Cases run results (Passed / Failed status).
     - Browser Draft autosave indicator.
     - Submissions history & Revision diff comparison modal.
     - AI Feedback request & response.
     - Student Progress Dashboard (metrics, upcoming assignments, recent activity).
     - Course Discussion Forum & Search.
     - Course Leaderboard & XP rank.
     - Profile settings.
   - Sign in as `instructor1@codeleet.test` (password `password`):
     - Instructor Courses dashboard & Course creation.
     - Course Administration: Manage Users, Student Join Code generation/copy.
     - Assignment Authoring: Details, deadline, max XP, rubric criteria builder.
     - Practice Test Authoring: Public test cases creator.
     - Submissions Review: Student submissions list, individual review with AI rubric evaluation and grade publication.
   - Sign in as `admin@codeleet.test` (password `password`):
     - Admin User Roles directory: user table, role promotion/demotion.
   - Store all captured images in `docs/images/user-guide/` and copy to `website/static/img/user-guide/`.

---

## 6. What's Left to the Builder

- The exact Playwright selectors and timing delays for capturing crisp screenshots.
- The detailed drafting of each prose section in `docs/UserGuide.md` and `docs/DeveloperGuide.md`.
- Exact CSS variable tuning for Docusaurus light/dark themes to harmonize with the Next.js app styles.
- Verification that all commands (`pnpm check:scaffold`, `pnpm site:build`, `pnpm format:check`, `pnpm lint`, `pnpm typecheck`) succeed.
