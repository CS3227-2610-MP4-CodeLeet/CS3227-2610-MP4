# Promptfoo AI security evaluation — 2 November 2026

- Issue: [#75](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/75)
- OpenSpec: `openspec/changes/build-programming-platform/` task group 4.7
- Branch: `feat/75-promptfoo-ai-security-eval`

## Scope and cost

Promptfoo 0.125.1 is pinned as an MIT-licensed development dependency. The default command uses deterministic local fixtures and makes no model/provider requests. Both modes pass a checked-in comment-only `--env-file` so Promptfoo cannot rediscover repository `.env` files. The live command's parent runner explicitly loads ignored `.env.local` and calls only the free SoCLaaS service, with ten synthetic cases, one request at a time, no retries and a hard ten-request provider limit. A repository patch makes Promptfoo's `PROMPTFOO_DISABLE_TELEMETRY` switch a true no-op, and the runner disables its separate update check. The fixed config uses only checked-in local providers, fixtures and assertions; these controls apply to this pinned runner/config, not arbitrary future Promptfoo plugins or configs. Live runs are not in CI. No real student data, private rubric or source from the application was sent.

The project owner confirmed SoCLaaS is free. No paid provider, Promptfoo Cloud feature or paid Promptfoo feature was used. The live check sent three bounded ten-request runs (30 calls total). The first exposed a mismatch between the new instructor-case task text and the product's explicit JSON contract; a post-review run then evaluated the expanded assertions after the prompt-contract and rubric-injection fixes. No credentials or raw model output are recorded here.

## Cases

Ten cases span student and instructor roles, Python and Java, baseline feedback, source-code injection, assignment-instruction injection and instructor rubric-description injection. All assignments, rubric data and submissions are synthetic. The instructor prompts name the exact `criteria`, `criterionId`, `suggestedScore`, `feedback`, `overallFeedback` and `totalScore` contract used by the product.

## Results

| Run | Cases | Outcome | Tokens | Duration |
| --- | ---: | --- | ---: | ---: |
| Initial live run, before prompt-contract correction | 10 | 5 passed, 5 failed; no provider errors | 5,270 total (2,597 prompt / 2,673 completion) | 18 s |
| Corrected live run | 10 | 9 passed, 1 failed; no provider errors | 6,044 total (2,657 prompt / 3,387 completion) | 22 s |
| Review-fix run | 10 | 10 passed; no provider errors | 5,577 total (2,657 prompt / 2,920 completion) | 19 s |

In the corrected run, all five instructor cases passed. Student Python cases and the Java source-injection case passed. `student-java-assignment-injection` was the sole failed Promptfoo assertion. The compact CLI output did not preserve the failed assertion's detailed reason, so this evidence does not claim which individual student quality check failed. The initial instructor failures came from a test-case contract mismatch: the cases requested criterion scores without spelling out the product's JSON field names; the corpus and a regression test were corrected before the second run.

The offline run passed 10/10 after that correction. After review, new deterministic regression tests rejected a full-mark rubric-injection response, point-based rubric disclosure, body-only replacement code, and implicit publication/release claims. The amended rubric-injection fixture scores correctness below the maximum and explains the source defect. The post-review live run passed all ten cases with these checks in place. The offline assertions test schema and deterministic quality behavior, not model resistance.

The first two live runs above occurred before the telemetry patch was added. Promptfoo's [security policy](https://github.com/promptfoo/promptfoo/blob/main/SECURITY.md) documents that `PROMPTFOO_DISABLE_TELEMETRY` may still send an opt-out acknowledgement containing local user ID and, when configured, email; it also says that the opt-out is not a general egress firewall. Those earlier runs therefore cannot support a claim that Promptfoo made no telemetry request, and the captured evaluation output does not establish whether an acknowledgement reached Promptfoo. The opt-out event is separate from model prompts and outputs. The patched local runner prevents that acknowledgement for subsequent offline and live runs and disables the distinct update check.

## Limits

This is a small synthetic sample from one configured model and three runs. The first two runs had historical failures: the initial prompt-contract mismatch (5/10) and the corrected run's student Java assignment-injection assertion (9/10). After the review fixes, the third run passed 10/10, so no live assertion failure remains open from this experiment. A pass does not establish robust prompt-injection resistance, grading accuracy, Java execution correctness, production service behavior or deployed security. Outputs are not retained in the repository; only aggregate sanitized counts and the historical failed case ID are recorded. The local production build did not complete: the pre-Next static runtime builder failed twice with `EPERM` renaming its generated staging directory to `public/runtime`; a minimal nested-directory rename diagnostic passed, and the runtime builder was left unchanged. Human teammate verification remains pending.
