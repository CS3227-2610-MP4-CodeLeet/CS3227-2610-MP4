# Local development defaults

Issue #25, refs #23; branch refactor/local-development-defaults from develop plus prerequisite PR #24 (d49ae68). Active OpenSpec group 11. Execute inline without specialist delegation. Preserve unrelated edits and all remaining local environment values.

The requester clarified real accounts/assignments plus automatic local Run code, not permanent sample data. Remove both student preview flags. Use development mode alone for the existing loopback runner, preserving production denial. Move synthetic assignment selection to `PLAYWRIGHT_ASSIGNMENT_FIXTURES=true` exclusively for UI tests; production rejects it. Optional standalone test-case examples keep their own explicit fixture flag and remain clearly labelled. The static runtime server/assets are still separate prerequisites, and remote deployment remains teammate-owned.

- [x] Add failing default-runner and example-adapter tests; update test harness selection and expectations.
- [x] Replace application flag reads, remove obsolete environment entries/comments while preserving values, update current setup guides/specs.
- [x] Verify unit/static/build, real local Python/Java/own-history flows, synthetic UI tests and production denial. Record actual evidence, push and create a PR to develop with explicit #24 dependency. No merge/deployment.

PR: [#26](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/pull/26); rebased onto merged develop 3263914. Human verification pending.
