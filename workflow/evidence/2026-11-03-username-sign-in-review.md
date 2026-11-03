# Username sign-in: security review and verification

Issue [#84](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/84), branch `feat/username-sign-in`, base develop `0aca647`. [Approved design](../plans/2026-11-03-username-sign-in-design.md), [plan](../plans/2026-11-03-username-sign-in.md), [student acceptance matrix](2026-11-03-student-acceptance.md), [actual session summary](../../logs/2026-11-03-username-sign-in.md). Generated evidence requires human review; no hosted release or live AI security verification claimed.

## Implemented boundaries

- Database-owned normalized keys reserve legacy names; nullable unique claimed keys authenticate only unambiguous accounts. Definer claim trigger, advisory lock and unique index protect ordinary/direct allowed profile writes. Own-profile RLS and column grants remain. Missing-name default accounts are unclaimed; last legacy owner must explicitly save, and abandoned names release.
- Public invoker wrappers for normalization, quotas and current-Auth-email resolution are granted only to service_role and call private helpers. The reviewed server metadata client never authenticates passwords or assigns roles. The normal publishable SSR client creates cookies; JSON success contains only `{ok:true}`.
- Atomic minute windows reserve at most ten accepted attempts per HMAC-normalized identifier and sixty globally, before resolution/password calls. Counters contain no raw email/password. Global-budget exhaustion is an availability limitation, not complete DoS protection; provider quotas remain independent.
- Stateless dummy authentication never creates app cookies, even for unexpected success. Known/dummy provider 429/5xx use identical safe classifications. Credential, provider and configuration failures are sanitized; no perfect timing-equivalence guarantee.
- Successful sign-in consumes/validates its response, stops old draft writers through same-origin notifications and an epoch without deleting drafts, and refreshes the server-issued browser session before navigation. Client notifications only disable editors; protected server identity still comes from getUser/trusted roles.

## Actual independent agents

Fresh builder `/root/username_design_check` received the design/source pointers with a four-minute requested budget and read-only/no-secrets/no-tests/no-services/no-subagents constraints. It identified only legacy-reservation lifecycle ambiguity; explicit last-owner claim and abandoned-name release were written into the subsequently approved design.

Fresh reviewer `/root/username_security_review` used gpt-6.1-sol/high and a six-minute requested source budget, followed by bounded four- and two-minute source follow-ups. It ran no tests, services or mutations and read no secrets. The initial P2 finding exposed a status oracle: unknown names discarded dummy 429/5xx while known names reported them. Coordinator failing-first regressions reproduced and fixed it through one classifier.

The whole-branch review found no remaining material SQL/claim/grant/HMAC/config defect but explicitly declined to verify cross-tab account changes. Coordinator reproduced that boundary with a real failing browser journey: B's server cookie login left A's editor/submit enabled. Added immediate writer invalidation plus normal browser session refresh, retaining stored drafts. The two-minute fix review found no material defect and verified that messages carry no identity/token/source and do not authorize server requests. Actual delivery remained the coordinator's test responsibility; the targeted browser regression passed after rebuilding.

Actual token, hidden reasoning, cache-hit and cost measurements were unavailable. Budgets above are requested limits, not measured durations. No matched single-agent experiment or claimed efficiency gain.

## Coordinator evidence before loading-feedback continuation

- Additive local migration; 321 pgTAP assertions across eleven files passed, including 39 username/attempt checks. Existing leaderboard duplicate names are now explicitly legacy transaction fixtures. No reset or hosted migration.
- Actual two concurrent profile transactions yielded one successful case-variant claim and one uniqueness rejection; exactly one claimed owner verified and both known synthetic users removed. Initial multi-command CLI harness failed before writes; corrected to one DO block per prepared query. This is a concurrency check, not a throughput benchmark.
- Advisors: no issues. Database lint: existing unrelated `public.valid_practice_cases` UUID-array initialization warning only; no new username helper issue.
- Final full units: 613 tests/106 files passed. Coverage: 83.54% statements, 78.52% branches, 84.98% functions, 85.47% lines.
- Production app/runtime build passed; Node 24.22.1 and actual Chromium 156.0.8078.4 recorded. A configured-value scan of 39 generated browser JavaScript files found neither server-only key nor HMAC secret. Values were not printed; this checks the current build only.
- Feature journeys passed across focused runs after correcting response ordering and an ambiguous Next route-announcer test selector. Cross-tab regression passed separately after its fix. A partial full-suite run (18 passes recorded) was intentionally stopped to investigate that boundary; it is not counted as a complete acceptance run. That full run completed with 91 passes, one fixed-name MVP fixture failure and seven skips. The corrected targeted real-runtime MVP rerun passed; exact history is preserved in the acceptance record. The later loading delta has its own fresh full run.

## Limits and references

Loading-feedback continuation: read-only reviewer `/root/pending_action_review`
reviewed the uncommitted delta against `6184c4d` with a requested four-minute
budget. It found no material correctness/accessibility issue, but identified
that successful delayed navigation was not tested. The coordinator added an
actual local Auth browser journey holding the destination RSC request. The
initial run passed the busy assertions and failed only on an incorrect expected
heading; corrected to the existing “Your assignments” text for the full rerun.
The reviewer ran no tests/services and accessed no secrets. Final browser results
are recorded separately after execution; source review alone does not prove them.

Hosted key/migration configuration, provider behavior and actual browser API denial/suspension are not established by source review. Fully denied browser storage and unavailable messaging can limit persistent/cross-tab notification; normal server authorization remains separate. Signup/profile availability messages do not establish a public email directory. Same browser profile/same-origin scripts remain outside plaintext draft confidentiality guarantees.

Implementation used the installed Next.js client/route guidance and official [Supabase password authentication](https://supabase.com/docs/reference/javascript/auth-signinwithpassword), [API-key security](https://supabase.com/docs/guides/api/api-keys), [SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [auth events](https://supabase.com/docs/reference/javascript/auth-onauthstatechange) and [session refresh](https://supabase.com/docs/reference/javascript/auth-refreshsession) documentation. Changelog markdown fetch failed the browsing tool's content-type support; no changelog result was assumed. No previous MP or external implementation copied.
