# Test Coverage and Dependency Updates Design

## Goal

Enforce a useful Vitest coverage floor, report coverage on pull requests, and configure Dependabot for the repository's pnpm workspace and GitHub Actions.

## Current State

- `vitest.config.ts` selects `src/**/*.test.{ts,tsx}` and `tests/unit/**/*.test.{ts,tsx}` but has no coverage provider, source include/exclude list, reporters, or thresholds.
- `package.json` pins Vitest 5.0.5; the matching V8 coverage provider is not currently installed.
- `.github/workflows/application.yml` runs unit tests in the `application` job. Workflow-level permissions are read-only.
- `.github/dependabot.yml` does not exist.
- Existing OpenSpec changes cover product and issue-process work, not test coverage or dependency automation.

## Design

1. Add the Vitest V8 coverage provider at the existing Vitest version and run unit tests with coverage in CI. Generate `text`, `json-summary`, and `json` reports. Limit measured files to maintained application source under `src/`; exclude test files, generated output, runtime distributions, and the separate `src/runtime-lab/` browser-only runner implementation. Its worker explicitly must never be imported by Node, so it stays outside the Vitest coverage process. Use React Testing Library with jsdom for user-facing component behavior that needs a DOM, on a per-test basis.
2. Enforce repository-wide minimums of 80% statements, lines, and functions, and 70% branches. These are proposed maintainable floors, not a claim that a percentage proves test quality. Add behavior-focused tests for uncovered application paths until the configured gate passes; do not inflate the result with tests of mocks or generated code.
3. Upload the coverage JSON as a workflow artifact even when tests fail. Add a separate PR reporting job that downloads the artifact and uses `davelosert/vitest-coverage-report-action@v2`. Grant `contents: read` and `pull-requests: write` only to that job. Fork PRs may not receive a comment because GitHub restricts write tokens for fork-triggered `pull_request` workflows; keep test execution on the read-only job.
4. Add weekly Dependabot version updates for the root pnpm workspace (GitHub's `npm` ecosystem) and GitHub Actions, grouping compatible updates to keep PR volume manageable. GitHub's 20 October 2026 announcement confirms pnpm 12 version updates work, but its dependency graph does not yet detect packages in pnpm 12's default two-document lockfile. This repository's `pnpm-lock.yaml` has two YAML documents, so version updates can work while Dependabot alerts and security update PRs for pnpm dependencies remain unavailable. Repository settings still control whether eligible alerts and security updates are enabled.

## Verification

- Run the coverage-enabled unit suite and confirm all four thresholds pass.
- Inspect generated summary and file reports, including uncovered-line details.
- Validate workflow and Dependabot YAML, run the existing application checks, and confirm only intended files are changed.
- Hosted PR-comment behavior and Dependabot-created PRs can only be confirmed after the change is pushed and GitHub processes it.

## Research

- Google describes 60% as acceptable, 75% as commendable, and 90% as exemplary, while warning there is no universal ideal and coverage is not a measure of test quality: <https://testing.googleblog.com/2020/08/code-coverage-best-practices.html>
- Vitest supports V8 coverage, configurable thresholds, and report formats: <https://vitest.dev/guide/coverage.html>
- The runtime worker source explicitly forbids Node imports; browser runtime code remains a separate test boundary (`src/runtime-lab/worker.mjs`, `docs/DeveloperGuide.md`).
- The proposed reporter requires `json-summary`; PR comments need `pull-requests: write`: <https://github.com/davelosert/vitest-coverage-report-action>
- GitHub documents `npm` as the ecosystem for pnpm and `github-actions` for workflow updates: <https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference>
- GitHub's 20 October 2026 changelog confirms pnpm 12 version updates and the multi-document lockfile dependency-graph limitation: <https://github.blog/changelog/2026-10-20-dependabot-now-supports-npm-12-pnpm-11-and-12-and-bun-1-4/>
