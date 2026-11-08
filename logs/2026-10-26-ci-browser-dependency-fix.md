# Session: 26 October 2026, CI browser dependency timeout

- Timezone: Asia/Singapore
- Participants: requester and Codex main session; no specialist subagents
- Human verification: pending

## Report and diagnosis

The requester reported that pnpm exec playwright install --with-deps chromium spent about 14 minutes retrying Ubuntu apt mirrors before cancellation. GitHub run 40329490536 confirms that dependency install, formatting, lint, types, unit tests and build passed; Playwright OS dependency installation was canceled and browser tests were skipped. The job lasted about 15 minutes under its configured timeout. This is an installation/infrastructure failure, not evidence that the browser assertions failed. A subsequent develop bootstrap run passed with the original workflow, so the mirror problem is intermittent rather than universal.

## Fix

Use the official mcr.microsoft.com/playwright:v1.64.1-noble image, matching the pinned @playwright/test version, with preinstalled browsers/system dependencies. Remove the per-job apt/browser install. Retain actions/setup-node from .node-version and explicitly assert Node major 24 rather than using the image's bundled Node version. Keep the 15-minute job budget and bound browser checks to five minutes. Upload failed browser traces with seven-day retention. Update the developer guide's CI setup description.

Official Playwright Docker documentation confirms browser and OS library inclusion and the need to match the package/image version. No app, runtime, auth, database or secret settings are changed. This container is for CI tests, not execution of submitted student code.

PR #6 has merged into develop. The preview PR #7 needs retargeting to develop; its earlier stacked base is no longer the intended merge target. This is routine continuation of the previously authorized feature publication, not authorization to merge it.

## Verification

- YAML/version/format/diff validation: passed; image/package version match and removal of apt install verified. The initial YAML parser invocation needed pnpm's real package path; corrected and reran successfully.
- Local Linux container execution: unavailable; Docker Desktop Linux engine is not running. Hosted run is required for container validation.
- Hosted replacement run: pending push.
- App tests are unchanged; prior preview session records the local 9/9 unit and 9/9 browser pass. Do not claim the new Linux CI job passed until it finishes.
