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
