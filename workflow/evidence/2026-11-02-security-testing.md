# Security testing and release evidence — 2 November 2026

Issue: [#70](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/70). Source baseline: `0a26127d583fbeaab3a9a1f33afcc65ee6ca5721` on merged `develop`. OpenSpec: [engineering and delivery](../../openspec/changes/build-programming-platform/specs/engineering-and-delivery/spec.md). This is an evidence audit, not a penetration-test certification or deployed acceptance report. Human verification remains pending.

## Evidence types and results

The [merged baseline application workflow](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/actions/runs/41373536575) completed successfully. Its database job passed **147 assertions across seven pgTAP files**. Its application job passed **80 unit-test files**, runtime/app build and product-site build. Coverage was **82.03% statements, 76.79% branches, 83.97% functions and 83.71% lines**; coverage measures exercised code, not security assurance.

That CI browser run passed **29 tests and skipped 45**. It lacks credentials/opt-ins for many authenticated and actual-runtime journeys. Do not describe it as a complete role or runtime acceptance run. Earlier local deadline integration recorded **67 browser passes/seven skips**, **379 unit tests** and **147 database assertions** in the [deadline summary](../../logs/2026-11-01-assignment-deadlines.md); those are historical observations from a different tree/environment, not fresh runs of this documentation branch.

Fresh checks on this branch are recorded below and in the [session summary](../../logs/2026-11-02-user-guide-security-evidence.md). Existing evidence directories are dated snapshots: later implementation can supersede their architecture/setup statements without invalidating the recorded experiment.

## Threat-to-test map

| Boundary / threat | Inspect or reproduce | What the evidence establishes; limits |
| --- | --- | --- |
| Forged identity/role, peer submissions and private rubrics | [identity tests](../../src/lib/auth/roles.test.ts), [AI route tests](../../src/lib/ai/review-route.test.ts), [database access](../../supabase/tests/database/accounts_and_access.test.sql), [MVP database assertions](../../supabase/tests/database/codementor_mvp.test.sql) | Route mocks verify early rejection; pgTAP exercises database roles/RLS and authorized RPCs. Neither alone proves hosted cookie/configuration behavior. |
| Student grade mutation or hidden draft grades | [grade API tests](../../src/app/api/grades/[id]/route.test.ts), [student grades browser tests](../../tests/e2e/student-grades.spec.ts), MVP database assertions above | Explicit instructor publication, ownership and private drafts have automated coverage. Authenticated browser cases require local synthetic fixtures. |
| Prompt injection, rubric extraction and forged AI context | [context tests](../../src/features/codementor/context.test.ts), AI route tests above, [review service tests](../../src/features/codementor/review-service.test.ts) | Fixed role contexts serialize untrusted source; student context omits private rubrics; client-supplied source/rubric is rejected. Structural tests do not prove a model follows instructions. |
| Malformed model output, active markup, invalid scores | [contracts](../../src/features/codementor/contracts.test.ts), [review display tests](../../src/features/codementor/review-button.test.tsx), review service tests above | Strict schemas, rubric reconciliation, failure handling and text rendering are tested with synthetic/mocked responses. Real-model quality remains a separate evaluation. |
| API-key/provider diagnostic disclosure and unavailable service | [SoCLaaS client tests](../../src/lib/ai/soclaas.test.ts), review service tests above | Bounded JSON requests without tools, disabled configuration and sanitized failures are tested. No fresh provider outage/rate-limit or deployed client-bundle audit was run here. |
| Cross-user cache access and quota overspend | Context/cache-key and review service tests above; MVP pgTAP | Identity/task/source/version/model scoping and reservations have tests. The historical [MVP report](codementor-mvp/README.md) records a separate 12-request local quota experiment, not a rerun here. |
| Forged timing, replayed submissions or retroactive deadline edits | [deadline unit tests](../../src/features/assignment-deadlines/deadlines.test.ts), [deadline pgTAP](../../supabase/tests/database/assignment_deadlines.test.sql), [deadline browser tests](../../tests/e2e/assignment-deadlines.spec.ts) | Server-captured metadata, late acceptance, equality boundary, retry stability and unchanged past timing are covered. Hosted migration application is still a release prerequisite. |
| Cross-student revision comparison | [comparison route tests](../../src/app/student/submissions/[submissionId]/compare/page.test.tsx), [comparison browser tests](../../tests/e2e/compare-revisions.spec.ts) | Own-revision scoping and invalid selections are tested. Browser fixtures are prerequisite-dependent; the diff does not execute source. |
| Forum access, unsafe posts and query-shaped searches | [forum pgTAP](../../supabase/tests/database/forums.test.sql), [forum tests](../../tests/e2e/forums.spec.ts), [search browser tests](../../tests/e2e/forum-search.spec.ts) | Authorized posting, literal text/search handling and ownership-independent shared forum reads have coverage. No editing/deleting or attachment feature is claimed. |
| Runner network/credential access, spoofed messages, runaway output | [independent runtime replay](runtime-feasibility/independent-browser-tests.json), [security review](runtime-feasibility/security-design-review.md), [later boundary replay](runtime-feasibility/published-practice-boundary-tests.json), [preview boundary tests](../../tests/e2e/preview-boundary.spec.ts) | Historical Chromium lab tests expose and verify repaired boundary bugs. They are not current deployed isolation approval. Same-project runner and both authenticated roles still need release verification. |
| Admin privilege escalation / last-admin removal | [admin pgTAP](../../supabase/tests/database/admin_role_management.test.sql), [role-change unit tests](../../src/features/admin-users/user-role-changes.test.ts) | Unit/database boundaries have coverage. A complete authenticated admin browser journey remains pending. |

## Live AI evidence, kept separate

The [1 November SoCLaaS evaluation](../experiments/2026-11-01-soclaas-model-evaluation.md) records an initial 12-completion pilot and a corrected 12-completion comparison across three models and four synthetic Python cases each. Offline rescoring made no further provider calls. In the corrected set, `qwen3-coder-next` passed 4/4 acceptance cases; the other models passed 1/4 and 0/4. Accepted means both schema and the configured quality/security assertions passed.

This small comparison supports the documented model choice, not general injection resistance or grading validity. It did not test Java feedback quality, hosted delivery, provider rate limits, costs or prompt-cache behavior. No live AI calls were made for this documentation audit.

## Reproduction

Use the pinned Node version from `.node-version`, pnpm from `package.json` and synthetic fixtures only. From the repository root:

```powershell
npx.cmd --yes pnpm@12.15.0 install --frozen-lockfile
npx.cmd --yes pnpm@12.15.0 test:unit
npx.cmd --yes pnpm@12.15.0 db:test
npx.cmd --yes pnpm@12.15.0 format:check
npx.cmd --yes pnpm@12.15.0 spec:validate
npx.cmd --yes pnpm@12.15.0 check:scaffold
```

`db:test` requires running local Supabase with migrations already applied; do not reset an existing database for this audit. Database tests wrap synthetic changes in transactions. Authenticated Playwright fixtures and real-runtime opt-ins are described in the [Developer Guide](../../docs/DeveloperGuide.md) and test configuration. Supply secrets only through ignored local configuration/process environment. Never put test service keys or generated passwords into evidence. A default `test:e2e` success can contain many prerequisite skips: record totals and reasons rather than treating skips as passes.

## Fresh audit checks

- Under Node **24.22.1**, the full unit/coverage command passed **496 tests in 80 files**, with zero reported failures. Coverage matched the baseline figures above and passed the configured thresholds. No provider calls were made.
- Changed Markdown formatting passed; **98 local Markdown links in eight inspected documents** resolved. The scaffold check and strict OpenSpec validation passed (**11 items**). `git diff --check` passed.
- A fresh local `supabase test db` attempt failed to connect to `127.0.0.1:54322` (`ECONNREFUSED`); the stack was not started/reset for this prose audit. The **147 database assertions** above are from the successful baseline CI job, not this local attempt. Branch/PR CI separately reruns them.
- No fresh local browser journey, deployed test, live AI evaluation or independent review was run for this documentation change. CI browser prerequisites/skips remain material.

The first local unit attempt passed 439 tests in 65 files but exited 1 with 15 missing-`jsdom` environment errors. Installation under host Node 24.14.0 failed an engine requirement. Temporary pinned-tool installation initially met a certificate error; enabling the system CA store retained TLS verification. A combined temporary-tool invocation still selected the host Node, so the located Node 24.22.1 executable was put first in that process's PATH. The frozen-lockfile install then succeeded without changing manifests, the lockfile or global Node. Only the final clean suite is counted as passing.

## Release checks still open

- Record the hosted address/commit and apply current migrations to the intended environment through the team's release process; verify development/production isolation and recovery.
- Run deployed student/instructor Python and Java journeys, ownership/draft-grade denial, and same-project runner adversarial checks; record browser versions and runtime asset fingerprints/licensing approval.
- Verify hosted confirmation/reset emails and redirects, missing/disabled AI, live usage-limit/provider failure handling, and bounded adversarial AI cases for both languages/roles.
- Provision synthetic peer-tester accounts privately; execute the admin browser journey; obtain an independent/human security review.
- Reconcile broad OpenSpec checkboxes against evidence, publish the product site, complete member-authored reflections, and prepare the reviewed `master` release. This documentation change does not complete these gates.
