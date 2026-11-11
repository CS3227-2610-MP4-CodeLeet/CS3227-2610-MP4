## Why

The CodeMentor MVP already implements the two role-specific AI workflows and their main resource and security controls, but its context experiment is synthetic-only and does not compare model quality. This follow-up records evidence against the MP4 Plan sections 3–6 and selects a SoCLaaS model using bounded, reproducible tests instead of guesswork.

## What Changes

- Audit the implemented student feedback, instructor rubric suggestions, context construction/comparison, quotas, cache, usage reporting, and security controls against the cited plan.
- Add an opt-in, synthetic-data SoCLaaS evaluation that compares only currently available models using structured-output validity, educational/rubric quality, adversarial behavior, latency, and token counts.
- Record trial inputs, model IDs, prompt version, actual measured outputs, limitations, and the selection decision without storing credentials or real student data.
- Add focused automated security regressions only where the audit finds a missing requirement.

## Capabilities

### New Capabilities
- `ai-model-evaluation`: bounded synthetic model comparison and evidence-based model selection.

### Modified Capabilities

## Impact

- `workflow/scripts/` evaluation harness and a dated evidence report.
- Focused CodeMentor tests if the audit confirms a coverage gap.
- `openspec/specs/` after the change is verified and synchronized.
- No new provider, dependency, database schema, production feature flag, or remote code execution.
