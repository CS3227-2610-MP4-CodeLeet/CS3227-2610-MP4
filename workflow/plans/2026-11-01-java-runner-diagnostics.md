# Java runner diagnostics implementation plan

**Goal:** Explain unsupported Java features clearly without rewriting source or claiming threading is always the cause.

**Issue:** [#46](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/46). **Branch:** `fix/java-runner-diagnostics`, directly from `develop` (`35daede`). **OpenSpec:** `build-programming-platform`, browser-code-execution, task group 19. **PR:** [#47](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/pull/47).

**Execution:** Codex inline; no specialist delegation. The requester approved clearer errors after the supplied Thread.start example failed in the existing browser runtime, while direct Runnable/Thread.run worked.

## Design and alternatives

Use a shared presentation formatter for the existing compiler-error stderr in custom runs and practice-test results. Recognize anchored TeaVM unsupported-target and missing-annotation diagnostics only when the result status is compile-error. Show a concise unsupported-feature explanation, preserve unrelated diagnostics and existing location text, and retain raw results unchanged. Successful program stderr and runtime errors must remain literal. Source is not inspected, rewritten or resubmitted. No threading-specific diagnosis is made from opaque class placeholders. Document actual Thread.start/join/sleep limitations and successful direct Runnable/Thread.run without suggesting semantic equivalence.

Investigation: the pinned compiler exposes only type, severity, fileName, lineNumber and message; unsupported-target messages contain unresolved {{c0}} with no class/method argument data. A browser-only in-memory diagnostic probe confirmed this; upstream's documented API agrees. A UI formatter avoids changing the runtime worker, provenance/hash inventory or binary assets merely to present known failures helpfully. Alternatives rejected: scanning source for Thread.start (comments/strings/unreachable code cause false attribution), silently replacing start with run (changes semantics), upgrading the runtime (separate compatibility/security work).

## Tasks

- [x] Write failing formatting/rendering tests for known failures, ordinary syntax diagnostics, mixed diagnostics and literal successful/runtime stderr.
- [x] Implement the shared formatter in `src/features/student-submissions/runner-error-message.ts` and use it in both result views, preserving raw result/source and current error verdict.
- [x] Verify the supplied nested Runnable example in the real browser UI, direct Runnable success, syntax errors and fake diagnostic text printed by a successful program; retain browser-only execution and existing output limits.
- [x] Run full unit/lint/format, build/types, relevant browser regressions and strict spec/scaffold checks; update verified guides and dated log.
- [x] Commit/push the focused fix and create a labelled PR to develop linking issue/spec/plan/log/checks. Leave independent teammate review and human log verification pending.

## Review focus

1. A program printing diagnostic-like stderr successfully must not be called unsupported.
2. Compiler status/verdict and ordinary syntax/location text must remain intact.
3. Thread/Runnable words in source/comments cannot trigger attribution; formatter receives no source.
4. Both custom runs and published/example test output use the same safe text rendering.
5. Raw bounded results and submitted source remain unchanged; no runtime upgrade or server execution.
