# Consolidated test-case editing

Issue: [#168](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/168). Active change: `build-programming-platform`. PR: #167. The user explicitly selected consolidation, superseding the earlier decision to retain the separate publication controls.

## Design and alternatives

The approved design uses the assignment form for all editing (25 total public/private cases). Saving with Published status refreshes student-visible public cases immediately; private cases remain available to instructors reviewing submissions. Marking all cases private or removing all cases clears the public set. Removing a case removes it from instructor review after saving. There is no independent test publication state exposed to users.

Keeping the page with navigation and a 25-case limit was considered; the user chose consolidation to reduce instructor complexity. Existing case storage and public projections remain to preserve data and authorization. Remove the obsolete page, UI, write API/schema and RPC; keep read endpoints used by student practice and instructor preview. A forward migration drops the obsolete RPC without deleting case data. Historical migrations/logs retain their original evidence.

## Implementation plan

- [x] Add failing coverage for retirement of the separate write API/RPC and assignment-only visibility/removal journeys.
- [x] Remove dedicated route/UI and separate mutation contracts, retain authorized reads, and drop obsolete RPC via migration.
- [x] Update database and browser scenarios to use assignment saving, retaining validation/privacy/conflict and both-language practice coverage.
- [x] Update active spec/tasks and guides: remove Developer Guide 3.5; keep User Guide 4.4 student-facing and describe instructor authoring through Edit assignment in 5.4.
- [x] Run focused regressions, full unit/code-quality/documentation/spec checks and database/browser checks where available; preserve unrelated next-env.d.ts changes.
- [x] Record actual outcomes and push/update PR #167 with Closes #168; leave human review pending.

Final handoff gate: verify the latest PR-head CI before reporting readiness. GitHub check results remain authoritative for that gate; human review is still pending.
