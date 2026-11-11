## Context

See `proposal.md` for the motivation and requested outcomes. `vitest.config.ts` currently discovers unit tests but has no coverage provider, source scope, reporters, or thresholds. The application CI job currently runs `pnpm test:unit` with read-only workflow permissions. `package.json` pins Vitest 5.0.5 and pnpm 12.15.0. The root `pnpm-lock.yaml` contains two YAML documents.

## Goals / Non-Goals

**Goals:**
- Measure maintained application source and enforce the approved global floors: 80% statements, lines, and functions; 70% branches.
- Add tests for meaningful uncovered behaviors rather than manipulating the measured source set.
- Publish a PR coverage summary and changed-file details with least-privilege permissions.
- Configure weekly dependency version updates for pnpm and GitHub Actions.

**Non-Goals:**
- Change application runtime behavior, database schemas, or submitted-code execution.
- Treat coverage percentage as proof of test quality.
- Enable GitHub repository security settings or claim pnpm 12 lockfile dependency-graph security coverage.
- Guarantee coverage comments for fork-originated PRs.

## Decisions

1. **Use the matching V8 provider.** Add `@vitest/coverage-v8` at 5.0.5 to match Vitest 5.0.5. V8 coverage integrates with the project's existing runner without introducing a separate instrumentation model. Use Vitest's `include` and `exclude` configuration to measure maintained application TypeScript, TSX, and MJS source while excluding tests, declarations, generated output, and vendored runtime distributions. Exclude `src/runtime-lab/**` because it is a separate browser-only runner and its worker explicitly must never be imported by Node.
2. **Use explicit coverage reports and global thresholds.** Produce `text`, `json-summary`, and `json` output, with `reportOnFailure: true`. Enforce 80% for statements, lines, and functions and 70% for branches. A per-file threshold or diff-only gate was considered, but the request is for a repository floor and the existing source is unevenly tested; behavior-focused test additions will establish the floor first. Use React Testing Library and jsdom for tests that need DOM interactions, with jsdom enabled only in those test files.
3. **Separate report publication from code execution.** The application job keeps read-only permissions and uploads only the Vitest coverage artifact even if tests fail. A dependent report job runs only for same-repository, non-Dependabot PRs when the summary artifact exists, downloads it, and invokes `davelosert/vitest-coverage-report-action@v2`. The Vitest config is included as inert text in the artifact so the reporter can display the thresholds from the tested revision while checking out only the trusted base revision. Only this job receives `pull-requests: write`; it does not execute PR code. Fork and Dependabot PRs skip the comment step because their workflow token cannot write comments. Changed-file coverage is enabled, with the coverage root set to the path used by the containerized test job.
4. **Use Dependabot's `npm` ecosystem for pnpm.** Configure weekly version updates at `/` for the root pnpm workspace and `github-actions` at `/`. Group npm minor/patch updates and GitHub Actions updates; keep npm major updates separately reviewable. Do not add a Docker ecosystem because the repository has no maintained Docker manifest in scope.
5. **Keep product specs unchanged.** This is tooling and repository maintenance only. `.openspec.yaml` opts out of capability specs rather than inventing product behavior requirements.

## Risks / Trade-offs

- [Coverage can reward superficial test additions] -> Test observable outcomes in maintained code and review assertions for behavior quality; do not require 100% coverage.
- [Global thresholds may expose broad test gaps] -> Measure the baseline first and add focused tests for uncovered behaviors before enabling enforcement.
- [Browser-only runtime code is omitted from the Vitest aggregate] -> Keep runtime execution tests in the browser boundary; do not execute submitted code or import runtime workers in Node merely to inflate unit coverage.
- [Third-party comment action requires a write token] -> Isolate it in a job with only `contents: read` and `pull-requests: write`, and do not check out PR code there.
- [Fork and Dependabot PR comments cannot use the normal write token] -> Skip the reporter job for these actors while preserving read-only tests.
- [pnpm 12 has a two-document lockfile] -> GitHub's 20 October 2026 guidance says Dependabot version updates work, but its dependency graph does not yet detect dependencies from this format; do not claim Dependabot alerts/security PRs cover these dependencies.

## Migration Plan

1. Add coverage collection and inspect the baseline.
2. Add behavior tests until the approved floors pass, then make thresholds fail CI when missed.
3. Add coverage artifact transfer and isolated PR reporting.
4. Add weekly Dependabot version updates.
5. Run the unit suite with coverage, repository checks, and workflow/config validation. Hosted aggregate reporting was verified on PR run #150; changed-file reporting is pending the updated PR run. Dependabot update creation remains pending.

Rollback: revert the feature commits. This change has no data migration or application deployment dependency.

## Open Questions

None. The pnpm 12 dependency-graph limitation is documented and does not block version update configuration.
