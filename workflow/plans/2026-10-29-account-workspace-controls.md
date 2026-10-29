# Account and workspace controls

Issue: [#15](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/15). Active OpenSpec: `build-programming-platform`.

The requester specified confirmation/visibility controls, theme coverage, sign-out, removal of redundant Home navigation and sample wording, and asked why Run is missing. Reuse the existing theme store and practice runner. Share theme tokens across account and application pages. Keep fixture labeling only in the explicitly enabled fixture mode; select authenticated mode in the requester's ignored local settings. Use the real assignment workspace with session-backed sign-out. Signup must reject mismatched passwords before an auth request. Each eye button is independent and accessible. Sign-out failure must remain on the page and allow retry.

Run is connected only for development with `STUDENT_RUNNER_PREVIEW_ENABLED=true`; it uses the existing isolated loopback runner and never sends code to Next.js for execution. The real MVP still accepts Python/8,000 characters; Java, teacher test persistence and hosted runtime distribution are separate contracts, unchanged here. No model keys or database schema changes.

## Plan

- [x] Write browser regressions for account theme, password visibility/mismatch, navigation/sign-out and real assignment Run; observe failures.
- [x] Add reusable account password fields, app theme wrapper and failure-aware sign-out. Apply the workspace to authenticated assignments without sample labels or Home links.
- [x] Connect the existing practice runner to the same source used by authenticated submissions, gated to local development, retaining deadlines and cleanup. Refresh revision history without clearing the editor.
- [x] Verify focused browser journeys, unit/lint/types/build/spec/scaffold checks; update guides and sanitized summary with actual limitations.
- [x] Commit focused verified work, push and open a linked PR to develop: [PR #16](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/pull/16). No merge/deployment.
