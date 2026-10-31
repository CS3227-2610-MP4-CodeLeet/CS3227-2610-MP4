# Vercel Browser Runner Implementation Plan

> **For agentic workers:** execute inline in this session; do not delegate specialist work.

**Goal:** Let authenticated students run their assignment source and instructors run an authorized submission in Vercel Preview and Production using browser-only Pyodide and TeaVM.

**Tracking:** [Issue #31](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/31); active OpenSpec change `build-programming-platform`; branch `feat/31-vercel-browser-runner`; [dated summary](../../logs/2026-10-31-vercel-browser-runner.md); draft [PR #32](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/pull/32).

**Architecture:** Add a second Vercel project from this repository that builds and serves only versioned static runner files and verified runtime assets. The app passes its matching environment's runner origin to the existing browser bridge; the static bridge accepts only app project deployment origins and retains the opaque sandbox/worker boundary. Add the existing runner UI to the instructor's owner-authorized submission review page. Keep runtime code and submitted source out of Next.js server execution and Vercel Functions.

**Tech Stack:** Next.js 16 App Router, TypeScript, Node build script, Vercel static output, Pyodide, TeaVM-javac, Vitest, Playwright.

**Spec:** `openspec/changes/build-programming-platform/specs/browser-code-execution/spec.md`; design decision in `openspec/changes/build-programming-platform/design.md`.

## Global Constraints

- Node.js 24 and pnpm 12 are pinned by the repository.
- Python execution and Java compilation/execution stay entirely in the browser; never run submitted source in Next.js/Node, a Vercel Function, or a remote execution service.
- The static runner has no application secrets or database access, uses an exact Vercel app project/owner allowlist, and keeps `unsafe-eval` out of authenticated app pages.
- Runtime assets are versioned, fetched only at build time from reviewed sources, checked against recorded SHA-256 values, lazy-loaded in a worker, and shipped with retained notices.
- Student runs and instructor review runs never submit source/results, publish grades, or award XP.
- Preserve existing source, input/output, message, deadline, stop/unmount, output, and Java compatibility limits.
- Preserve the unrelated `next-env.d.ts` edit in the original checkout.

## Review Focus

- A Preview/Production app origin that does not match the selected Vercel project/owner must be rejected before a run starts.
- A missing or malformed runner origin must fail closed with actionable UI; it must never fall back to server execution or another runtime host.
- Runner asset, iframe, and bootstrap requests must omit cookies/credentials; only public, hash-verified static bytes are sent to the browser.
- Instructor execution must use only the source already authorized for that submission and must not mutate grade/submission state.
- Branch deployments with Vercel preview protection enabled for the static runner must be documented and verified because an auth wall inside the iframe prevents runner initialization.

## Files to Create or Modify

- `src/features/student-submissions/browser-client.ts`: configured runner origin, strict bridge matching, credentials-free bootstrap/asset requests if used by the final design.
- `src/features/student-submissions/runner-environment.ts`: server-side Preview/Production/local origin resolution and validation.
- `src/app/student/assignments/[assignmentId]/page.tsx`: pass the resolved runner origin to student practice UI.
- `src/app/instructor/submissions/[submissionId]/page.tsx`: add shared runner for the selected owner-authorized submission source/language.
- `src/features/student-submissions/assignment-practice.tsx`, `practice-runner.tsx`: shared runner configuration and accurate hosted/browser status copy.
- `src/runtime-lab/embed.mjs` and static config/build scripts: enforce exact app parent origin patterns and publish reviewed immutable runtime artifacts.
- `tests/`: origin/build configuration, bridge trust, student and instructor run behavior, plus browser boundary regression coverage.
- `workflow/evidence/runtime-feasibility/`: retained notices and refreshed provenance/security evidence only when verified.
- `openspec/changes/build-programming-platform/`: browser execution spec, design and task group 13.
- `workflow/plans/2026-10-31-vercel-browser-runner.md`, `workflow/plans/2026-10-31-vercel-runner-setup.md`, and `logs/2026-10-31-vercel-browser-runner.md`.

## Task 1: Pin the runner deployment contract

**Files:** OpenSpec browser execution spec/design/tasks; `workflow/plans/2026-10-31-vercel-runner-setup.md`; tests for origin resolver.

- [ ] Define the static Vercel output contract and explicit Preview/Production origins.
- [ ] Define exact Vercel project/owner host matching for deployment and branch URLs; reject non-Vercel, wrong-project and wrong-owner hosts.
- [ ] Write failing tests for Preview branch resolution, Production explicit origin, local origin, invalid protocol/host, deployment URL pattern and unrelated Vercel tenants.
- [ ] Run those tests to confirm the expected failures before implementation.

## Task 2: Build the Vercel static runner artifact

**Files:** new static runner build script/config, `workflow/evidence/runtime-feasibility/assets.json`, runtime notice files, `.gitignore`, tests.

- [ ] Add a failing test asserting that the build output contains only bridge/runtime static files and preserves the recorded asset hashes/notices.
- [ ] Build a static output directory from the fixed file map; do not add an HTTP execution endpoint or Node server to the Vercel runner project.
- [ ] Fetch reviewed runtime files only when hashes match the committed manifest; missing, changed or unreviewed assets fail the build.
- [ ] Version the output URLs for cache safety and retain required Pyodide, TeaVM and OpenJDK license notices/source references.
- [ ] Run the build-script tests and inspect the resulting output tree/hashes.

## Task 3: Serve runs on the matching deployment origin

**Files:** `runner-environment.ts`, shared runner components/client, student assignment page, Next config/security config, tests.

- [ ] Add failing tests for disabled/malformed/mismatched configuration and for the Preview/Production resolved origin.
- [ ] Resolve localhost to the current local lab in development, Preview to the same-branch static runner URL, and Production to an explicit HTTPS static runner URL.
- [ ] Validate `event.origin`, `event.source`, nonce, protocol, request ID and bounded result payload; use exact runner origin in all parent messages.
- [ ] Keep the runner cross-origin and credential-free, preserve the isolated inner frame/worker and network-deny policy, and lazy-load runtime bytes only after an explicit Run action.
- [ ] Enable student Run code on deployed assignment pages without changing source submission, public tests, grade or XP behavior.
- [ ] Run the targeted unit and browser regression tests.

## Task 4: Add instructor review execution

**Files:** `src/app/instructor/submissions/[submissionId]/page.tsx`, shared runner component, relevant tests.

- [ ] Add failing tests proving the authorized instructor sees Run code for that submission's stored source/language and that no run controls/source appear for unauthorized or missing submissions.
- [ ] Reuse the shared runner on the existing ownership-checked review page; do not create an API, persistence path or alternate runner.
- [ ] Assert run does not call submission/grade write routes or publish/award anything.
- [ ] Run instructor authorization and browser-runner journeys for Python and Java.

## Task 5: Validate and hand off Vercel deployment

**Files:** Vercel setup guide, runtime evidence, dated session log, OpenSpec tasks, PR.

- [ ] Record exact Vercel project root/build/output settings, required nonsecret environment variables, paired branch URL convention and runner Preview deployment protection setting.
- [ ] Run lint/type/unit/build and local browser security regressions, including hostile origin, cookie omission, network-deny, stop/deadline and rerun cases.
- [ ] Run an actual Vercel Preview smoke for both roles/languages and verify no request body/source reaches an app route or function.
- [ ] Run an actual Production smoke only after asset license/provenance and independent security gates are closed; otherwise record it as pending and keep the production gate disabled.
- [ ] Update user guidance only with verified behavior, complete the dated log, publish a PR to `develop` linking issue #31 and retain human verification as pending.
