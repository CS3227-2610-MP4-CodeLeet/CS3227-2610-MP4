# Design

## Context

See [proposal](proposal.md) and issue #179. The canonical Markdown guides feed the existing Docusaurus preparation/build scripts. Current source is the authority for controls, permissions and data fields; existing acceptance records do not prove new hosted checks.

## Goals / Non-Goals

Correct the audited claims and explain existing controls with concise user-facing instructions. Do not change product behavior, runtime isolation, ownership rules, revisioning, quotas or failure handling. No new runtime dependency or Java implementation is selected.

## Decisions

- Edit only canonical guide files; let the existing site preparation generate its copies. Editing generated site pages would introduce a second source of truth.
- Keep implementation pointers and the claim checklist in the dated session summary, so end users see task instructions rather than internal audit details.
- Describe timestamp behavior honestly instead of promising SGT everywhere; changing date formatting belongs to the deferred application work.
- Preserve server-only SoCLaaS credentials and student rubric privacy while explaining authorized instructor access to rubric data.
- Validate prose against current source, Markdown formatting, local links, strict OpenSpec validation and a documentation-site build. Documentation changes do not need new behavioral tests or a repeat of the prior app audit suite. Review and CI results remain distinct from hosted acceptance.

## Risks / Trade-offs

- Source review does not prove every hosted journey: retain the existing hosted/provider acceptance limits.
- Role-matrix cells can imply permission outside the current course: qualify joining as enrollment into another course, with existing memberships unchanged.
- Broad formatting can obscure corrections: preserve the guides' established table/prose layout and check only the edited Markdown explicitly.
- The workspace has an unrelated generated `next-env.d.ts` edit: leave it unstaged and outside this change.

## Migration Plan

No database or application migration. Merge the reviewed PR into `develop` through the normal human process; the existing Pages workflow handles publication. Reverting the documentation commit restores the prior wording.
