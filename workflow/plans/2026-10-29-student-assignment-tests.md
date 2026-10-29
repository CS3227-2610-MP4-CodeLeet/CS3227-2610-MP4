# Student assignment tests implementation plan

Issue [#19](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/19), refs #5. Branch `feat/student-assignment-tests` from develop f177b7d after #18 merged. Active OpenSpec `build-programming-platform`, task group 9. Execute inline; specialist delegation is not authorized. Preserve the existing generated Next declaration edit.

**Goal:** Prepare the real student editor for practice cases without waiting for teacher persistence or presenting examples as assignment correctness.

**Design:** Keep the existing browser runner and output comparison. A server-only example adapter returns three public sum-of-two-integers cases only when development, the runner flag and the separate fixture flag are all enabled. The client requires an unchecked-by-default explicit example choice and labels its purpose/provenance. Before selection, no tests action appears; after selection, Run tests uses the real editor source. Selection changes remount the runner, cancelling work and clearing old results. Production and flag-off adapters return no cases. Published teacher data is not implemented or simulated.

**Contract/handoff:** `workflow/contracts/published-practice-cases.md` specifies the DTO, limits, ownership and future response boundary; the same handoff is shared in #19. Teammate agreement/implementation remains pending. No message recipient was supplied; sharing means the linked team issue/document, not an invented private handoff.

**Files:** `assignment-practice.server.ts` handles fixture gating/data; its unit test proves default/production denial and bounded cases. `assignment-practice.tsx` owns the example opt-in and runner presentation. `submission-form.tsx` and the assignment page pass only server-approved data. Existing runner/results add example-aware labels without changing execution logic. Extend real Python/Java browser journeys for example success/mismatch/errors/timeouts, stale results and absence of result/grade writes. `.env.example` and guides document opt-in and limitations.

- [x] Write failing gate/browser checks and contract/spec scenarios.
- [x] Implement fixture adapter, explicit opt-in, shared runner labels and real-page integration; verify targeted unit/browser checks.
- [x] Verify flag-off and production denial, both languages, save/history privacy regressions, runtime failure/timeout behavior and static/build checks.
- [ ] Update guides and per-change summary, perform author review with independent review pending, commit/push focused work and create linked PR to develop. No merge or deployment.
