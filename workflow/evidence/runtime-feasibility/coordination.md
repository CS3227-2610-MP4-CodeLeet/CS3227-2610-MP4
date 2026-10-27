# Browser runtime feasibility: coordination record

Date: 27 October 2026, Asia/Singapore. Status: experiment and independent review complete; production/Java adoption gates remain open.

User authorized browser-only Python/Java feasibility with coordinated implementation, security review and testing. Branch feature/5-browser-runtime-feasibility starts from merged develop 5321124. OpenSpec tasks 1.2/1.3 are under evaluation; runner integration 3.2 remains out of scope until acceptance.

| Task / actual agent | Trigger and context | Allowed writes | Budget / handoff |
| --- | --- | --- | --- |
| Root coordinator/implementer | User request, runtime spec/design, evaluation template | src/runtime-lab, workflow runtime scripts/evidence, relevant docs/specs/tests | Small standalone browser harness; no app/auth changes; record actual measurements |
| /root/java_runtime_research | Need real Java source compilation, not precompiled-class playback | java-research.md only | About 12 primary-source calls / 15 minutes; return actionable assets/APIs/licensing before implementation |
| /root/runner_security_review | Threat boundaries before executing untrusted source | security-design-review.md only | About 10 focused calls / 15 minutes; design review first, independent prototype review afterward |

Shared resources: root owns runtime cache setup, harness, execution and measurements. Research/reviewer do not install runtimes, edit common config, or execute source. All source execution must happen in a browser; Node may serve static files, fetch reviewed runtime assets and orchestrate browser tests only. No .env.local read, no service credentials and no live LLM calls.

Initial handoffs: Java research identified TeaVM-javac browser compiler/runtime candidate and CheerpJ's separate tools.jar requirement. Security reviewer recommended a trusted opaque iframe supervisor plus dedicated untrusted worker, preloaded assets, connect-src none, cancellation and independent parent deadline. Root is evaluating this boundary before selection. Reports distinguish documents from actual browser results. Model/cost/token counters are not exposed; do not invent them.

## Executed handoffs and disposition

- Java researcher returned TeaVM source/asset APIs and CheerpJ tools.jar/hosting constraints. Root tested TeaVM's actual downloaded snapshot instead of assuming its documented API meant required stdin worked. Both stdin acceptance probes failed; Java remains unaccepted.
- Security reviewer identified unbounded empty messages/repeated ready and a reservation race around asynchronous preparation. Root added a trusted message budget/state machine, synchronous active reservation and cancellation/deadline handling. A later review led to abort propagation and rejected-cache eviction.
- Actual independent test agent `/root/browser_boundary_tester` received the executable lab plus review findings, with write ownership only of verify-runtime-boundary.mjs and independent test artifacts. It executes all source in Chromium, not Node. Budget: 12 minutes; raw results/clock times are in its report. It independently reproduced an output-limit status defect, sent the failure, and root repaired status reporting; the final formatted-source replay passes 11/11 and retains earlier failures.
- The tester also checked failed asset-load retry, preparation cancellation, network/credential boundaries, forged messages and actual-execution Stop/rerun. Two positive controls overlap coordinator functional checks intentionally to verify the real boundary independently; this is coordination cost, not avoided work.
- Final source/security review is separate from runtime assertions; remaining app/deployment/Java/cross-browser/memory gaps are explicit. No agent role files are substituted for actual runs. No token/cache/cost savings were measured; wall-clock browser observations are not agent reasoning metrics.

No parallel code edits conflicted: root owned the prototype; specialists wrote distinct reports/scripts. Findings were resolved through messages and verification rather than editing another agent's code. Initial runtime bootstrap failures and test-orchestrator retries consumed time; they are recorded as actual failed attempts, not successful tests. Human verification of generated evidence remains pending.

Final independent security disposition inspected both JSON reports and verified current source hashes against the tester's final replay. It accepts the repaired standalone boundary as a feasibility candidate, not production approval, Java acceptance or a hard resource guarantee. The tested final policy still needs deployed-app/origin review and Java-specific/cross-browser testing.
