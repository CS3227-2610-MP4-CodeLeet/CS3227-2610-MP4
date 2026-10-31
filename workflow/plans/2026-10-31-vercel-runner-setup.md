# Issue #31 Vercel runner deployment setup

## Topology

Use two Vercel projects connected to this repository and the same production branch:

1. The existing Next.js application project keeps authentication, Supabase and all user data.
2. The `workflow/runtime-runner` project builds the versioned static files in `workflow/runtime-runner/.runner-dist`. It has no application secrets, serverless functions, source execution endpoint or authenticated data.

Each app Preview computes the runner's branch alias from `VERCEL_BRANCH_URL` and the configured app/runner project slugs and Vercel scope. Production uses the explicit `BROWSER_RUNNER_PRODUCTION_ORIGIN`. The generated bridge policy accepts only the configured production app origin and constrained Vercel app-project branch/unique deployment hosts for that same scope.

## Vercel configuration

Create the runner project from the same repository and set Root Directory to `workflow/runtime-runner`, Framework Preset to `Other`, and let the checked-in `vercel.json` select the Node build command and `.runner-dist` output. Enable **Include source files outside of the Root Directory in the Build Step** because the build script and canonical bridge sources are shared elsewhere in this repository. Vercel Git integration should create branch Previews and a Production deployment from the same branch mapping as the app. Turn off Deployment Protection on the runner project because a browser iframe cannot provide Vercel's bypass credentials. The runner contains public, credential-free code and assets only. Keep normal app protection enabled where required.

App project variables in Preview and Production:

- `BROWSER_APP_VERCEL_PROJECT_SLUG`
- `BROWSER_RUNNER_VERCEL_PROJECT_SLUG`
- `BROWSER_VERCEL_SCOPE_SLUG`
- `BROWSER_RUNNER_PRODUCTION_ORIGIN` (exact runner HTTPS origin)

Runner project variables in Preview and Production:

- `BROWSER_APP_VERCEL_PROJECT_SLUG`
- `BROWSER_VERCEL_SCOPE_SLUG`
- `BROWSER_APP_PRODUCTION_ORIGIN` (exact app HTTPS origin)
- `BROWSER_RUNTIME_DISTRIBUTION_APPROVED=true` only after independent review of exact asset provenance and full notices

These are identifiers/origins, not secrets. Do not place an auth bypass token or application key in either browser-facing project.

## Runtime and distribution gate

The static build downloads only entries in `workflow/evidence/runtime-feasibility/assets.json`, allows only the pinned upstream hosts, checks both recorded size and SHA-256, and writes assets under paths containing the complete digest. It copies only the fixed runtime bridge files and both notice files. Vercel caches digest paths for one year as immutable; the bridge HTML is not cached. Runtime and user code execute in the existing browser sandbox/worker. All browser asset fetches omit credentials and the worker network policy remains denied.

The checked-in runtime notice files intentionally say `REVIEW REQUIRED`, and the build rejects them. Pyodide's bundled CPython/stdlib obligations are not assembled, and the TeaVM playground binaries do not have a reproducible source release mapping. The feature can be integrated and locally tested, but the hosted static build, Preview smoke and Production smoke remain blocked until the exact notice/provenance review is complete. Do not toggle the approval variable to work around that gate.

## Verification after deployment clearance

For each Preview, confirm the app and runner branch aliases refer to the same Git branch. On student assignment and instructor-owned submission pages, run a Python and a Java example. Inspect browser network logs for credential-free static asset fetches only; verify no submitted source/result request reaches an app route or Vercel Function. Confirm wrong-project, wrong-scope and unrelated tenant origins do not initialize the bridge. Verify no submission, grade, publication or XP mutation occurred. Keep Production smoke pending until clearance and a human security review have been recorded.
