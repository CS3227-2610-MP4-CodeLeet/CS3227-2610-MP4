# Browser runtime feasibility — 27 October 2026

Status: experiment completed; **no production runtime selected**. Java input failures were resolved by the [browser-only compatibility adapter](java-input-resolution.md). The later [published-practice slice](../../PublishedPracticeTests.md) connects the opt-in synthetic editor to the local runner; this is not production integration. Distribution/provenance and production gates remain open. Node 24 only fetches public assets, serves files and orchestrates the browser.

## Result and decision

| Candidate | Browser evidence | Decision |
| --- | --- | --- |
| Pyodide 314.0.7 | Python execution, buffered stdin, stdout/stderr and syntax/runtime errors work; independently tested cancellation/output/network isolation | Retain as Python candidate, conditional on app/deployment integration, browser matrix and distribution review |
| TeaVM-javac playground snapshot identified by hashes plus first-party input classes | Real Main.java compilation/Wasm execution, buffered stdin, basic Scanner/BufferedReader, diagnostics, Stop/rerun work in Chromium | Input blocker resolved for the documented subset; production/distribution review and snapshot provenance/version mapping remain open; runtime exception detail is generic |
| CheerpJ | Primary-source research only; vendor demo uses an extra tools.jar; licensing/hosting/API differences recorded | Alternative investigation, not installed or tested |

No remote compiler fallback, student source rewriting, removal of Java or simulated stdin is used. First-party compatibility classes are compiled and installed in the browser, with their supported API subset documented explicitly.

## Evidence catalog

- [Coordination and owned tasks](coordination.md): actual specialist assignments, findings and disposition.
- [Java primary-source research](java-research.md): candidate/API/licensing constraints; not runtime evidence.
- [Independent security design and source review](security-design-review.md): threat model, initial findings and repairs.
- [Asset fingerprints](assets.json): exact sizes/SHA-256 and origin URLs. Runtime binaries remain in ignored .runtime-cache, not Git.
- [Functional browser observations](browser-results.json): regenerated after the fix; both Java stdin cases are now mandatory passing assertions and any failed case makes the script exit nonzero. The original 9-pass/2-failed observation is described in the earlier review/handoff; its raw functional file was regenerated during this follow-up.
- [Original independent assertion results](independent-browser-tests.json) and [test review](independent-test-review.md): **11/11 assertions passed on the earlier lab snapshot**, preserving earlier failures. Those source hashes describe that snapshot, not the new adapter.
- [Java input resolution](java-input-resolution.md), [31 Java checks](java-input-tests.json) and [11 boundary checks replayed by the coordinator](java-input-boundary-tests.json): current implementation, support limitations and exact new source hashes. No new independent review is claimed.
- [Published-practice boundary replay](published-practice-boundary-tests.json): later coordinator replay with 13 assertions, including lifecycle replay rejection and Java execution timing excluding preparation. The 16-case website suite and local bridge are documented in the [integration log](../../../logs/2026-10-27-published-practice-tests.md). Earlier 11-case reports remain snapshots of their recorded code.

## Initial local measurements (historical)

Environment: Windows, Node v24.14.0 orchestration, Chromium 156.0.8078.4. The table records the initial experiment before the Java input fix; current raw observations are in browser-results.json and java-input-tests.json. Synthetic cases on loopback HTTP, one observation per listed condition; these are not internet download or production benchmarks. Both runtimes get a fresh iframe/worker each run. Warm means cached asset bytes in the parent page, **not** a reused interpreter/compiler.

| Metric | Python | Java |
| --- | --- | --- |
| Raw selected asset bytes | 13,531,207 | 6,715,239 |
| First asset preparation incl. local fetch and hash | about 941 ms | about 254 ms |
| First fresh sandbox through result | about 2,541 ms | about 1,328 ms |
| Warm-asset preparation | under 1 ms | under 1 ms |
| Fresh sandbox with warm assets | about 2,732 ms (stdin case) | about 1,284 ms (hello case) |

In the initial browser-results.json schema, totalMs measured sandbox lifetime after preparation and executionMs included Java compilation. Following published-test integration, current reports retain totalMs/preparationMs but executionMs starts at program execution and excludes compilation/setup. The differing Python samples are not an apples-to-apples speedup experiment. Asset caching avoids repeat transfer/hash work but does not eliminate fresh runtime initialization. Original independent reviews/results describe their recorded source hashes; subsequent coordinator replays are labeled separately.

Independent final observations: native fetch/XHR/WebSocket/import attempts did not increment the controlled HTTP recorder (5 before, 5 after); retained output was capped at 8,192 UTF-8 bytes; infinite-loop execution ended around 303 ms for a requested 300 ms budget; Stop during a confirmed executing loop returned in about 3 ms and a fresh run succeeded. These are observed browser scheduling results, not hard real-time or memory guarantees.

## Boundary and limitations

The credential-free local lab preloads public runtime bytes and verifies fingerprints. A sandboxed opaque-origin iframe owns a trusted supervisor and creates the untrusted worker from a blob. Student source travels as message data, never as iframe HTML or supervisor script. CSP denies all connections; a fetch shim serves exact preloaded assets only. Worker constructors are disabled as additional hardening. The supervisor independently caps accepted messages/output and enforces ready/run states and execution timeout. Parent reservation, cancellation and deadline cover preparation too; failed asset promises are evicted for retry.

Opaque module-worker bootstrap failed in the initial experiment. The final classic blob worker dynamically imports preloaded ES modules. TeaVM and Pyodide required JavaScript evaluation during initialization, so unsafe-eval is confined to the opaque supervisor/worker policy; it is not added to Next.js/app pages. The final hostile native-API tests exercise that policy, rather than relying only on a patched fetch function. Stop/retry, empty-message floods and forged ready were independently tested.

This is a Chromium-only local prototype, not proof of a production sandbox. Actual Next.js CSP inheritance and a dedicated credential-free deployment origin are untested. No hard memory/process allocation quotas are established; oversized structured clones, allocation pressure, all network APIs and Java-specific hostile bridges are not comprehensively tested. Worker output/status is untrusted and never evidence for grades/XP. Retain task 1.3 and app-runner task 3.2 as incomplete.

## Distribution/license review

Pyodide metadata/source identifies MPL-2.0; its Python/stdlib distribution contains additional upstream components. TeaVM-javac identifies Apache-2.0 and OpenJDK GPLv2 with the Classpath exception. These are recorded primary-source license identities, not a completed redistribution approval. Review exact bundled notices/source obligations before packaging/hosting assets; no vendor binaries or JARs are committed. The mutable Java playground distribution has pinned observed hashes but no verified match to a reproducible source commit/release. Do not update those hashes automatically to bypass a mismatch.

## Reproduce

1. From the repository root on Node 24, fetch the reviewed assets: `node workflow/scripts/fetch-runtime-assets.mjs`. Existing fingerprints are enforced. On the original Windows environment, process-scoped NODE_OPTIONS=--use-system-ca was needed for trusted TLS; verification was never disabled.
2. Install Chromium if missing: `pnpm exec playwright install chromium`.
3. Start `node src/runtime-lab/server.mjs`, bound to 127.0.0.1:3130 only. It has no execute/compile endpoint and does not load .env.local.
4. In another terminal, run `node workflow/scripts/run-runtime-probes.mjs` and `node workflow/scripts/verify-runtime-boundary.mjs`.
5. Run `node workflow/scripts/verify-java-input.mjs` for the Java input assertions. For a coordinator boundary replay, pass `workflow/evidence/runtime-feasibility/java-input-boundary-tests.json` as the boundary script's output argument to preserve the original independent report. Scripts use synthetic public source and replace the selected evidence files with fresh measurements.

Primary runtime references: [Pyodide worker guide](https://pyodide.org/en/stable/usage/webworker.html), [streams](https://pyodide.org/en/stable/usage/streams.html), [API](https://pyodide.org/en/stable/usage/api/js-api.html), [TeaVM-javac](https://github.com/konsoletyper/teavm-javac). Detailed independent sources are linked in the research/review reports.
