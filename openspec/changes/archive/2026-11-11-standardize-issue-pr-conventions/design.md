## Context

See `proposal.md` for motivation. `CONTRIBUTING.md` already defines the supported Conventional Commit types for branch and commit names, and GitHub uses `develop` as this repository's default branch. The contribution guide and PR template can document the convention without application or database changes.

## Goals / Non-Goals

**Goals:**

- Reuse the supported commit types and title syntax already documented in the repository.
- Make PR authors replace the issue-number placeholder with a real number.
- Use GitHub's closing keyword for PRs targeting the default branch.

**Non-Goals:**

- Change branch or commit naming rules.
- Add automated title or issue-link validation.
- Change product behavior or OpenSpec product requirements.

## Decisions

- Place issue and PR title guidance next to the existing branch and commit naming guidance in `CONTRIBUTING.md`. This keeps one source for the supported types and format rather than duplicating another list.
- Add a dedicated linked-issue section near the top of `.github/pull_request_template.md` with `Closes #<issue-number>` and an HTML comment explaining replacement. This makes the required action visible in every new PR draft while preserving the rest of the template.
- Explain that `Closes` auto-closes issues when a PR is merged to the default branch. This is accurate for this repository's `develop` default and avoids promising the same behavior for PRs targeting another branch.

## Risks / Trade-offs

- [Authors leave the placeholder unchanged or choose a non-default target] → State the replacement step in the template and the default-branch condition in the guide.
- [Documentation drifts from repository configuration] → Keep the title types copied from the existing guide and name the default branch as GitHub's configured default, not as a fixed implementation detail.

## Migration Plan

Update the guide and template, then change the open admin PR body from `Refs #33` to `Closes #33`. No data migration or rollback procedure is required; revert the documentation/template edits and PR body if needed.
