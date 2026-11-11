## Why

The existing Vitest suite has no measured coverage floor, PR coverage comment, or automated dependency update schedule. Adding these checks now will make test gaps visible during review and keep the repository's pinned JavaScript tooling and GitHub Actions from drifting.

## What Changes

- Collect Vitest V8 coverage for maintained application source and enforce 80% statements, lines, and functions plus 70% branches.
- Add behavior-focused tests for uncovered paths until the thresholds pass.
- Report coverage on eligible pull requests through a separate least-privilege GitHub Actions job using `davelosert/vitest-coverage-report-action@v2`.
- Configure weekly Dependabot version updates for the pnpm workspace and GitHub Actions.
- Document the limits for fork and Dependabot PR comments and pnpm 12 dependency-graph-based security alerts.

## Capabilities

### New Capabilities

None. This is a CI and dependency-maintenance change with no new product behavior.

### Modified Capabilities

None. This change opts out of product specs because it changes tooling only (`skip_specs: true`).

## Impact

- `package.json`, `pnpm-lock.yaml`, and `vitest.config.ts`
- `.github/workflows/application.yml` and `.github/dependabot.yml`
- New behavior tests under current Vitest test locations
- OpenSpec change artifacts, dated `logs/` summary, and the PR linked to issue #57
