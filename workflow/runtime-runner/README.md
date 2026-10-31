# Browser runtime assets

This directory contains distribution notices for the static browser runtimes. Vercel serves these assets from the existing Next.js app project under `/runtime/`; this folder is not a separate project root.

The app build stages a fixed allowlist of bootstrap/bridge files and runtime assets into `public/runtime/`. It has no execution endpoint, secrets or database access. Python execution and Java compilation/execution remain in the browser's opaque sandbox and worker.

For local development, `pnpm dev` verifies the pinned runtime assets against `workflow/evidence/runtime-feasibility/assets.json`, fetches any missing assets into the ignored `.runtime-cache/`, and starts the loopback static runtime server alongside Next.js. The first run needs network access to the pinned asset URLs; no separate fetch command or runner terminal is needed. `MP4_DEV_SKIP_RUNTIME_FETCH=true` is reserved for automated preview tests that only check startup.

The build omits runtime files while `BROWSER_RUNTIME_DISTRIBUTION_APPROVED` is unset or false. The user-confirmed distribution approval is recorded in `distribution-approval.json` and bound to the exact asset inventory; any inventory change requires a matching review record. Set the Vercel variable to `true` in Preview and Production to stage those reviewed files. An approved build fails on any missing/changed byte or incomplete notice. Do not commit generated runtime distributions or bypass the gate.

Hosted app code fetches the fixed runtime assets through relative same-origin URLs, validates their lengths and hashes, and transfers public bytes into an opaque `srcdoc` sandbox with `sandbox="allow-scripts"`. The sandbox cannot read app storage/cookies or DOM. The worker has no network access. Source and results never go to a server.

See [Issue #31 deployment setup](../plans/2026-10-31-vercel-runner-setup.md) and [runtime feasibility evidence](../evidence/runtime-feasibility/README.md) for current provenance, licensing, security and hosted verification gates.
