# Session: 2026-10-31 Vercel browser runner

- Timezone: Asia/Singapore
- Participants/actual agent IDs: User and `/root`; no specialist agents used
- AI tools/models, where known: Codex, model version not recorded
- GitHub issue: [#31](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/31)
- OpenSpec change: `build-programming-platform`, issue 31 section and task group 13
- Branch and commits: `feat/31-vercel-browser-runner`, based on `develop`; `6e9adeb` (`feat(runtime): enable hosted browser runner on Vercel`), `a764b06` (log commit evidence), `ed89e6e` (PR link), `bea8034` (handoff log), final Vercel Preview status update, `4581d1b` (`feat(runtime): bundle browser assets in app deployment`), same-project verification/log follow-ups, and `cd36130` (`fix(ci): repair scaffold links and lint blockers`).
- Pull request: [#32](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/pull/32), draft to `develop`
- Human verification: pending
- Verifier/date:

## Prompt and interaction summaries

1. The user reported that the Run code action requested a local port-3130 runner. Inspection found that the client hardcoded `http://127.0.0.1:3130` and the normal hosted student page disabled execution.
2. The user asked to simplify the runtime setup with Pyodide and a Java option rather than separate manual fetching/runner startup. Research and the feasibility notes identified Pyodide and TeaVM-javac as the retained browser candidates; CheerpJ was not selected.
3. The user clarified the requirement to run as both students and instructors on Vercel Preview and Production and confirmed TeaVM. Decision: keep execution and compilation in the browser, with a second static Vercel project on a separate credential-free origin to preserve the app/runner policy boundary. The app pairs branch previews and takes one explicit production runner origin.
4. Published commits `6e9adeb` and `a764b06`, pushed `feat/31-vercel-browser-runner`, and opened draft PR #32 to `develop`. The PR records the passing local checks and the remaining license/provenance and hosted-smoke gates.
5. GitHub reported the Vercel app Preview build as successful for the pushed branch. An interactive browser host was unavailable, and the separate static runner project has not been deployed, so no user-role/language smoke was claimed.
6. The user asked to ignore `next-env.d.ts` and simplify Preview/Production to one Vercel project. Added the ignore rule and revised Issue #31's design to serve versioned `/runtime/` files in the app deployment. This supersedes interaction 3's separate-project topology.
7. Same-project security decision: the trusted app client fetches only fixed relative runtime paths with same-origin credentials as needed for protected Preview access, verifies sizes/hashes, and transfers runtime bytes into an opaque `srcdoc` sandbox. The hosted frame uses `sandbox="allow-scripts"` only, validates `event.source`, `event.origin === "null"`, nonce and run IDs, and receives no secrets. Student source is sent only through the in-browser message bridge. Local development keeps the loopback runner.
8. Updated the builder, Next static headers, environment selector, client bridge, asset loader, OpenSpec, plans and notices. The app build omits runtime files while distribution approval is pending and fails closed if approval is enabled with incomplete notices or changed assets.
9. Final local verification passed, and committed the same-project implementation as `4581d1b`. The runtime asset distribution and post-change hosted smoke gates remain pending.
10. Pushed implementation and log commits to the issue branch, updated draft PR #32 to reflect the same-project approach and current checks, and observed a successful Vercel status for commit `7ecd5d6`. This is build status only; no browser execution smoke was run.
11. The user asked what the runtime distribution gate means and asked for failing PR checks to be fixed. GitHub logs showed scaffold README paths incorrectly climbing above `workflow/`, and Application checks failing at ESLint for parameter count, duplicated literals, unused test options and complexity. Corrected the paths, refactored validation into focused helpers, and kept the fetch-credentials assertion explicit. Committed as `cd36130`.

## Work and verification

- Linked Issue #31 and added the Vercel deployment contract, task group 13 and implementation plan to the active OpenSpec change.
- Added same-project Preview/Production runtime selection, strict opaque-frame bridge checks, same-origin manifest/asset loading, parent-side byte/hash verification, and runtime transfer into the sandbox. Existing student and owner-authorized instructor wiring remains shared.
- Reworked the static build to stage a fixed bridge tree and approved assets into `public/runtime/`, version all paths by bridge/asset/notice hashes, fail on mismatched bytes/notices, and remove stale output when distribution approval is pending. Removed the second-project Vercel configuration.
- Updated the Vercel setup guide for one app project and protected Preview same-origin requests. Added Next cache headers for versioned runtime files and `next-env.d.ts` to `.gitignore`.
- Checks actually run in the feature worktree:
  - `pnpm run test:unit`: 139 tests passed across 18 files.
  - `pnpm run lint`: passed.
  - `pnpm run typecheck`: passed.
  - `pnpm run build`: passed with Next.js 16.4.3.
  - `pnpm run format:check`: passed.
  - `pnpm run spec:validate`: all six OpenSpec items passed strict validation.
  - `git diff --check`: passed.
  - GitHub combined status: the existing app's Vercel Preview build passed; this is deployment/build evidence only, not a browser smoke or a static-runner deployment.
  - Focused static artifact tests use controlled fake asset bytes to verify fixed output, emitted host policy, SHA mismatch rejection and the distribution approval gate.
  - `node workflow/scripts/build-static-runtime.mjs`: stopped before download as designed because exact distribution review is pending.
- Same-project follow-up checks:
  - Focused same-project tests: 15 passed across 4 files, covering Python/TeaVM asset loading, same-origin credentials, hash/path rejection, opaque-frame source/nonce checks and builder gates.
  - Full unit suite: 142 passed across 20 files.
  - `pnpm typecheck` and `pnpm lint`: passed after adding the same-project loader and frame bridge.
  - `pnpm build`: passed through the new runtime staging command; with distribution approval unset, it reported runtime files omitted and completed the Next.js 16.4.3 production build.
  - `node --check` passed for `src/runtime-lab/lab.mjs` and `workflow/scripts/build-static-runtime.mjs`.
  - `pnpm format:check`: passed.
  - `pnpm spec:validate`: all six OpenSpec items passed strict validation.
  - `git diff --check`: passed.
- Environment limitation: local Node.js was v24.16.0; the repository pins v24.22.1. The prior [Vercel Preview build](https://cs3227-mp4-git-feat-31-verc-678108-john-wongs-projects-9a7f897d.vercel.app) predates the same-project changes and is not evidence for this head. No post-change hosted Preview/Production smoke was performed. The Java playground assets still lack reproducible source-release mapping; complete upstream notices and independent license/security review remain open. Hosted runtime assets must stay omitted until that gate passes.
- `next-env.d.ts` is now ignored, but remains tracked in Git; the request was to add the ignore rule only. No secrets or runtime binaries were added.
- GitHub reports the Vercel status as successful for pushed commit `7ecd5d6`; this does not establish a Python/Java browser smoke, and no post-change role/language smoke was performed.
- CI repair verification: `pnpm check:scaffold`, `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test:unit` (142 passed), `pnpm build`, and `pnpm site:build` passed. `pnpm test:e2e` passed 27 tests and skipped 12 credentialed/runtime-gated cases; real hosted Python/Java execution was not tested.
- GitHub's original Application workflow database job passed; its application job stopped at lint. The original Scaffold workflow failed only on the two runtime README links. The corrected changes are committed but the GitHub workflows have not yet rerun on the new head.
- Next steps: push `cd36130` and its log follow-up, verify the PR workflows rerun, and keep actual runtime distribution plus hosted role/language smoke gated on provenance and license/security review.
