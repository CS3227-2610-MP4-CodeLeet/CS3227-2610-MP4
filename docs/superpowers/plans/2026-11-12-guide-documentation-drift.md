# Guide Documentation Drift Correction Plan

> **For agentic workers:** Follow the active `build-programming-platform` OpenSpec task 6.3 and repository instructions. This is a documentation-only correction; no application behavior changes are in scope.

**Goal:** Make the User Guide and Developer Guide describe behavior supported by current source, migrations, configuration, evaluation artifacts, or requester-confirmed deployment facts.

**Architecture:** Keep the guide structure and correct affected passages in place. Preserve requester-confirmed administrator contact and deployment URLs, distinguish local browser execution from server/provider data flows, and qualify claims whose evidence is an offline estimate or source inspection.

**Tech Stack:** Markdown, Next.js/React application source, Supabase migrations, workflow/evaluation evidence.

**Spec:** `openspec/changes/build-programming-platform/tasks.md`, task 6.3.

## Global Constraints

- Preserve the user-confirmed administrator contact.
- Document `develop` on Vercel Preview at `https://dev-cs3227-mp4.johnwz123.me/` and `master` on Vercel Production at `https://cs3227-mp4.vercel.app/`.
- Keep hosted acceptance, provider-specific verification, human review, and release sign-off distinct from deployment existence.
- Do not claim that submitted source remains on-device when it is submitted or sent for AI review.
- Do not broaden experiment results beyond their recorded synthetic inputs, estimators, and checks.
- Do not mark OpenSpec task 6.3 complete; its reflections and acknowledgements portions remain outside this task.

## Review Focus

- Role matrix entries must match route and database membership checks.
- Join-code shape, storage, and feature-setting storage must match their routes and schema.
- API paths and request/database fields must match the current contracts.
- Test-case visibility and revision comparison descriptions must match data loading and rendering.
- Runtime, AI, and benchmark statements must distinguish observed implementation from guarantees or estimates.
- Production deployment facts must not be conflated with acceptance or release status.

---

### Task 1: Correct user-facing behavior and data-flow claims

**Files:**
- Modify: `docs/UserGuide.md`

- [x] Correct username validation, course-role access, feature-switch model, join-code details, test-case publication, revision comparison, and execution/privacy wording against current source.
- [x] Correct action-matrix storage destinations and statuses where they name implementation details.
- [ ] Preserve user-confirmed contact information and otherwise accurate workflows.

### Task 2: Correct developer architecture and evidence claims

**Files:**
- Modify: `docs/DeveloperGuide.md`

- [x] Replace stale paths, editor/runtime names, API contracts, and data-model details with current implementation.
- [x] Describe progress, grading, XP, and AI flows at the actual server/database boundaries.
- [x] Qualify browser security, context-evaluation, development-context, testing, and production deployment claims.
- [x] Record the confirmed Vercel Preview and Production branch mappings and retain separate acceptance gates.

### Task 3: Record the work and verify documentation

**Files:**
- Modify: `logs/2026-11-12-documentation-drift-correction.md`

- [x] Record prompts, decisions, issue/OpenSpec/branch links, files, actual checks, unavailable tooling, and human-verification status.
- [x] Run applicable Markdown/link/format checks and `git diff --check`; report failures and limits accurately.
