# Session: 2026-10-31 Vercel browser runner

- Timezone: Asia/Singapore
- Participants/actual agent IDs: User and `/root`; no specialist agents used
- AI tools/models, where known: Codex, model version not recorded
- GitHub issue: [#31](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/31)
- OpenSpec change: `build-programming-platform`, issue 31 section and task group 13
- Branch and commits: `feat/31-vercel-browser-runner`, based on `develop`; `6e9adeb` (`feat(runtime): enable hosted browser runner on Vercel`), `a764b06` (log commit evidence), `ed89e6e` (PR link), `bea8034` (handoff log), plus the final Vercel Preview status update.
- Pull request: [#32](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/pull/32), draft to `develop`
- Human verification: pending
- Verifier/date:

## Prompt and interaction summaries

1. The user reported that the Run code action requested a local port-3130 runner. Inspection found that the client hardcoded `http://127.0.0.1:3130` and the normal hosted student page disabled execution.
2. The user asked to simplify the runtime setup with Pyodide and a Java option rather than separate manual fetching/runner startup. Research and the feasibility notes identified Pyodide and TeaVM-javac as the retained browser candidates; CheerpJ was not selected.
3. The user clarified the requirement to run as both students and instructors on Vercel Preview and Production and confirmed TeaVM. Decision: keep execution and compilation in the browser, with a second static Vercel project on a separate credential-free origin to preserve the app/runner policy boundary. The app pairs branch previews and takes one explicit production runner origin.
4. Published commits `6e9adeb` and `a764b06`, pushed `feat/31-vercel-browser-runner`, and opened draft PR #32 to `develop`. The PR records the passing local checks and the remaining license/provenance and hosted-smoke gates.
5. GitHub reported the Vercel app Preview build as successful for the pushed branch. An interactive browser host was unavailable, and the separate static runner project has not been deployed, so no user-role/language smoke was claimed.

## Work and verification

- Linked Issue #31 and added the Vercel deployment contract, task group 13 and implementation plan to the active OpenSpec change.
- Added local/Preview/Production runner-origin resolution, strict generated app-origin policy, configurable iframe targeting, student assignment wiring and the shared runner on the authenticated instructor submission-review page.
- Added a deterministic Vercel static build project. It stages a fixed bridge tree, fetches only approved manifest hosts, verifies exact byte sizes and SHA-256, writes digest-versioned paths and includes license-notice files. Its build fails closed while notices/provenance are unreviewed.
- Added a Vercel setup guide with project settings, branch pairing, nonsecret environment values, public static asset/protection requirements and post-clearance smoke procedure.
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
- Environment limitation: local Node.js was v24.16.0; the repository pins v24.22.1. The existing app's [Vercel Preview build succeeded](https://cs3227-mp4-git-feat-31-verc-678108-john-wongs-projects-9a7f897d.vercel.app), but the separate runner project is not configured/deployed and no student/instructor browser smoke or Production verification was performed. The browser access host was unavailable. The Java playground assets are fingerprinted but do not yet map to a reproducible source release; complete upstream notices and independent license/security review remain open. Runner Preview and Production builds must not bypass this gate.
- No changes were made to the original checkout's unrelated `next-env.ts` edit; all feature changes remain in the isolated worktree. No secrets or runtime binaries were added.
- Next steps: complete and independently review exact runtime notices/provenance; configure the static Vercel project and app variables; run the Preview role/language/network/credential smoke; keep Production smoke gated until clearance; then update Issue #31/OpenSpec/log and PR with real evidence.
