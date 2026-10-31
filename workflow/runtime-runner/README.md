# Vercel static browser runner

This folder is the root of a second Vercel project connected to the same Git repository as the Next.js app. Its only output is static HTML, JavaScript, reviewed notices and hash-verified runtime files. It has no app secrets, database access, request handler or code-execution endpoint. Submitted source stays in the browser and passes to the isolated runner using the validated `postMessage` bridge.

## One-time Vercel project setup

Create a Vercel project for this repository with:

- Root Directory: `workflow/runtime-runner`
- Include source files outside the Root Directory in the Build Step: enabled. The build script and canonical browser runtime sources live elsewhere in this repository.
- Framework Preset: `Other`
- Node.js Version: `24.x`
- Build command: use the checked-in `vercel.json` (`node ../scripts/build-static-runtime.mjs`)
- Output Directory: `.runner-dist`
- Install Command: use the checked-in `vercel.json` (`true`); the build uses Node built-ins only
- Git deployments: Preview deployments for branches and Production for the same production branch as the app
- Deployment Protection: disable it for this static project so the iframe can fetch public files without an auth wall; keep the project free of secrets and private data

Do not configure an auth-bypass secret in the app or browser. Vercel system values supply `VERCEL_ENV` and `VERCEL_BRANCH_URL` to the app project at runtime.

## Environment values

Set these nonsecret values on the app project in Preview and Production:

| Variable | Value |
| --- | --- |
| `BROWSER_APP_VERCEL_PROJECT_SLUG` | Exact app project slug from Vercel |
| `BROWSER_RUNNER_VERCEL_PROJECT_SLUG` | Exact static runner project slug |
| `BROWSER_VERCEL_SCOPE_SLUG` | Exact Vercel account/team URL slug |
| `BROWSER_RUNNER_PRODUCTION_ORIGIN` | Exact HTTPS origin of the runner's Production deployment, with no path |

Set these values on the static runner project in Preview and Production:

| Variable | Value |
| --- | --- |
| `BROWSER_APP_VERCEL_PROJECT_SLUG` | Exact app project slug |
| `BROWSER_VERCEL_SCOPE_SLUG` | Exact Vercel account/team URL slug |
| `BROWSER_APP_PRODUCTION_ORIGIN` | Exact HTTPS origin of the app's Production deployment, with no path |
| `BROWSER_RUNTIME_DISTRIBUTION_APPROVED` | `true` only after independent review approves the exact runtime asset sources and complete license notices |

The app derives Preview's runner origin by replacing only the verified app project prefix in `VERCEL_BRANCH_URL`, preserving the branch and scope. Production requires the exact configured runner origin. Missing, malformed or unrelated configuration disables hosted Run code.

## Runtime distribution gate

The checked-in notices under `notices/` deliberately contain `REVIEW REQUIRED`. The static build fails before publishing runtime bytes until the complete upstream notices, source/provenance obligations and distribution review are complete. The Java playground snapshot currently has pinned fingerprints but no reproducible release/source mapping. Do not set the approval variable to bypass this gate.

After the review, run `node ../scripts/build-static-runtime.mjs` from this project root. It downloads only manifest URLs from the approved source hosts, checks each exact byte size and SHA-256, writes hash-versioned asset paths and replaces the generated output atomically. A changed/missing asset fails the build. Vercel caches only those versioned paths as immutable. `embed.html` is uncached so bridge changes take effect with each deployment.

## Branch pairing and smoke checks

Every app branch Preview needs a runner Preview for the same branch. Vercel auto-deploys both from Git; their branch aliases are paired by the project slugs and configured scope. Confirm both deployments completed before testing the app branch alias. The static runner Preview must be publicly fetchable, while the authenticated app Preview can retain its normal protection.

After review and configuration, smoke both Python and Java on a student assignment and an instructor-owned submission in Preview and Production. Verify the browser console/network panel shows requests only to the static runner and approved runtime assets, all asset requests omit credentials, no source/result is posted to an app endpoint, an unrelated origin cannot initialize the bridge, and grade/submission/XP state is unchanged. Record browser/version and deployment URLs in the issue log. Production smoke remains pending until distribution review, independent security review and Vercel project pairing are evidenced.

## Vercel references

- [Static project configuration with `vercel.json`](https://vercel.com/docs/project-configuration/vercel-json)
- [System environment variables](https://vercel.com/docs/environment-variables/system-environment-variables)
- [Generated deployment URL formats](https://vercel.com/docs/deployments/generated-urls)
- [Vercel monorepo shared source files](https://vercel.com/docs/monorepos/monorepo-faq)
- [Deployment Protection](https://vercel.com/docs/deployment-protection)
- [TeaVM overview](https://www.teavm.org/docs/intro/overview.html)
