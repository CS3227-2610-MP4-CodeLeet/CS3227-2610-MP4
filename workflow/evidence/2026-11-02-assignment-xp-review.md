# Assignment XP — independent review record

Issue [#77](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/77), branch `feat/assignment-xp`, baseline `00ae158`. Coordinator summary of actual messages from `/root/xp_security_review`; human verification pending. Review covered uncommitted implementation, not a hosted release.

The requesting-code-review skill requires a separate reviewer for a major feature. The coordinator supplied the approved design and narrowly scoped migration/API/form/student projection paths to one read-only specialist with a roughly ten-minute initial budget. Follow-ups reused that specialist with bounded eight-, four- and three-minute requests. These are requested limits, not measured durations. No credentials, `.env.local` access, edits, database/service operations, deployment or child delegation were authorized. Implementation and test execution remained with `/root`.

## Findings and dispositions

1. Existing `grades.total_score numeric(7,2)` rounded accepted fractional scores: 1.234/1.234 under-awarded XP, while 1.236 rounded above the rubric maximum and aborted publication. Coordinator reproduced failing database assertions, widened to exact numeric and verified both full-score cases. Existing values are preserved; legacy publications still require review.
2. Widening retained JavaScript addition noise. Full decimal scores could exceed the exact maximum; 0.1 + 0.7 against two one-point criteria could earn 39 instead of 40 XP. Coordinator reproduced failures, retained the mature core's incoming-total validation and then stored the exact numeric sum of rubric-validated criterion scores before snapshot/recomputation. Positive/negative noise and ordinary integer-max partial scores have regressions.
3. Initial canonicalization summed every supplied score key. Legacy assignment validation permits duplicate rubric IDs, allowing an extra key the core did not validate to inflate the sum. Coordinator reproduced two failing assertions, then summed only rubric entries using the same keys/multiplicity as the core. The reported case now stores total 2 and earns 10 rather than 100 XP. This preserves existing validator semantics without inventing a legacy migration policy.
4. Browser tests initially asserted a top-level total instead of the API's `{data: ...}` envelope. Corrected assertions; Python/Java XP journeys then passed. A separate foreign-owner assertion was adjusted to the existing 409 save-conflict contract and verifies stored maximum remains unchanged.

The final focused source review reported the precision/extra-key findings resolved and no remaining concrete defect within that scope. It found no additional privacy, authorization or locking defect. This is bounded review evidence, not exhaustive proof of security.

## Checks and limits

The reviewer inspected source and executed JavaScript arithmetic probes. It **did not** rerun database, browser, unit or build checks and performed no service operations. Coordinator results are recorded in the [session summary](../../logs/2026-11-02-assignment-xp.md), including failing-first regressions and later complete runs.

No matched single-agent baseline, token counts, provider cache-hit measurements or exact model identifier were available. Review produced useful defects and additional test/review overhead; no net speedup or cost saving is claimed. Hosted migration, deployment acceptance and teammate verification remain separate.
