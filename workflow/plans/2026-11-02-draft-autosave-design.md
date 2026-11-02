# Browser draft autosave and recovery

Status: proposed; awaiting requester approval. The requester selected same-browser/device storage on 2 November 2026. Remaining defaults below are the coordinator's proposals, not previously agreed decisions.

Issue: [#82](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/82). Branch: `feat/draft-autosave`, based on merged develop `1f521a6`. Active OpenSpec: `build-programming-platform`, assignments-and-grading. Summary: [session log](../../logs/2026-11-02-draft-autosave.md).

## Intent and approaches

Preserve unfinished student source after refresh or accidental page/browser closure, without requiring a submitted revision. The existing editor keeps source only in React state and warns before leaving; its source-bound retry/success handling must remain intact.

1. **Persistent browser storage — selected by requester.** Covers returning on the same browser profile/device, with no shared database/API changes. Browser clearing, private-browsing restrictions and device loss can remove drafts. Browser storage is not a boundary against someone using the same browser profile or same-origin scripts.
2. **Account-backed drafts.** Supports switching devices but adds authenticated storage, migration, conflict and lifecycle work. Not selected.
3. **Session-only browser storage.** Survives refresh but cannot reliably cover returning after closing a tab, so does not meet the selected goal.

This is a bounded student-editor change. No new packages, migrations, provider calls or server draft endpoint are proposed.

## Proposed behavior

- Automatically save edited Python/Java source locally after a short pause (500 ms), and flush pending edits on page hiding/departure where the browser allows. Abrupt termination before persistence remains a limitation.
- Display concise states: **Saving draft…**, **Draft saved on this device**, or **Couldn't save draft on this device**. Local persistence is distinct from **Submit revision**. Keep the unsaved-submission warning and never imply a local draft is an official submission.
- When returning to an editor with a different stored draft, offer **Restore draft** and **Discard draft**, with its saved time. Do not overwrite it before the student chooses. Keep the editor disabled until this choice; the original server-provided source remains the baseline when discarding.
- Restoring changes only the editable source. It never mutates immutable submissions. Opening **Continue editing** for a revision uses a separate draft context from the blank editor and from other revisions.
- A successful submission removes the submitted draft only when no newer edits exist. Newer edits made during a save remain recoverable; failed submissions preserve the draft and existing retry behavior. Clear only the current context, not other assignments.
- An empty edited source is recoverable too. Returning exactly to the baseline removes an unnecessary draft. A recovery choice is not itself a submission.
- Successful sign-out clears CodeLeet draft entries on that browser and notifies other open tabs to stop writing the old account's drafts. Canceled sign-out preserves drafts; failed sign-out does not claim success. Auth session loss/account changes disable the old editor's persistence. Never show one account's drafts to another account.
- If another tab changes/removes the same draft, pause autosaving and show a conflict notice. Offer an explicit choice to keep this tab's code or load the other draft; never silently replace the student's visible edits. A sign-out invalidation cannot be overridden as an ordinary draft conflict.

## Storage and boundaries

- Use versioned `localStorage` records scoped by verified server-supplied student ID, assignment ID, assignment language and starting revision ID (or blank context). Do not infer identity from an editable query parameter, username or cached source.
- Store only source, scoped identifiers, version/conflict token and save time. No cookies, credentials, email, rubric, grade, AI prompts or browser results. Treat every stored value as untrusted plain text; validate before reading and never execute or render it as HTML.
- Match the real submission editor's 8,000-character limit and existing UTF-8/Unicode validity constraints. Permit blank drafts while rejecting malformed, oversized, incompatible and expired records. Invalid data must not crash or block the editor.
- Retain drafts for seven days, with at most ten stored contexts in this browser. Prune expired records first, then the oldest other stored context, never silently deleting the pending current recovery candidate. Explain the seven-day/device/sign-out limits in the User Guide, not a wall of editor setup text.
- Handle disabled/full storage without losing visible source or preventing Run/Submit. Show the save failure and retain existing navigation protection. Do not log source or raw records.
- Browser autosave does not change execution isolation, test cases, API submission authorization, grades or XP. Local user IDs separate app recovery contexts; they do not encrypt source on shared devices.

## Verification and delivery

Use failing-first storage/lifecycle tests, real authenticated synthetic Python/Java browser recovery journeys, and targeted checks for account/context isolation, explicit revision baselines, sign-out across tabs, malformed/expired/over-limit records, storage failures, multi-tab conflicts, failed saves and newer edits during submission. Check accessible restore controls, mobile layout and both themes. Update User Guide only after verified behavior exists.

After approval, write the implementation plan and update the active OpenSpec artifacts. Keep an actual dated interaction/check log, request a bounded independent source review, run applicable app/browser/security checks and pass branch CI before opening the linked PR to develop. Verify final-head CI before handoff; merge, hosted verification and release remain separate.
