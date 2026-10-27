# Browser runner security design review

Status: design review only; no runtime, browser, isolation, cancellation, or adversarial tests executed by this reviewer. Adoption remains conditional on a working prototype and independent implementation review.

## Review record

- Reviewer / actual agent task ID: `/root/runner_security_review` (independent of prototype author).
- Parent / trigger: `/root`; user-authorized coordinated browser-runtime feasibility work.
- Review started: 2026-10-27 04:18 UTC; document prepared: 2026-10-27 04:20 UTC. Times are tool-observed UTC minute precision; not an execution-duration measurement.
- Budget: approximately 10 focused source/tool calls / 15 minutes. Provider token usage and cost unavailable.
- Inputs: `AGENTS.md`, `workflow/ProjectBrief.md`, `workflow/AgentProcess.md`, `openspec/changes/build-programming-platform/specs/browser-code-execution/spec.md`, and the browser runner section of that change's `design.md`.
- Write ownership: this file only. No `.env.local` access; no code/config changes, runtime installation, submitted-source execution, or further delegation.
- Next owner: coordinator/prototype implementer, then this independent reviewer for the actual boundary and recorded browser evidence.
- Actual checks: required local documents read; primary standards/runtime documentation consulted; output file existence confirmed (11,448 bytes before this record update). `git diff --check` was attempted but unavailable because this child shell reported “Not a git repository”; it is not recorded as passing. Seven focused tool calls preceded this record update; runtime/adversarial execution remains absent.

## Decision and proposed boundary

Use an opaque-origin iframe as a trusted supervisor and execute all untrusted source exclusively inside its dedicated Worker. The iframe should have `sandbox="allow-scripts"` only: no same-origin, popup, forms, navigation, download, or storage-access permissions. Give it `referrerpolicy="no-referrer"`. A separate cookieless runner origin is desirable deployment defense; an opaque `srcdoc` supervisor is the minimal prototype candidate and must be tested under the real app CSP. Do not add app cookies, auth clients, analytics, environment values, private test data, or private rubrics to either runner context.

The worker exists for cancellation and to deny the untrusted program a Window/DOM navigation capability. A sandboxed frame can navigate its own browsing context; a deny-all fetch CSP is not a universal navigation firewall. Therefore Python's JS bridge, Java JS/native bridges, generated JavaScript, compiler plugins, and any source-derived executable must never run in the supervisor realm. Its only student-controlled inputs are bounded data fields. Never insert source/output into HTML, script text, URLs, or event handlers.

The HTML standard describes sandbox origin restrictions and worker origin/termination behavior. This design additionally requires a tested opaque-origin worker and policy inheritance; standards descriptions alone are not browser evidence. [HTML iframe sandbox](https://html.spec.whatwg.org/multipage/iframe-embed-object.html#attr-iframe-sandbox), [HTML workers](https://html.spec.whatwg.org/multipage/workers.html).

## Asset loading and CSP

Keep network denied from creation through execution. Suggested prototype supervisor policy, placed before every executable element:

```text
default-src 'none'; base-uri 'none'; form-action 'none';
connect-src 'none'; img-src 'none'; media-src 'none'; font-src 'none';
object-src 'none'; frame-src 'none';
script-src 'nonce-<fresh trusted bootstrap nonce>' blob: 'wasm-unsafe-eval';
worker-src blob:
```

This is a starting policy, not a compatibility result. Use a header where serving a dedicated runner document. `sandbox` and `frame-ancestors` require appropriate header/iframe controls, not reliance on a meta policy. The app's existing policy may further restrict a `srcdoc` document. Do not relax the app's general CSP just to bootstrap the experiment. If a candidate needs JS `eval`/`Function`, record and review that requirement before adding `unsafe-eval`; WebAssembly allowance alone does not imply JS-eval allowance.

Only trusted app loader code may fetch a fixed, version-pinned manifest of public runtime/compiler assets with `credentials: "omit"` and no private headers. It transfers asset bytes into the supervisor. Construct runtime/worker blob URLs **inside the opaque supervisor**, not in the authenticated parent. CSP/local URL policy inheritance depends on the creating context; passing an app-created blob URL is not equivalent. No hostname is allowed in worker `connect-src`, `script-src`, or `worker-src`. Blob scripts/descendant workers must retain the restrictive policy. [CSP3 fetch directives and inheritance](https://www.w3.org/TR/CSP/).

The loader may serve reviewed asset bytes from an in-memory exact-name map if a runtime expects fetch-like APIs; that adapter provides bytes only and has no parent RPC/network fallback. The browser CSP remains the security control even if student code replaces the adapter or recovers native fetch. Do not temporarily permit a CDN and attempt to revoke it after initialization: existing imports, snapshots, or in-flight requests make that harder to reason about. Never pass user-selected asset URLs or paths to parent fetch. Compile Java source and run its classes entirely in the same isolated browser boundary.

Pyodide loading includes core script/module, Wasm, standard library and lockfile concerns; `loadPyodide` options and package loading need verification against the pinned release. Merely setting `indexURL` does not establish offline/credential-free initialization. Its JS bridge must be treated as access to the complete worker global. Package installation is outside scope. Java candidates must similarly enumerate lazy class/library loads and JS/native bridges; reject a candidate requiring a trusted Window or arbitrary network during source execution. [Pyodide JavaScript API](https://pyodide.org/en/stable/usage/api/js-api.html).

## Message bridge and cancellation

1. Create a fresh frame, run ID, and cryptographically random parent/supervisor token for every run. Check parent-side `event.source === iframe.contentWindow`; opaque origin serializes as `"null"`, which alone authenticates nothing. Supervisor checks the expected app origin and `event.source === parent`. Use `"*"` delivery only for the opaque target and never send secrets.
2. Establish one private `MessageChannel` after the validated handshake. Keep the parent/supervisor port and channel token out of the worker. Accept initialization once; validate version, run ID, exact allowed message types, primitive field types, transfer counts, source/stdin byte limits and state transitions. Ignore messages from siblings, old frames, old runs, unexpected ports, and unsolicited asset requests.
3. Supervisor validates worker output as hostile data. Worker can forge ready/completed/error messages or mutate its runtime; these statuses are practice feedback only. A token visible in the worker cannot make its results trustworthy. Render output as text. Never expose generic fetch, storage, DOM, navigation, evaluation, submission, grade, or XP RPC.
4. Set separate startup and execution deadlines in the trusted parent. Supervisor owns the Worker object and calls `terminate()` on stop/deadline/output breach; do not rely on cooperative Python/Java interrupts. Parent independently invalidates the run, closes its port, and removes/replaces the frame on stop, deadline, or supervisor failure. Test teardown rather than assuming DOM removal promptly stops all descendants.
5. Bound input bytes, retained output bytes, chunk size, message count/rate, and UI update rate. Stop the worker when limits are exceeded. An attacker can enqueue huge structured clones or allocate memory before receivers inspect a message; application caps do not create a browser-process memory quota. State this limitation and measure UI recovery. No hard memory/time-isolation claim is justified.

## Required adversarial evidence before acceptance

All rows below are **recommended tests, not executed results**. Use synthetic canary cookies/storage and a controlled HTTP/WS request recorder; never real credentials. Record exact browser/OS/runtime versions, policy, source, deadline values, request traces, elapsed recovery and pass/fail. Observe attempted requests as well as readable responses: CORS errors do not prove that no authenticated request was sent.

| Probe | Required observable result |
| --- | --- |
| Positive controls: Python stdin/output; Java `Main` compilation/output; syntax errors | Both run locally; no source sent to any server; expected compile/runtime results. |
| JS bridge reads worker global, cookie/storage APIs, IndexedDB, CacheStorage, app DOM/parent/opener references | No app values or app Window capability; prove canaries were present in the parent first. |
| Native fetch/XHR, credentialed and no-cors app API requests, redirects, HTTP/HTTPS/WS/WebSocket/EventSource/WebTransport where exposed | No unauthorized request reaches app API or recorder, including credentialed side effects. Test GET and POST. |
| `importScripts`, module import, nested Worker/SharedWorker/service-worker registration, blob/data URLs | Network imports/registrations denied; permitted local descendant contexts retain network/storage isolation and stop with the run. |
| JS navigation/form/image/frame/WebRTC attempts through every exposed bridge | Worker has no usable Window capability; supervisor never performs source-directed navigation, rendering or network action. Unsupported APIs documented. |
| Fake `null`-origin sibling frame; wrong source/origin/token/run; replay; malformed messages; unsolicited ports/assets | No accepted command/state change/output from unauthenticated contexts; no loader fetch on student request. |
| Python/Java infinite loop, JS bridge loop, output/message flood, nested worker loop, allocation pressure | Stop and deadline leave app usable; bounded retained output; fresh run succeeds. Record actual timings and failures, not invented memory guarantees. |
| Remove frame during bootstrap, compilation and execution; stop/rerun repeatedly; late messages | Old contexts cannot update new run; ports/blob resources released; no persistent request/timer activity. |
| Fail/miss runtime asset; offline after successful preload; attempt late package/class load | Explicit initialization/unsupported-operation failure with no server execution fallback or expanded network policy. Offline claim only if verified. |
| Output containing HTML/script, terminal escapes and oversized Unicode chunks | Plain-text display with byte-aware caps; no markup execution or app navigation. |

Run the boundary probes first with direct hostile JavaScript in the exact candidate worker, then through each language's accessible bridges. This avoids mistaking a language-level missing API for a browser security boundary. Test supported Chromium, Firefox and WebKit versions separately; one passing engine does not establish the others. A prototype failure to construct the opaque worker or initialize from bytes is a feasibility blocker, not justification to execute source in Node/server or the authenticated app origin.

## Current disposition

Conditionally suitable architecture; no runtime selected and no implementation approved. The principal unresolved questions are strict-CSP runtime boot from preloaded assets, opaque blob-worker compatibility, candidate JS/native bridges, descendant teardown, and browser resource-exhaustion behavior. Coordinator should request independent re-review of concrete source, effective CSP and recorded adversarial evidence before arbitrary student execution is enabled.

## Independent implementation review — 2026-10-27 04:31 UTC

Reviewer: `/root/runner_security_review`; second parent-requested task, source inspection only, approximately ten-minute budget. Read `src/runtime-lab/lab.mjs`, `supervisor.mjs`, `worker.mjs`, `server.mjs`, and `workflow/scripts/run-runtime-probes.mjs`; narrowly inspected the cached Java loader for host imports/evaluation. No browser or submitted-source execution by this reviewer. This is a changing prototype snapshot, not approval of subsequent edits.

The inspected implementation preserves the essential boundary: opaque frame without `allow-same-origin`, trusted supervisor, worker blob created in that frame, student source delivered only to the worker, deny-all connect policy, exact-map asset shim without network fallback, private parent/supervisor port not passed to the worker, text-only UI output, and static Node server with a fixed file map. Node serves assets and orchestrates the browser; no submitted-source execution path was found in the inspected server/probe script. Worker constructor shadowing is useful hardening but does not replace browser CSP/origin isolation.

### Required repairs communicated immediately to coordinator

1. **Trusted message/state budget is missing.** Supervisor counts retained output bytes but accepts unlimited empty output, invalid messages, and repeated `ready`. A hostile program can call worker `postMessage` directly; worker-side `emit` caps cannot constrain it. Each forged `ready` also causes another parent `run` command. Add a trusted total/rate message budget, per-chunk bound before encoding, one-ready/one-run state, and rejection of unexpected state transitions. Terminate on breach. Huge structured clones remain a documented browser allocation risk even with receiver-side checks.
2. **Preparation is outside the active reservation and deadline.** `run` checks `active`, then awaits `prepare`, and only afterward assigns `active` and starts the 45-second timer. Concurrent callers can create several frames after the same check; stop cannot cancel preparation. Reserve a unique run synchronously, attach an overall preparation/startup deadline, use abortable fetches or invalidation, and only clear active state if it still belongs to that run. Avoid retaining a rejected preparation promise permanently when retry should recover.
3. **Java requires a reviewed CSP exception.** Cached `compiler.wasm-runtime.js` unconditionally constructs `Function` objects while installing `teavmJso`, even when `noAutoImports: true`; that option suppresses auto-import discovery, not JS evaluation or JS bridges. The initial policy's Wasm-only allowance cannot initialize this loader. Coordinator independently reported the matching CSP failure and proposes `unsafe-eval` solely in the isolated runner policy. That is conditionally acceptable with source still exclusively in the worker, no frame evaluation RPC, no application credentials, and unchanged `connect-src 'none'`; repeat all direct hostile-JS bridge/network tests under the **final** relaxed policy. Do not grant eval to the authenticated app origin.

### Other acceptance gaps and concrete follow-up

- App asset fetches currently use default credentials behavior. The loopback static lab holds no app identity, but production integration must explicitly use `credentials: 'omit'` for manifest/assets/bootstrap and a reviewed fixed public manifest. Do not transplant this loader unchanged into the authenticated app and call its loading credential-free.
- Supervisor initialization validates `event.source === parent` and consumes one transferred port once, which is a meaningful binding. It does not check expected parent origin, validate all initialize fields, or carry explicit protocol/run IDs. Bind the expected app origin from trusted bootstrap configuration; use run/version IDs and strict schemas if the lab bridge is retained for application integration. Never trust origin `"null"` alone. The private port already prevents sibling frames from directly injecting run commands.
- Java stdin is not connected in the inspected worker; `data.stdin` is consumed only in Python. Record Java stdin as unsupported until implemented and exercised. Python stdin return semantics, UTF-8 stream boundaries, output limits, compile errors and cancellation require actual runtime checks.
- `run-runtime-probes.mjs` is an observation harness containing two positive controls. It writes results but asserts no expected statuses/output and has no adversarial cases. Its successful process exit must not be reported as passing initialization or security tests. Inspect recorded results and add explicit expected-result assertions before treating it as an acceptance check.
- Probe server `/probe...` counting can detect attempted same-server requests, including ones denied by CORS after sending. It does not by itself prove absence of requests to arbitrary origins or WebSocket handshakes; include browser request interception/logging plus controlled recorders and positive recorder controls. Test credentialed side effects with synthetic canaries, not just successful response reads.
- Parent reported that Chromium's opaque blob **module** worker failed generically while a classic blob worker started. This reviewer did not reproduce either. Source now uses `new Worker(workerURL)` with dynamic module imports, so the worker's “module worker” comment is stale. Preserve the observed browser/version and exact source variant in results; do not infer cross-browser support.

Disposition: **repairs and measured adversarial checks required** before enabling arbitrary student execution. No direct credential-access/server-execution path identified in the inspected boundary, but the message-flood and preparation-lifecycle defects prevent claiming the required bounded/cancellable behavior. Final review should inspect the repaired source and final effective CSP together with evidence; no actual browser security test is claimed here.

## Repair re-review — 2026-10-27 04:36 UTC

Reviewer `/root/runner_security_review` reread current `lab.mjs`, `supervisor.mjs` and `worker.mjs` at the coordinator's request. This remains source inspection, not reviewer-executed runtime testing. Coordinator reports successful Python/Java hello-world initialization with the classic worker; independent boundary tester `/root/browser_boundary_tester` is running adversarial checks separately. Neither report is substituted for that tester's eventual recorded evidence.

Source-level dispositions:

- The supervisor now terminates after 4,096 incoming worker messages, counting empty/invalid messages, and permits `ready` only once before moving through `ready` to `running`. This repairs the unbounded empty-output/repeated-ready protocol findings at source level. Rate/large-clone allocation exhaustion remains browser-dependent; a finite receiver budget is not a hard process-memory quota. Java's per-character console messages also consume this budget, so effective output capacity can be lower than 8 KiB.
- A synchronous active reservation now precedes `prepare`, with an abort-driven preparation result and a 45-second overall deadline carried into the frame phase. Concurrent calls cannot pass the previous reservation gap. Stop during preparation invalidates that run and does not create its frame afterward.
- All inspected parent asset/bootstrap fetches now explicitly omit credentials. Worker network CSP remains `connect-src 'none'`. The revised runner-only `script-src` adds `unsafe-eval`, as required by the inspected TeaVM loader, without moving submitted code into the supervisor or parent realm. No source-directed privileged RPC was added.
- Fetch shim now handles URL `.href` as well as Request `.url`, while retaining exact preloaded names and no network fallback. This is a compatibility fix rather than a security boundary; direct native APIs still require CSP tests.

Residual gates/follow-up:

1. Independent browser evidence must exercise the **revised unsafe-eval policy**, not the original policy that could not initialize Java. Asked `/root/browser_boundary_tester` to include direct worker empty-message flood, forged ready, native XHR/WebSocket/import probes, and fresh-run recovery. Verify credentials with synthetic canaries and attempted-request observations.
2. Preparation cancellation currently stops the run's progression but does not abort its shared underlying fetch sequence. Asset fetches have individual 15-second deadlines; manifest/bootstrap fetches do not. The cached promise also retains rejection, so a transient failure cannot recover through a fresh preparation attempt without reload. Record this recovery/resource limitation; remove rejected cache entries and deliberately define abort/shared-cache ownership before app integration. It is not an observed credential or canceled-source execution path.
3. Prior documented gates still apply: Java stdin, final positive/negative result assertions, missing expected-origin/protocol/run-ID validation for eventual app integration, huge structured-clone/memory pressure limits, cross-browser compatibility, and teardown evidence. `totalMs` in the completed frame path starts after preparation, while the parent deadline includes preparation; name/report timing fields accurately when drawing performance conclusions.

Revised disposition: **previous source-level blocking repairs accepted; isolated lab architecture conditionally suitable for measured feasibility work.** No new direct app-credential or server-execution escape identified in these changes. Arbitrary-student-execution acceptance and application integration remain gated on recorded adversarial evidence and unresolved capability/recovery requirements. This reviewer still claims no test execution.

## Final standalone prototype disposition — 2026-10-27 04:43 UTC

Reviewer `/root/runner_security_review` inspected the final preparation loader and output-limit changes, the independent tester's assertion locations, [independent browser results](independent-browser-tests.json), and [coordinator functional results](browser-results.json). Independently computed SHA-256 hashes for `lab.mjs`, `supervisor.mjs`, and `worker.mjs`; all three match the final independent result's recorded source hashes. This final section supersedes the earlier preparation-recovery and Python output-status findings. This reviewer executed file reads/hash checks only; all browser measurements below belong to the named tester/coordinator.

The independent tester `/root/browser_boundary_tester` recorded 11/11 assertions passing during **04:41:21.410–04:41:47.841 UTC**, Chromium **156.0.8078.4**, Windows **10.0.26300 x64**, under the final isolated `unsafe-eval` policy. Evidence includes real browser Python stdin and Java no-input source compilation, parent synthetic cookie/storage positive controls followed by opaque worker access denial, recovered native fetch and XHR GET/POST attempts, WebSocket and script/module import denial, forged-ready rejection, empty-message flood termination, retained output capped at 8,192 bytes with `output-limit`, a Python loop deadline at 303.4 ms of execution, and Stop response measured at 3 ms followed by a successful fresh run. The HTTP recorder's positive control worked and its counter remained **5 → 5** across hostile worker network probes; CSP-blocked request attempts are separately present in the browser trace. These are concrete sampled checks, not a proof covering every browser API, destination, program, or resource-exhaustion strategy.

Preparation now supplies abort/15-second timeout signals to all fetches, omits credentials, and removes rejected cached promises only if still current. Independent assertions cover concurrent-run denial, stopping preparation with subsequent Python success, and a failed Java asset load followed by successful real-source retry. The prior preparation retry/cancellation defects are therefore closed for the tested path. The final worker explicitly posts `output-limit` before propagating output overflow, and the independent rerun verifies the corrected status; the JSON retains the earlier failure rather than hiding it.

The coordinator's functional artifact records nine confirmed behavior checks passing, plus **two failed Java stdin acceptance gates**: `java.util.Scanner` is unavailable at compilation, and a minimal `System.in.read` program reaches a runtime error. Java runtime error detail is currently generic (`Error: (could not fetch message)`). Browser compilation/execution of a no-input Java program is demonstrated; complete Java capability is **not accepted**. The independent tester did not claim Java stdin support or Java-specific stop/flood coverage.

**Final decision:** the standalone Chromium prototype provides sufficient source and independent sampled evidence for the proposed credential-free, network-denied browser boundary to remain a feasible design candidate. No direct app-credential or server-execution escape was found in the reviewed implementation and tested cases. This is **not production approval, not approval to enable arbitrary submissions in the authenticated app, and not Java runtime adoption/acceptance**.

Remaining gates are full Java stdin and meaningful diagnostics; Java-specific abuse/cancellation checks; final application bridge expected-origin/version/run-ID validation and effective deployed policy review; Firefox/WebKit measurements; and broader lifecycle/large-clone/allocation-pressure cases from the original matrix. Browser workers/frames supply no hard process memory quota or guaranteed worst-case timing isolation. Authentication integration, real credentials, deployment, arbitrary-origin network coverage, and formal sandbox assurance were not tested. Preserve the standalone boundary and rerun security evidence when runtime assets, bridges, CSP or app integration change.
