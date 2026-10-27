# Session: 27 October 2026, browser runtime feasibility

- Timezone: Asia/Singapore
- Participants: requester, root coordinator, /root/java_runtime_research, /root/runner_security_review, /root/browser_boundary_tester
- Human verification of generated summaries/evidence: pending

## Request and scope

The requester authorized the proposed browser-native Python/Java feasibility experiment with coordinated research/security/testing before editor integration. Created feature/5-browser-runtime-feasibility from merged develop 5321124 after PR #8. Used OpenSpec apply workflow starting at 3/39 tasks complete. No .env.local values, real code, app credentials, LLM calls or teammate-owned auth/schema were used.

## Actual work

Researcher identified TeaVM-javac/CheerpJ assets, APIs and licensing/stdin constraints. Reviewer designed the opaque-supervisor/untrusted-worker boundary and reviewed actual implementation. Root fetched reviewed runtime assets into ignored cache, recorded hashes/sizes, built a standalone static browser lab and measured source execution/Java compilation in Chromium. Independent tester implemented and executed assertion-based hostile-boundary tests. Source/runtime artifacts and concrete handoffs are cataloged in workflow/evidence/runtime-feasibility/README.md and coordination.md.

## Failures, repairs and decisions

- Initial Java asset fetch timed out; official www hostname then succeeded. No third-party binary mirror was substituted.
- Opaque module workers failed to start. Classic blob bootstrap with dynamic ES imports worked. JavaScript-evaluation policy and a URL-object fetch-shim bug also blocked initialization initially; repaired only inside the opaque lab boundary, not app CSP.
- Reviewer found concurrent preparation reservation and unlimited empty/ready messages; root repaired trusted reservations, phase/message caps, deadlines, abort propagation and failed-cache retry.
- Tester found output-size cap returned generic error; repaired explicit output-limit reporting and independently replayed.
- Python stdin/output/errors work. Real Java hello source compiles/runs, but Scanner is absent and minimal System.in.read fails. Java remains unaccepted; no remote fallback, source rewriting or omitted input feature was introduced.

## Verification and limits

- Node orchestration: v24.14.0. Browser: Chromium 156.0.8078.4 on local Windows.
- Functional report: nine confirmed assertions passed; two Java input acceptance gates failed, explicitly recorded.
- Independent final formatted-source suite: 11/11 passed, with earlier failures preserved. Output 8192 bytes; observed 300 ms loop budget stopped around 303 ms; Stop about 3 ms then fresh run. Controlled request recorder 5→5 under native networking/import attempts.
- Formatting/lint: passed for prototype source after repairs; runtime binaries are excluded.
- Final normal-app unit suite: 24 passed. App production build/types, formatting, lint, scaffold/local links, strict OpenSpec (one change, zero failures) and tracked diff whitespace checks passed. Independent security reviewer verified tester hashes and final disposition separately.
- No hosted/deployed runtime, Firefox/WebKit, hard memory quota or full Java adversarial test/production security approval claimed.

## Outcome

Task 1.2 evaluation is complete, not runtime acceptance. Keep task 1.3 and runner integration 3.2 open. Python remains a conditional candidate; Java input/library/provenance must be resolved. UserGuide remains unchanged because the normal application has no Run feature. No commit, push, PR or deployment was requested for this experiment.
