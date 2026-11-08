# Issue #31 same-project runtime deployment

## Topology

Use the existing Next.js Vercel project. Its build may publish fixed, versioned static runtime files beneath `/runtime/` in the same deployment. The app client fetches the manifest, bridge modules and approved runtime bytes through relative same-origin paths, verifies hashes/lengths, and transfers them into a fresh opaque sandboxed `srcdoc` iframe. Python and Java compilation/execution remain entirely in browser workers. There is no second Vercel project, remote execution/compiler endpoint, or runner-origin pairing.

The hosted iframe uses `sandbox="allow-scripts"` without `allow-same-origin`. The child has an opaque origin; the parent accepts messages only from that exact iframe window with a fresh nonce and valid run ID/protocol/result. The parent targets the opaque child with `*` only for that exact window and sends no credentials or secrets. The inner worker CSP denies network access. The app CSP does not receive the runtime's eval allowance.

## Vercel configuration

Keep the existing app project, repository connection, root directory, build command and Preview/Production environments. No runner project or runner origin variables are needed. Enable automatic Vercel system environment variables as already configured for the app. Same-origin relative requests from the browser allow protected Preview deployments to use Vercel's normal access session; this session is sent only to the app's own deployment. Runtime requests contain no source code. Continue using distinct Preview/Production Supabase environment values and normal application authorization/RLS.

No runtime distribution environment variable is required. Every Vercel Preview and Production build stages the reviewed inventory. The repository owner confirmed on 2026-10-31 that the completed distribution review covers the existing exact asset inventory. `workflow/runtime-runner/distribution-approval.json` binds that approval to the sorted manifest contents; builds fail if the inventory changes without a matching review record, required notices are incomplete, downloads fail, or any byte differs from the pinned size/hash. The 9 reviewed files total about 19.3 MiB before transfer compression.

## Runtime distribution and caching

Build from only `workflow/evidence/runtime-feasibility/assets.json` and the fixed first-party bridge file list. Write outputs to `public/runtime/` using versioned paths. Runtime assets receive `Cache-Control: public, max-age=31536000, immutable`; the bootstrap/manifest receive revalidation or no-store headers. Parent-side fetches use relative same-origin URLs, the normal same-deployment browser session where needed, and explicit integrity checks. The opaque iframe receives only public runtime bytes through its nonce-checked message bridge. User source/results never enter an HTTP request or Vercel Function.

The notices identify the reviewed Pyodide/CPython and TeaVM/OpenJDK components, upstream license materials, exact runtime hashes and repository-owner approval. The TeaVM playground URLs remain mutable, so the review record binds approval to current manifest hashes and builds reject any byte change; no reproducible TeaVM source-build mapping is claimed. Real Preview/Production browser smokes remain deployment steps.

## Verification after deployment clearance

For a Preview, confirm the app's runtime paths are served by the same deployment. Run Python and Java for a student assignment and an instructor-owned submission. Inspect browser network logs: runtime requests are same-origin static GETs, no request body contains source, the opaque runner/worker makes no network request, and no submission/grade/publication/XP state changes. Check forged/wrong-window messages, wrong nonce/run IDs, failed integrity, stop/deadline and rerun behavior. Production smoke remains pending until distribution review and human security review are recorded.
