# Proposal

## Why

The grading-sensitive guide audit found claims that do not match the current application. Issue [#179](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/179) tracks a documentation-only correction requested on 13 November 2026; application findings are deferred.

## What Changes

- Correct the User Guide's role matrix, displayed fields, timestamps, revision filters, grading controls and feedback states against current source.
- Correct the Developer Guide's bundled Python version and private-rubric access boundary.
- Add concise instructions for existing course lifecycle, personal AI Usage and administrator directory controls.
- Retain a source-to-claim checklist and actual verification in the dated session summary, then publish a PR to `develop` from `docs/reconcile-verified-guides`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This corrects documentation under the existing engineering-and-delivery accurate-artifacts requirement without changing product requirements. `skip_specs: true` explicitly records the documentation-only scope.

## Impact

Only `docs/UserGuide.md`, `docs/DeveloperGuide.md`, this OpenSpec change and its dated `logs/` summary. No application code, database migrations, dependencies, images or deployment configuration changes. Human review and hosted acceptance remain separate.
