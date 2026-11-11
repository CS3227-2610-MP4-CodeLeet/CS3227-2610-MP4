## 1. Vitest coverage gate

- [x] 1.1 Add `@vitest/coverage-v8` matching Vitest 5.0.5, a coverage test script, V8 provider configuration, maintained application source include/exclude rules (excluding `src/runtime-lab/**`), text and JSON reporters, and `reportOnFailure`.
- [x] 1.2 Run the coverage suite to capture baseline per-file and aggregate results; add behavior-focused tests for uncovered existing code, using React Testing Library/jsdom only where real DOM interaction is needed, until 80% statements, lines, and functions plus 70% branches pass.
- [x] 1.3 Enforce the approved global thresholds and verify the coverage-enabled unit suite, lint, typecheck, and diff checks.

## 2. Pull request coverage comment

- [x] 2.1 Upload coverage reports from the application job even when tests fail, and expose whether a summary artifact exists.
- [x] 2.2 Add a same-repository, non-Dependabot PR reporting job using `davelosert/vitest-coverage-report-action@v2`, with write permission limited to that job and no PR checkout.
- [x] 2.3 Validate success, failed-test, missing-artifact, fork-PR, and Dependabot-PR workflow conditions; confirm the workflow YAML and existing checks.

## 3. Dependabot version updates

- [x] 3.1 Add weekly root pnpm (`npm` ecosystem) and GitHub Actions update entries, grouping minor/patch npm updates and compatible action updates.
- [x] 3.2 Validate the configuration against repository manifests and record that pnpm 12 version updates are supported while the two-document lockfile prevents dependency-graph alerts/security PRs.

## 4. Tracking and closeout

- [x] 4.1 Maintain `logs/2026-11-01-test-coverage-dependabot.md` with chronological interactions, actual participants, changes, checks, failures, and limits.
- [x] 4.2 Link issue #57, this OpenSpec change, the branch, log summary, and verification in the PR targeting `develop`; keep human verification pending.
