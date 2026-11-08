# Browser runtime assets

This directory contains distribution notices for the static browser runtimes. Vercel serves these assets from the existing Next.js app project under `/runtime/`; this folder is not a separate project root.

The app build stages a fixed allowlist of bootstrap/bridge files and runtime assets into `public/runtime/`. It has no execution endpoint, secrets or database access. Python execution and Java compilation/execution remain in the browser's opaque sandbox and worker.

For local development, `pnpm dev` verifies the pinned runtime assets against `workflow/evidence/runtime-feasibility/assets.json`, fetches any missing assets into the ignored `.runtime-cache/`, and starts the loopback static runtime server alongside Next.js. The first run needs network access to the pinned asset URLs; no separate fetch command or runner terminal is needed. `MP4_DEV_SKIP_RUNTIME_FETCH=true` is reserved for automated preview tests that only check startup.

Every Vercel Preview and Production build stages the reviewed runtime files into the same app deployment. The user-confirmed distribution approval is recorded in `distribution-approval.json` and bound to the exact asset inventory; any inventory change requires a matching review record. The build fails if an approval record or notice is missing, an asset cannot be fetched, or any downloaded byte differs from its pinned size or SHA-256. The 9 reviewed files total about 19.3 MiB before transfer compression. Generated runtime distributions are not committed.

Hosted app code fetches the fixed runtime assets through relative same-origin URLs, validates their lengths and hashes, and transfers public bytes into an opaque `srcdoc` sandbox with `sandbox="allow-scripts"`. The sandbox cannot read app storage/cookies or DOM. The worker has no network access. Source and results never go to a server.

See [Issue #31 deployment setup](../plans/2026-10-31-vercel-runner-setup.md) and [runtime feasibility evidence](../evidence/runtime-feasibility/README.md) for current provenance, licensing, security and hosted verification gates.
