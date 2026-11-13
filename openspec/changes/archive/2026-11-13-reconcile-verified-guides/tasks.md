# Guide reconciliation implementation plan

Issue: [#179](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/179). Branch: `docs/reconcile-verified-guides`. Spec: existing engineering-and-delivery accurate-artifacts requirement; no behavior delta (`skip_specs: true`).

## 1. Reconcile canonical guides

- [x] 1.1 Recheck all confirmed inconsistencies and existing controls against current source; record a source-to-claim checklist in the dated log.
- [x] 1.2 Correct User Guide role/access, timestamps, displayed fields, revision review, grading and feedback states; add concise existing lifecycle, AI Usage and administrator directory instructions. Verify by the source checklist and independent documentation review.
- [x] 1.3 Correct Developer Guide Python version and authorized rubric-access boundary; preserve hosted/provider and human acceptance limits. Verify against the pinned notice and authorized instructor page data.

## 2. Verify and publish

- [x] 2.1 Review the documentation diff against the checklist; run explicit Markdown formatting, scaffold, strict OpenSpec and site-build checks; record actual review and limitations.
- [x] 2.2 Commit only this change, push its branch, wait for applicable branch CI, and create a PR to develop with `Closes #179`; verify the PR URL, base, branch and linked artifacts. PR #180 targets develop from docs/reconcile-verified-guides after source-head Scaffold CI passed. Human verification remains pending.

## 3. Review and authorized archival follow-up

- [x] 3.1 Verify PR #180's creation-eligibility comment against the directory page, create_course RPC and existing database regression; correct both the creation instructions and promotion note to include verified active-course instructors with platform Student role.

Final PR-head CI and review-thread resolution are handoff gates recorded in PR #180 after the last commit is pushed. The requester explicitly authorized synchronization and archival on 13 November 2026; merge remains a separate decision.

## Workflow follow-up

- Synchronize the completed pagination delta while retaining existing scenarios, archive both completed active changes, update affected local links and verify empty active-change discovery plus strict spec/scaffold/site checks. Record the requester authorization and actual verification in the log. Archival is a workflow operation rather than an implementation checkbox.
