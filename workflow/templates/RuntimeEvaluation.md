# Browser runtime evaluation: <candidate>

Status: not evaluated; do not select a runtime from a feature list alone.

- Language, package, exact version, primary documentation, license:
- Distribution size, hosting/CDN requirements, integrity and update strategy:
- Browser/OS matrix and secure-context/header requirements:
- For Java: demonstrate compilation from source plus execution, without a server compiler:
- Worker support; if absent, isolated frame and hard-stop/reload mechanism:
- Credential-free origin and isolation design; deny-by-default bridge schema:
- Fetch/WebSocket/DOM/storage capabilities and restrictions:
- stdin behavior, stdout/stderr separation, compile/runtime errors:
- Input/output limits, deadline, cancellation, cleanup, and rerun:
- Memory/process limitations actually enforceable in supported browsers:
- Cold/warm load time and resource measurements:

| Scenario | Browser/version | Expected behavior | Actual result | Evidence |
| --- | --- | --- | --- | --- |
| Python hello world or Java source compile/run | TBD | Runs entirely in browser | Not run | TBD |
| stdin and error reporting | TBD | Bounded input and useful diagnostics | Not run | TBD |
| Infinite loop/output flood | TBD | Stop returns UI to usable state | Not run | TBD |
| Attempt network/app credential access | TBD | Denied by verified isolation | Not run | TBD |
| Stop then rerun | TBD | Fresh state; no prior-run leakage | Not run | TBD |

Decision: <accept / reject / investigate>. If no candidate passes, report the blocker; do not silently introduce a server runner or drop Java.
