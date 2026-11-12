# XP pagination consistency design

Issue: [#169](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/169). Active OpenSpec: `build-programming-platform`. Branch: `fix/169-xp-pagination`, based on `d759077`. Status: requester selected change detection and approved this concrete design on 12 November 2026.

## Problem and selected behavior

XP history sorts by mutable award timestamps; leaderboard sorts by mutable totals and display names. Both RPCs use numbered OFFSET pages. An update between page reads can move a previously seen row into the next page or move an unseen row behind the offset. A keyset over mutable fields alone does not establish a consistent view.

The requester selected detecting changes and restarting at page 1 over retaining a frozen snapshot. No old ranking rows will be stored.

## Contract

- Compute an opaque revision fingerprint from the complete authorized result set in the same SQL statement/snapshot as page selection. Bind the revision to course, viewer, and list kind. Include every value that affects ordering, visibility, totals, or displayed rows; leaderboard must include membership and name changes. Never include private rubrics or hidden source.
- First-page responses include the current revision. Previous/Next links carry it. Existing page numbers remain bounded to 1–10,000.
- A later-page request with a missing or mismatched revision returns the current first page with `page=1`, the new revision, and `restarted=true`. No stale later-page rows are returned. The UI renders “XP changed—showing the latest results.” and rebuilds its links from the returned page and revision.
- API and rendered-page consumers share strict token validation. Reject malformed or duplicated token inputs. The revision is a consistency hint, never an authorization credential; every call repeats current membership, verified-identity and feature-access checks.
- Additive RPC arguments and response metadata must preserve legacy database callers where possible. A legacy later-page request cannot silently bypass revision checks. Update strict application DTO schemas and their fixtures together.
- Implement a forward-only migration. Official XP computation, grade publication, ledger and award amounts retain their existing rules. Preserve the unrelated `next-env.d.ts` edit.

## Verification required

Write database regressions before the migration: read page 1 with more than 25 rows, mutate an award so ordering changes, request page 2 with the old revision, and assert a restart with current first-page rows, totals and revision. Cover XP history and leaderboard, unchanged pages, missing tokens, invalid pages, membership changes, renamed students, authorization denial, and withdrawn grades.

Add focused contract, query, route and UI regressions for strict token parsing, carried pagination links, restart notice, and safe errors. Exercise an authenticated browser navigation across a mutation using synthetic local accounts. Run the relevant database and unit suites, lint/type/build/spec/link checks, then final branch CI before PR creation.

## Remaining OpenSpec work

The nine original unchecked tasks are assessed separately in [the evidence matrix](../evidence/2026-11-12-open-platform-tasks.md). Personal approval, independent review and final release are explicit completion criteria. No checkbox is closed by this design.
