# Submission history cursor design

Status: requester approved cursor navigation and this design on 12 November 2026.

## Problem and evidence

Latest develop `0505bea` still reads history using a numbered offset. The new `tests/e2e/history-pagination.spec.ts` regression loaded 25 synthetic own revisions, inserted one newer revision in local Supabase, and followed the previously rendered Next link. It failed because the second page repeated one first-page revision. No hosted or real student data was used.

## Proposed behavior

Keep 25-row Next/Previous navigation and newest-first display. Navigate relative to the last visible row for Next and the first visible row for Previous. Use the immutable pair `(created_at, id)` so equal timestamps remain deterministic. Preserve the database timestamp string, including fractional precision; do not round through JavaScript Date.

The URL carries a bounded, strictly validated cursor containing only a timestamp and UUID, plus one direction and the displayed page number. Reject duplicate, malformed or conflicting cursor parameters before querying. A cursor is a position, never an identity or access grant. Every query still applies the verified student ID, selected course, RLS and title/language filters, and selects metadata only.

Forward reads seek strictly below the cursor in descending timestamp/ID order and fetch one lookahead row. Backward reads seek strictly above it in ascending order, take the nearest 25 and reverse them for display. Newer inserts cannot shift the forward boundary. Previous returns the nearest newer slice; Latest submissions starts a fresh newest-first browse. This is stable navigation, not a frozen snapshot of mutable assignment titles or permissions.

Filter submission/clearing starts a fresh first page and drops cursor state. Refresh and browser Back/Forward retain the position through URLs. Old numbered URLs without a cursor return to the latest page rather than retaining an unstable offset path. Invalid or foreign cursor values cannot widen access. Empty later pages offer a latest-page recovery link.

## Alternatives

Change detection with a restart notice follows the XP pattern but interrupts browsing after every new revision and requires a trustworthy collection revision. A frozen snapshot adds unnecessary state for immutable saved revisions. The requester selected and approved cursor navigation.

## Verification and scope

First run the new real-database browser regression against the old production build: confirmed failure on a repeated revision. After approval, add unit cases for cursor validation, timestamp ties/precision, forward/backward query boundaries, safe failures, filter-preserving navigation and current authorization. Rebuild and rerun the browser regression with inserts between requests, refresh, Previous, Latest and filters. Run the full unit suite, applicable lint/type/build checks, scaffold and strict OpenSpec, then branch/final-head CI before handing off a PR to develop. Keep human verification pending.

No database schema/RLS changes, external execution service, paid model calls or instructor dashboard changes are planned. Preserve the unrelated next-env edit.
