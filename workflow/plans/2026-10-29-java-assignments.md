# Java assignments and revisions

Issue #17, refs #5; branch `feat/java-assignments` created from `origin/develop` and fast-forwarded to prerequisite PR #16 head e92628f. New PR targets develop and must identify that dependency until it merges. Active OpenSpec: build-programming-platform, task group 8.

Keep the existing 8,000-character submission contract and server-derived identity/revision/request-id behavior. Add an explicit Python/Java assignment field (default Python for old payloads), pass it through instructor RPCs, and preserve the selected language in the real editor/browser runner and AI context. Persist each revision's language from its assignment, never a client-supplied claim. Backfill existing revisions from their assignments using a forward migration, without a database reset. Prevent changing assignment language once any submission exists. Retain existing ownership/private-rubric/draft-grade RLS.

Use existing row/advisory locks and grants. A seven-argument save_assignment overload reuses the validated six-argument function and changes language atomically; old callers remain compatible. Internal invoker triggers derive revision language and block reassignment after submissions. Replace submit_code's Python-only check while preserving all its guards. Do not run student Java in Node or add a remote execution service. Production browser-runtime hosting remains a separate gate.

- [ ] Write failing contract/context tests and Java browser scenarios; add database privacy/idempotency/language tests.
- [ ] Implement and apply the forward migration to local Supabase, verify backfill/count preservation and pgTAP. Do not reset existing accounts/data.
- [ ] Implement language selection, data/API projection, shared editor/runner and history/AI context; reject unsupported/forged language values and surface locked-language changes.
- [ ] Verify real Python/Java creation/run/submission/history, two-student privacy and RPC restrictions, regression checks and final build. Update current guides and summary; record actual review/hosting limits.
- [ ] Commit/push focused changes and create a PR to develop linked to #17/#5, OpenSpec and log. Keep PR #16 dependency explicit; no merge/deployment.
