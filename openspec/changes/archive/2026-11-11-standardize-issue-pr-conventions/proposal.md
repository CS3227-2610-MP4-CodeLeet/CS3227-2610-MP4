## Why

Issues and pull requests currently lack explicit naming and issue-closing guidance, so titles are inconsistent and merged work may leave its tracking issue open. Documenting a shared Conventional Commit title format and GitHub's closing keyword makes work easier to scan and closes linked issues automatically when merged to the repository's default branch.

## What Changes

- Document the Conventional Commit title format for issues and pull requests, using the repository's existing supported types.
- Add a `Closes #<issue-number>` placeholder and replacement guidance to the pull request template.
- Update the open admin-role pull request to use the closing keyword for issue #33.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This is a documentation and workflow-template change with no behavior requirement changes; the change opts out of specs in `.openspec.yaml`.

## Impact

- `CONTRIBUTING.md`
- `.github/pull_request_template.md`
- Open PR #34 body and new documentation PR metadata
- OpenSpec artifacts and the dated session summary
