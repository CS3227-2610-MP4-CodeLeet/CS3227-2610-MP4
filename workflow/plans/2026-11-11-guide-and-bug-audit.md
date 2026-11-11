# Current product and guide audit

Issue: [#148](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/148). Active OpenSpec change: `openspec/changes/build-programming-platform`.

## Scope and decision

Audit current merged `develop` behavior against both canonical guides, route/component source, tests and build configuration. Repair confirmed documentation defects. A product-code fix requires a reproducible symptom and failing regression test first; passing suites alone cannot prove there are no bugs. Keep hosted mail, live AI, production runner and release claims limited to recorded evidence. The canonical guides remain in `docs/`; the website build regenerates its copies.

The alternative of rewriting the guides from the assignment brief would introduce unsupported claims and lose working instructions. The alternative of leaving all historical caveats inline makes the User Guide hard to use. Keep user actions first in the User Guide, move technical contracts to the Developer Guide, and retain concise links to historical evidence.

## Tasks

1. Establish a current `develop` baseline and run unit, build, website, scaffold and browser checks; record prerequisites and skips.
2. Compare guide claims against implemented routes, labels, feature switches and setup scripts. Fix confirmed copy, navigation and structure defects without changing behavior.
3. Investigate any product defect surfaced by tests or source review; write a failing reproduction before a focused fix.
4. Verify both guides, generated Pages build, link targets, lint/type/format/unit/OpenSpec and applicable browser checks. Record results and limits in a dated log.
5. Commit focused changes, push the issue-linked branch, open a PR to `develop` and verify final-head checks. Leave merge and release to the teammate.
