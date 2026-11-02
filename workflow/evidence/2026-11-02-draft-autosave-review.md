# Browser draft recovery: checks and independent review

Scope: issue [#82](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/82), branch `feat/draft-autosave`, base develop `1f521a6`; [approved design](../plans/2026-11-02-draft-autosave-design.md), [plan](../plans/2026-11-02-draft-autosave.md), [actual interaction summary](../../logs/2026-11-02-draft-autosave.md). Human verification pending; local tests and CI do not establish hosted release.

## Source boundaries and threat cases

- Verified server props scope records by student/assignment/language/revision; browser records are strict-schema untrusted data, not authoritative submissions. Malformed, Unicode-invalid, oversized, future/expired and mismatched records are rejected.
- Web Locks serialize writes/cleanup, with expected-record comparisons and an invalidation epoch checked when writing. Same-document auth invalidation stops writers synchronously. Different-tab events and epoch checks prevent delayed work from recreating a signed-out student's drafts when storage works.
- Explicit recovery/conflict choices preserve visible edits. Official submission acknowledgement uses the exact submitted source so newer changes remain dirty/recoverable. No draft endpoint, credential, rubric, AI call, execution or grade/XP write was added.
- Retention is seven days/ten contexts; quota-safe deletion and rejected-lock fallback were added after independent review. Fully denied storage cannot guarantee persistence/cleanup. The same browser profile and same-origin scripts can inspect plaintext local source; account keys do not encrypt it.

## Actual independent review

The coordinator dispatched fresh `/root/draft_security_review` with narrow source pointers, the approved design/plan and five review focus cases, a six-minute requested budget, no full conversation, and read-only/no-secrets/no-service/no-test instructions. The selected model was `gpt-6.1-sol` with high reasoning; actual hidden reasoning, token/cache data and measured reviewer cost were unavailable.

The reviewer found an important cleanup defect: an initial quota failure on the invalidation key could prevent source deletion; lock rejection could also bypass cleanup. A minor issue rewrote identical loaded source, causing unnecessary conflicts between idle tabs. The coordinator reproduced these through failing tests, removed the dependency on a successful first epoch write, added cleanup fallback and retained existing tokens for identical valid source. A two-minute requested follow-up found no further material lifecycle defect in the inspected fixes.

The reviewer ran no tests and explicitly left actual browser suspension/API behavior, visual/accessibility checks and CI to separate coordinator verification. Those are review limits, not passing independent test claims. No matched single-agent baseline, measured speedup or resource saving is claimed.

## Coordinator verification

- Initial six real authenticated synthetic Chromium feature journeys passed, covering both languages, refresh/tab closure, revision contexts, actual submission/in-flight edits, conflicting tabs/sign-out and mobile/theme controls with blocked draft storage.
- Final full units/coverage: 581 tests/100 files passed, statements 82.99%, branches 78.17%, functions 84.62%, lines 84.82%.
- Production app/runtime build, strict OpenSpec validation (eleven items) and scaffold checks passed. One local runtime fetch retry needed Node system CA trust enabled; integrity pins and TLS checks remained enforced.
- Full Chromium suite: 84 passed/seven skipped out of 91 in 6.9 minutes, including seven feature journeys, explicit same-browser account switching and existing real Python/Java execution with `RUN_AUTHENTICATED_RUNTIME_TESTS=1`. Six opt-in standalone runtime-lab tests and one opt-in local email journey skipped. No failures or retries in the full run.
- Final app/site builds, full formatting, ESLint, TypeScript, strict specs/scaffold passed. No database behavior changed; CI database regressions remain part of the PR gate. Branch/final-head CI and hosted verification are pending.

## References consulted

Installed Next.js 16.4.3 client-boundary docs and the repository local-storage schema guideline; [Supabase auth events](https://supabase.com/docs/reference/javascript/auth-onauthstatechange) for synchronous lifecycle subscription/unsubscription; [Web Locks](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API) for cross-tab serialization. The attempted Supabase markdown changelog fetch was rejected by the browsing tool's content-type handling; no changelog result was assumed. No external implementation copied and no new dependency added.
