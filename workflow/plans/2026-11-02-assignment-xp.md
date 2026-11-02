# Assignment XP implementation plan

Issue #77; branch `feat/assignment-xp` from develop `00ae158`. [Approved design](2026-11-02-assignment-xp-design.md), requester approval 2 November 2026. Inline implementation with failing-first tests and a separate bounded review; no leaderboard, dependencies, real data or provider calls.

- [x] Persistence: additive max_xp, private publication score basis, current own awards and immutable client-facing audit deltas. Wrap existing grade RPC in a private-core/public-authorized operation that locks the assignment before grading. Serialize grade/rubric/maximum edits in assignment-first lock order; compute best published fraction with deterministic ties, floor XP, and record only changed amounts.
- [x] Assignment API/UI: a new XP-aware RPC delegates existing language/deadline/version validation without changing old RPC signatures. Optional API maxXp preserves legacy clients; required UI Maximum XP with explicit zero allowed. XP edits recalculate awards transactionally.
- [x] Student UI/API: own total as a decimal string and paged source-free assignment award projection under RLS; hidden assignment titles stay hidden. Add My XP route/navigation with safe error/empty/mobile/theme behavior; no peer grades/rubrics/source.
- [x] Security/regressions: fractional/zero/cap, best revision, corrections/unpublish, same-amount republish, max edits, rubric snapshots, legacy review, rollback and concurrent publication/XP edits; forged direct writes and private-core invocation denied.
- [x] Review and verify unit/DB/browser/build/format/lint/types/spec/scaffold; update guides/logs/rollout evidence. Existing grades earn only after review/republishing; no destructive local reset.
- [x] Focused verified commits, branch CI then linked PR to develop; wait final-head checks. Human/hosted acceptance remains separate.

PR #79: branch CI 41389980044 and initial PR-head CI 41402012554 passed; documentation closeout head is checked separately in the PR. Local browser evidence exercises authenticated XP/runtime paths that CI skips without local credentials. Human/hosted verification remains pending.
