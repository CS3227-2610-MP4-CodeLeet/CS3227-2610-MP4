# Unsaved assignment code implementation plan

**Goal:** Protect students from accidentally discarding code in real Python/Java assignment editors.

**Issue:** [#40](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/40). **Branch:** `feat/unsaved-code-guard`, from `develop`. **Spec:** `openspec/changes/build-programming-platform/specs/assignments-and-grading/spec.md`, task group 16. **PR:** pending.

**Execution:** Codex implements inline. No specialist delegation requested; independent teammate review remains pending.

## Design and approaches

The requester approved an unsaved indicator, leave warning, successful-save reset and failure preservation. Keep source and the last successfully submitted source in component state; compare exactly, including whitespace. Initial empty editor is clean. Returning to the saved source clears dirty state. Successful saves acknowledge the submitted snapshot, never newer edits. Running code does not save it. Retry IDs belong to the attempted source so an unchanged failed request can retry idempotently and edited code gets a fresh ID.

Use a focused browser guard installed only while dirty: capture ordinary same-tab link clicks (including server-rendered revision links), a cancelable explicit leave event for sign-out before Auth mutation, native `beforeunload`, and cancelable same-document history traversal through the Navigation API. Exclude hash-only links, downloads and new-tab actions. Clean up all listeners on clean/unmount. Confirmed app navigation removes the unload listener to avoid a second warning; a later new edit re-arms it. Do not patch Next.js internals or add sentinel history entries.

Alternatives considered by the implementer: replacing every Link with a guarded wrapper would require changing unrelated shared navigation and future features; history sentinels would alter Back behavior. Capturing links keeps the feature local and covers existing navigation. Navigation API history cancellation is capability-dependent; older/noncancelable traversals and mobile process termination cannot be guaranteed. Browser reload/close dialogs use browser wording. No persistence, autosave, API/schema changes, new package or source execution changes.

## Tasks and verification

- [x] Write browser regression tests first; run against unchanged product and observe the missing unsaved-state safeguard.
- [x] Implement snapshot acknowledgement, source-bound retries and dirty UI in `src/features/codementor/submission-form.tsx`; add focused hook/browser guard under `src/features/student-submissions/`; ask the guard before `SignOutButton` changes the session.
- [x] Verify Python and Java: edit/revert, canceled history/reload/link/sign-out, accepted revision links and sign-out, failed save retaining source, edits during delayed save, saved code leaves without warnings and listener cleanup.
- [x] Run full unit suite, lint, formatting, Next production build/type checks, relevant real-account browser regressions, OpenSpec/scaffold and diff checks. Use synthetic accounts only and clean them without resetting local data.
- [ ] Update verified guides, dated log and OpenSpec checkboxes, commit focused verified work, push and create a labelled PR to `develop` linking issue/spec/log/checks.

## Review focus

1. A success response for older code must not clear a newer draft's warning.
2. Failed saves and failed sign-out must keep both draft and guard active.
3. Hash links, modified clicks and Run/Menu/theme controls must not prompt or clear state.
4. Navigation between assignment IDs must not retain the prior editor or its listeners.
5. A source change after a failed request needs a new retry ID; unchanged retries keep theirs.

## Evidence

Baseline: 143 unit tests pass on `develop` (`35daede`). Pre-existing generated `next-env.d.ts` changes were carried into the branch; Next regenerated its type references during checks and it is excluded from commits. `.env.local` is untouched.

Implementation verification: 143 unit tests; lint/format; Next production build including TypeScript; strict validation of six OpenSpec items; scaffold/links and whitespace checks pass. Full production Chromium: 18 passed, one local-email recovery prerequisite skip. Six new safeguard journeys cover both languages; the two expanded modified-click/mobile cases also passed after that suite. Real source execution was not enabled for this change. No local data reset or hosted deployment performed. Independent teammate review remains pending.
