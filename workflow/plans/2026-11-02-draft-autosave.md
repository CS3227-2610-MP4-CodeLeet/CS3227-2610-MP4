# Browser draft recovery implementation plan

> For agentic workers: use executing-plans inline, with failing-first tests and one fresh whole-branch reviewer. Requester authorized implementation; continue without another planning approval.

**Goal:** Recover unfinished Python/Java assignment source on the same browser/device.

**Architecture:** A bounded versioned browser repository handles records and invalidation. An editor-local controller manages recovery, debouncing and conflicts; a React adapter subscribes to it and current auth lifecycle. Existing submission snapshot/idempotency remains authoritative.

**Tech stack:** Existing Node 24, Next.js 16.4, React 19, TypeScript, localStorage, Web Locks, Vitest and Playwright. No dependencies or schema changes.

**Spec:** [approved design](2026-11-02-draft-autosave-design.md), OpenSpec `build-programming-platform`.

## Global constraints

- Save after 500 ms; at most ten contexts retained for seven days. Source at most 8,000 characters and 32 KiB UTF-8, well-formed Unicode without NUL; blank drafts allowed.
- Account, assignment, language and starting revision scope derives from verified server data. Sign-out invalidates writers and clears app drafts only.
- No code execution, official grades/XP, raw record logging, server draft storage or provider calls.
- Preserve newer in-flight edits, immutable revisions and existing navigation warnings; storage failure never blocks Run/Submit.

## Review focus

- A suspended tab resumes after sign-out: invalidation must prevent it recreating old drafts.
- Simultaneous tabs must not silently replace visible or pending recoverable work.
- Successful submission with newer edits must retain those edits.
- Deliberately opening a saved revision must not replace another editor context.
- Unsupported/blocked browser APIs and malformed records must leave the editor usable.

## Task 1: Bounded browser repository

Files: new `src/features/student-submissions/draft-storage.ts` and `.test.ts`.
Interfaces: `DraftContext`, `DraftRecord`; `draftKey(context)`, `readDraft(storage, context)`, `writeDraft(storage, {context, source, expected, epoch})`, `clearBrowserDrafts()`. Storage outcomes distinguish conflict, expired/corrupt, invalidated and unavailable.

- [x] Write tests for scope separation, blank/Unicode/bounds, corruption/expiry, ten-context pruning, expected-record conflict, app-only cleanup and invalidation epoch.
- [x] Run `vitest run src/features/student-submissions/draft-storage.test.ts`; confirm missing behavior fails.
- [x] Implement schema validation and bounded repository; serialize mutations with Web Locks in browser adapter, reject unavailable storage safely.
- [x] Rerun tests and commit the verified repository with spec/log updates.

## Task 2: Editor lifecycle and recovery UI

Files: new `draft-controller.ts`, `use-browser-draft.ts`, `draft-recovery.tsx` and tests; modify `use-submission-draft.ts`, `codementor/submission-form.tsx`, authenticated assignment page, `auth/sign-out-button.tsx`, `auth/reset-password-form.tsx`.
Interfaces: controller exposes stable snapshot/subscription plus edit, restore/discard, conflict choice, acknowledge and stop; React adapter binds verified context/auth and cleanup. Existing `submissionAttempt` remains source-bound; autosave acknowledgement receives the exact submitted source.

- [x] Write failing tests for 500-ms persistence, restore/discard gate, page-hide flush, explicit revision context, in-flight acknowledgement, failed storage, conflict choices, unmount and auth invalidation.
- [x] Run focused tests and confirm new assertions fail before implementing.
- [x] Implement controller and UI, provide server-verified student/revision context, subscribe/unsubscribe synchronous Supabase auth callbacks, clear browser drafts only after confirmed sign-out/recovery exit.
- [ ] Run focused storage/lifecycle/render/auth tests, lint/types and commit the integrated feature.

## Task 3: Browser evidence and release-ready PR

Files: new `tests/e2e/draft-autosave.spec.ts`, guides, OpenSpec task/design/spec, dated summary and evidence.

- [x] Add real synthetic authenticated Python/Java tests for refresh/tab-close recovery, submission and privacy; test same-context tabs, invalidation/sign-out, discard, storage error, revision context, themes/mobile.
- [x] Run focused browser tests, then appropriate regression suite and app build, units/coverage, lint/format/types, strict specs/scaffold; record actual outcomes and skips.
- [x] Request fresh bounded source/security review; fix material defects with regression tests, record findings and limitations.
- [ ] Update verified guides and log; commit, push, pass branch CI, create PR to develop with `Closes #82`, then confirm final-head checks. No merge or hosted deployment.
