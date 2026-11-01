# Session: 2026-11-01 SoCLaaS model evaluation

- Timezone: Asia/Singapore
- Participants/actual agent IDs: Codex primary agent; no specialists delegated (repository instructions required explicit authorization).
- AI tools/models, where known: Codex (model details unavailable); SoCLaaS trial candidates: `llama3.1:8b`, `qwen3.5:9b`, `qwen3-coder-next`.
- GitHub issue: [#48](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/48)
- OpenSpec change: `openspec/changes/evaluate-soclaas-models` (active for review; main capability spec synchronized).
- Branch and commits: `eval/48-soclaas-model-comparison`, based on `develop` at `a80d2055d95784bee4e48ce3c33debce747a9804`; no commits yet.
- Pull request: pending.
- Human verification: pending.
- Verifier/date: pending.

## Prompt and interaction summaries

1. User requested implementation of all MP4 Plan PDF sections 3–6 (both-role AI, context engineering, resource-aware LLM usage, security/testing), synthetic/automated checks, a model decision, and documentation of tests and rationale. The PDF was treated as product input; repository instructions and user authorization remained authoritative.
2. Audited existing implementation. Both role-specific CodeMentor paths, server-only SoCLaaS gateway, role-aware context and comparison, input/output caps, identity-scoped cache, quotas, per-user usage reporting, RLS, grade publication controls, and untrusted-input/output handling were already present. The requirement-to-evidence map and limitations are in `workflow/experiments/2026-11-01-soclaas-model-evaluation.md`.
3. Read `workflow/ProjectBrief.md`, `workflow/AgentProcess.md`, the archived MVP design context, and repository-local skills. Created issue #48 and branch `eval/48-soclaas-model-comparison` from clean `develop` commit `a80d2055d95784bee4e48ce3c33debce747a9804` before implementation. No specialists were delegated.
4. The four supplied SoCLaaS DocHub pages were inaccessible to this environment (permission denied/login required). A bounded server-authenticated `/models` catalog lookup confirmed the three tested model IDs and context-window metadata. No credential or configured endpoint value was recorded. Price and provider rate-limit metadata were unavailable.
5. Added a fixed synthetic corpus and opt-in sequential evaluation harness (maximum 3 candidate models, 4 cases each, 12 calls/run, 30-second timeout, 800 output tokens/call). It checks response shape and deterministic task/security assertions, stores synthetic outputs and provider-reported token/latency results, and sanitizes diagnostics.
6. First live 12-call pilot (prompt v1) exposed invalid outputs and an instructor prompt that omitted validator-required `totalScore`. Added a failing prompt-contract test, corrected both instructor prompt variants, and bumped prompt version to v2 so previous cached outputs cannot be reused. Initial pilot results are summarized in the report; raw pilot outputs were not retained.
7. Ran the corrected live 12-call comparison using only synthetic cases. `qwen3-coder-next` passed 4/4 schema checks and all 8 task/security assertions, with 1,767 ms mean latency and 1,114 input / 1,156 output provider tokens. `llama3.1:8b` passed 3/4 schema checks and 5/6 assertions, with 2,845 ms and 964 / 644 tokens. `qwen3.5:9b` passed 0/4, returned empty content and reported 800 output tokens for each case, with 12,918 ms and 1,122 / 3,200 tokens. See `workflow/experiments/2026-11-01-soclaas-model-evaluation.json` for trial records and the report for interpretation.
8. Chose `qwen3-coder-next` as the recommended `.env.example` model based on the only candidate passing every check and its lowest observed mean latency. This is one small synthetic run and does not prove grading validity, general injection resistance, cost, provider caching, or production latency. Real student records and submitted source execution were not used.
9. Added route tests for same-origin/auth/role/context verification, evaluation harness tests, and the prompt contract regression. Added a fresh main OpenSpec spec for `ai-model-evaluation`, marked tasks complete after verification, and left the change active for review. No independent reviewer or human verification has occurred.

## Work and verification

- Implementation/evidence files: `.env.example`, `docs/UserGuide.md`, `package.json`, `src/features/codementor/context.ts`, its test, `src/lib/ai/review-route.test.ts`, `tests/unit/ai-model-evaluation.test.ts`, `workflow/scripts/evaluate-soclaas-models.mjs` and contracts, synthetic cases and dated JSON evidence, evaluation report, OpenSpec change and synchronized main spec, and this log.
- `pnpm test:unit`: pass, 266 tests across 38 files.
- `pnpm lint`: pass.
- `pnpm typecheck`: pass.
- `pnpm format:check`: pass.
- `pnpm db:test`: pass, 124 assertions across 6 SQL test files. Initial run exposed a local database missing out-of-order migration `20261031024317_forums.sql`; applied that pending migration with `pnpm exec supabase migration up --include-all --local` (no reset), then reran successfully.
- `pnpm spec:validate`: pass, 9 items.
- `pnpm exec openspec validate --specs`: pending final run after sync.
- `git diff --check`: pass before the final spec/log edits; rerun during closeout.
- `pnpm build`: failed three times at `EPERM` renaming `.runtime.staging-<pid>` to `public/runtime` in the existing static browser-runtime build script. After the latest failure, both paths were absent and there were no tracked `public/` changes. An isolated Node `fs.rename` probe into `public/` passed; the specific build rename failure remains unexplained and unresolved. No AI build error was reached.
- A small synthetic SoCLaaS prompt-contract pilot and the corrected model comparison made 24 completion requests total across two bounded runs; the model report captures both run summaries and the corrected trial JSON. The configured catalog lookup was a separate request.

## Failures, limits, and remaining review

- The official SoCLaaS documentation links could not be read due to the environment's DocHub access restriction. The model catalog provided IDs/context sizes only; pricing and provider limits remain unverified. The local harness caps do not assert provider quotas.
- Product code was not independently reviewed. Hosted app, Vercel deployment, production SoCLaaS behavior, broad prompt-injection resistance, and real-world grading quality were not tested.
- Build limitation: existing static-runtime build stops at Windows `EPERM` directory replacement, so production build completion is unverified.
- Human verification and PR are pending; branch has no commits or pushed changes yet.
