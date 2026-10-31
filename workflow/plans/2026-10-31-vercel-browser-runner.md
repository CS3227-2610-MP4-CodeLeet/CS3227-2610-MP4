# Vercel Browser Runner Implementation Plan

> **For agentic workers:** execute inline in this session; do not delegate specialist work.

**Goal:** Let authenticated students run their assignment source and instructors run an authorized submission in Vercel Preview and Production using browser-only Pyodide and TeaVM.

**Tracking:** [Issue #31](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/31); active OpenSpec change `build-programming-platform`; branch `feat/31-vercel-browser-runner`; [dated summary](../../logs/2026-10-31-vercel-browser-runner.md); draft [PR #32](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/pull/32).

**Architecture:** Build versioned static runner files and reviewed runtime assets into `/runtime/` in the existing Next.js project's deployment. The trusted app client fetches those fixed same-origin files, verifies them, and transfers them into a fresh opaque `srcdoc` sandbox (`allow-scripts` only); local development keeps its existing loopback runner. Add the existing runner UI to the instructor's owner-authorized submission review page. Keep runtime code and submitted source out of Next.js server execution and Vercel Functions.

**Tech Stack:** Next.js 16 App Router, TypeScript, Node build script, Vercel static output, Pyodide, TeaVM-javac, Vitest, Playwright.

**Spec:** `openspec/changes/build-programming-platform/specs/browser-code-execution/spec.md`; design decision in `openspec/changes/build-programming-platform/design.md`.

## Global Constraints

- Node.js 24 and pnpm 12 are pinned by the repository.
- Python execution and Java compilation/execution stay entirely in the browser; never run submitted source in Next.js/Node, a Vercel Function, or a remote execution service.
- The hosted runner is same-project static content with no endpoint, secrets or database access. The app CSP stays unchanged; the opaque sandbox owns the narrowly scoped runtime CSP and eval allowance.
- Runtime assets are versioned, fetched only at build time from reviewed sources, checked against recorded SHA-256 values, lazy-loaded in a worker, and shipped with retained notices.
- Student runs and instructor review runs never submit source/results, publish grades, or award XP.
- Preserve existing source, input/output, message, deadline, stop/unmount, output, and Java compatibility limits.
- Preserve the unrelated `next-env.d.ts` edit in the original checkout.

## Review Focus

- Missing/malformed runtime manifests, asset paths, sizes or hashes must fail closed before a run starts.
- An unapproved or unavailable runtime build must show an actionable unavailable state and never fall back to server execution or another runtime host.
- Hosted assets are fetched only through relative same-origin paths and the browser's normal same-deployment session may be used for protected Preview access; no third-party host receives credentials. Only public, hash-verified static bytes cross into the opaque sandbox.
- Instructor execution must use only the source already authorized for that submission and must not mutate grade/submission state.
- Opaque-origin runner messages report `event.origin === "null"`; verify exact iframe source, nonce and run ID, and use `*` only when targeting that exact opaque frame with no secrets.

## Files to Create or Modify

- `src/features/student-submissions/browser-client.ts`: local versus hosted same-project setup, same-origin asset loading, strict opaque-frame bridge checks.
- `src/features/student-submissions/runner-environment.ts`: server-side gate for local loopback and approved same-project hosted builds.
- `src/app/student/assignments/[assignmentId]/page.tsx`: pass the resolved runner origin to student practice UI.
- `src/app/instructor/submissions/[submissionId]/page.tsx`: add shared runner for the selected owner-authorized submission source/language.
- `src/features/student-submissions/assignment-practice.tsx`, `practice-runner.tsx`: shared runner configuration and accurate hosted/browser status copy.
- `src/runtime-lab/lab.mjs`, the `srcdoc` bootstrap in `browser-client.ts`, and static build script: publish reviewed immutable runtime assets and transfer them into an opaque sandbox without iframe asset-network access.
- `tests/`: origin/build configuration, bridge trust, student and instructor run behavior, plus browser boundary regression coverage.
- `workflow/evidence/runtime-feasibility/`: retained notices and refreshed provenance/security evidence only when verified.
- `openspec/changes/build-programming-platform/`: browser execution spec, design and task group 13.
- `workflow/plans/2026-10-31-vercel-browser-runner.md`, `workflow/plans/2026-10-31-vercel-runner-setup.md`, and `logs/2026-10-31-vercel-browser-runner.md`.

## Task 1: Pin the same-project deployment contract

**Files:** OpenSpec browser execution spec/design/tasks; `workflow/plans/2026-10-31-vercel-runner-setup.md`; tests for origin resolver.

- [ ] Define `/runtime/` static output, same-project Preview/Production behavior and the pending/approved distribution gate.
- [ ] Define same-origin fetch behavior under Vercel Preview protection and the opaque `srcdoc` message contract; avoid a runner origin entirely.
- [ ] Write failing tests for unapproved/approved hosted mode, local origin, same-origin asset selection and rejection of nonmatching message sources/nonces.
- [ ] Run those tests to confirm the expected failures before implementation.

## Task 2: Build the app's static runner assets

**Files:** new static runner build script/config, `workflow/evidence/runtime-feasibility/assets.json`, runtime notice files, `.gitignore`, tests.

- [ ] Add a failing test asserting that the build output contains only bridge/runtime static files and preserves the recorded asset hashes/notices.
- [ ] Stage only into `public/runtime/`; when distribution approval is pending, clear/omit generated runtime bytes without failing the normal app deployment.
- [ ] When approval is enabled, fetch reviewed runtime files only when hashes match the committed manifest; missing, changed or incomplete notices fail the app build.
- [ ] Version output URLs for immutable caching and retain all required Pyodide, TeaVM and OpenJDK license notices/source references.
- [ ] Run the build-script tests and inspect the resulting output tree/hashes.

## Task 3: Serve runs from the matching app deployment

**Files:** `runner-environment.ts`, shared runner components/client, student assignment page, Next config/security config, tests.

- [ ] Add failing tests for disabled/malformed/mismatched configuration and for the Preview/Production resolved origin.
- [ ] Resolve localhost to the current local lab in development and use hosted same-project mode only when the distribution approval gate is on.
- [ ] Validate child `event.origin === "null"`, exact `event.source`, nonce, protocol, request ID and bounded result payload; use `*` only for the specific opaque child frame.
- [ ] Fetch static bytes from relative same-origin paths in the trusted parent, verify size/hash, and transfer bytes to the sandbox only after explicit Run; never send source in an HTTP request.
- [ ] Keep app CSP unchanged, remove `allow-same-origin` from the hosted iframe, and preserve the isolated worker/network-deny policy.
- [ ] Enable student Run code on deployed assignment pages without changing source submission, public tests, grade or XP behavior.
- [ ] Run the targeted unit and browser regression tests.

## Task 4: Add instructor review execution

**Files:** `src/app/instructor/submissions/[submissionId]/page.tsx`, shared runner component, relevant tests.

- [ ] Add failing tests proving the authorized instructor sees Run code for that submission's stored source/language and that no run controls/source appear for unauthorized or missing submissions.
- [ ] Reuse the shared runner on the existing ownership-checked review page; do not create an API, persistence path or alternate runner.
- [ ] Assert run does not call submission/grade write routes or publish/award anything.
- [ ] Run instructor authorization and browser-runner journeys for Python and Java.

## Task 5: Validate and hand off the Vercel app deployment

**Files:** Vercel setup guide, runtime evidence, dated session log, OpenSpec tasks, PR.

- [ ] Record the app project's existing root/build settings and the single nonsecret distribution approval flag; no runner project/origin pairing is configured.
- [ ] Run lint/type/unit/build and browser security regressions, including opaque-origin source/nonce checks, same-origin protected Preview asset fetch, network-deny, stop/deadline and rerun cases.
- [ ] Run an actual Vercel Preview smoke for both roles/languages and verify runtime requests are same-deployment static asset GETs with no source in request bodies.
- [ ] Run an actual Production smoke only after asset license/provenance and independent security gates are closed; otherwise record it as pending and keep the production gate disabled.
- [ ] Update user guidance only with verified behavior, complete the dated log, publish a PR to `develop` linking issue #31 and retain human verification as pending.
