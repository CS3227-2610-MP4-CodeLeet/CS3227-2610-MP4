## 1. Audit Existing AI and Security Coverage

- [x] 1.1 Map PDF sections 3–6 to the current implementation, tests, and documented limits; record confirmed gaps only.
- [x] 1.2 Add failing focused tests for any confirmed security or resource-control gap, then implement the smallest fix.

## 2. Bounded SoCLaaS Model Evaluation

- [x] 2.1 Add a synthetic evaluation corpus covering student feedback, instructor rubric scoring, and prompt-injection resistance.
- [x] 2.2 Add an opt-in harness that discovers or accepts current SoCLaaS model IDs, enforces candidate/call/time budgets, validates outputs, redacts errors, and records latency/tokens/results.
- [x] 2.3 Run the harness against available candidate models; document measured results, limitations, and the selected model or why selection remains pending.
- [x] 2.4 Update `.env.example` only if live evidence supports an explicit selected model.

## 3. Verification and Evidence

- [x] 3.1 Run focused AI tests and the applicable full unit, lint, typecheck, build, database, and OpenSpec checks; record unavailable prerequisites and failed checks accurately.
- [x] 3.2 Review security boundaries and document the exact PDF requirement-to-evidence mapping and model evaluation results.
- [x] 3.3 Update the dated session log, synchronize accepted OpenSpec requirements, validate the change, and link issue #48, branch, and evidence.

## 4. Review corrections and PR closeout

- [x] 4.1 Correct trial acceptance, student grading-disclosure checks, grade-change/publication detection, and partial request-budget planning; add regressions for each.
- [x] 4.2 Diagnose the failed Application build and preserve pinned asset verification while tolerating transient download mismatches.
- [x] 4.3 Add issue-closing guidance where absent, update the PR to use `Closes #48`, rerun applicable checks, push fixes, reply to and resolve addressed review threads.
- [x] 4.4 Balance trials across capped model candidates, report candidates with no trials and omitted cases, isolate grade-claim detection by feedback field, preserve student cache keys with role-specific prompt versions, correct evidence provenance, then verify, push, and resolve the additional review threads.
- [x] 4.5 Scope publication negation to nearby actions, require student feedback to explain the target failure, accept explicit negative diagnoses, count only provider fetch attempts, rescore saved results offline, then verify, push, and resolve the latest review threads.
- [x] 4.6 Keep advisory score suggestions distinct from grade mutations, parse quoted dotenv values with inline comments, reject complete student solutions, rescore saved evidence offline, then verify, push, and resolve these review threads.
- [x] 4.7 Require publication claims to name a nearby grade, score, or mark; allow publishing unrelated materials without failing trial quality checks.
- [ ] 4.8 Require student failure cues to describe failed behavior, and reject complete one-line Python lambda replacements; add regressions and verify the model-evaluation quality checks.
