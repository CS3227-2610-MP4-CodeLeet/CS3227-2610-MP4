# Pull Request Coverage Reporting Implementation Plan

> **For agentic workers:** This plan is complete; checkboxes record verified work.

**Goal:** Publish Vitest coverage summaries on eligible GitHub pull requests.

**Architecture:** Keep application permissions read-only. Generate coverage even after test failures, copy the tested Vitest config into the artifact as inert text for the action's threshold display, then let a separate same-repository PR job download reports and invoke `davelosert/vitest-coverage-report-action@v2`. The reporter checks out only the trusted base revision and never executes PR code.

**Tech Stack:** GitHub Actions, `actions/upload-artifact@v4`, `actions/download-artifact@v4`, `davelosert/vitest-coverage-report-action@v2`.

**Spec:** [Approved design](../specs/2026-11-01-test-coverage-and-dependency-updates-design.md)

## Global Constraints

- Keep the application job's GitHub token read-only; grant `pull-requests: write` only to the reporter job.
- Do not check out or execute PR code in the reporter job. The reporter reads the uploaded Vitest config as text to display the tested thresholds.
- Keep coverage artifacts limited to Vitest JSON output and the Vitest config; do not upload secrets or runtime distributions.
- A fork PR skips the reporter job because its token cannot write comments.
- Hosted comment behavior remains pending until a PR run demonstrates it.

## Review Focus

- Tests fail after coverage is generated: `reportOnFailure`, the `always()` upload preparation, and reporter-job gate preserve the report.
- Tests fail before coverage starts or reports are missing: upload is skipped and reporter job condition is false.
- Fork-originated PRs: reporter is skipped before the write-token call.
- Artifact paths: uploaded files are all rooted under `coverage/`; download paths match the action's inputs.
- Permission scope: only the reporting job gets comment-write permission.

---

### Task 1: Add isolated coverage comment job

**Files:**
- Modify: `.github/workflows/application.yml`

**Interfaces:**
- Consumes: artifact `vitest-coverage` with `coverage/coverage-summary.json`, `coverage/coverage-final.json`, and `coverage/vitest.config.ts`.
- Produces: a summary comment for each eligible same-repository pull request with coverage JSON available.

- [x] Run the coverage-enabled unit suite and upload its JSON reports after success or failure when both reports exist; include the tested config as text so the reporter can show its thresholds.
- [x] Add a `coverage-report` job that runs with `always()` only for same-repository PRs when the application job uploaded the artifact.
- [x] Set reporter-job permissions to `contents: read` and `pull-requests: write`; application job retains read-only workflow permissions.
- [x] Download the artifact and run `davelosert/vitest-coverage-report-action@v2` with summary, full JSON, and config paths; set `file-coverage-mode: none` because the JSON is stored under the nested coverage directory and the report requested is aggregate summary.
- [x] Review success, failed-test, missing-report, and fork-PR conditions statically. These conditions were not exercised in a hosted Actions run.
- [x] Validate YAML formatting and run repository checks plus `git diff --check`.
- [x] Commit the workflow change as `ci: report Vitest coverage on pull requests`.