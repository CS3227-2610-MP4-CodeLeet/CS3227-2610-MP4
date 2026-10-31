# Issue #31 same-project runtime deployment

## Topology

Use the existing Next.js Vercel project. Its build may publish fixed, versioned static runtime files beneath `/runtime/` in the same deployment. The app client fetches the manifest, bridge modules and approved runtime bytes through relative same-origin paths, verifies hashes/lengths, and transfers them into a fresh opaque sandboxed `srcdoc` iframe. Python and Java compilation/execution remain entirely in browser workers. There is no second Vercel project, remote execution/compiler endpoint, or runner-origin pairing.

The hosted iframe uses `sandbox="allow-scripts"` without `allow-same-origin`. The child has an opaque origin; the parent accepts messages only from that exact iframe window with a fresh nonce and valid run ID/protocol/result. The parent targets the opaque child with `*` only for that exact window and sends no credentials or secrets. The inner worker CSP denies network access. The app CSP does not receive the runtime's eval allowance.

## Vercel configuration

Keep the existing app project, repository connection, root directory, build command and Preview/Production environments. No runner project or runner origin variables are needed. Enable automatic Vercel system environment variables as already configured for the app. Same-origin relative requests from the browser allow protected Preview deployments to use Vercel's normal access session; this session is sent only to the app's own deployment. Runtime requests contain no source code. Continue using distinct Preview/Production Supabase environment values and normal application authorization/RLS.

The only additional nonsecret environment value is `BROWSER_RUNTIME_DISTRIBUTION_APPROVED=true`, set only after exact asset provenance, full notices and distribution review are approved. While absent or false, the build removes/omits generated runtime files and succeeds with hosted Run unavailable. When true, the build must verify every exact manifest size/hash and complete notice before packaging; any mismatch fails the app build. Do not set this flag to bypass pending review.

## Runtime distribution and caching

Build from only `workflow/evidence/runtime-feasibility/assets.json` and the fixed first-party bridge file list. Write outputs to `public/runtime/` using versioned paths. Runtime assets receive `Cache-Control: public, max-age=31536000, immutable`; the bootstrap/manifest receive revalidation or no-store headers. Parent-side fetches use relative same-origin URLs, the normal same-deployment browser session where needed, and explicit integrity checks. The opaque iframe receives only public runtime bytes through its nonce-checked message bridge. User source/results never enter an HTTP request or Vercel Function.

The checked-in notices intentionally say `REVIEW REQUIRED`; the build must continue omitting runner artifacts until review is complete. Pyodide's bundled CPython/stdlib obligations are not assembled, and TeaVM playground binaries do not have a reproducible source release mapping. Production activation and claims remain pending until exact notices/provenance, independent security review and real Preview/Production smokes are complete.

## Verification after deployment clearance

For a Preview, confirm the app's runtime paths are served by the same deployment. Run Python and Java for a student assignment and an instructor-owned submission. Inspect browser network logs: runtime requests are same-origin static GETs, no request body contains source, the opaque runner/worker makes no network request, and no submission/grade/publication/XP state changes. Check forged/wrong-window messages, wrong nonce/run IDs, failed integrity, stop/deadline and rerun behavior. Production smoke remains pending until distribution review and human security review are recorded.
