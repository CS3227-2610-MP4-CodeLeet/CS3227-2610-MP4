## Why

Issue [#171](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/171) concerns offset-based submission history. A local database-backed browser regression reproduced a duplicated revision after a new revision was inserted between pages.

## What Changes

- Replace offset navigation with validated timestamp/ID cursors for student submission history.
- Preserve Next/Previous, 25-row pages, newest-first display, filters and current ownership/course authorization.
- Reset legacy numbered URLs without a cursor to the latest page; expose a Latest submissions link for fresh results.
- Add failing-first browser and unit regressions, then update verified guide behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `assignments-and-grading`: stable private submission-history navigation across new revision inserts.

## Impact

Student history loader, cursor validation/navigation, history presentation, course submissions page and associated tests. No new dependency, database migration or change to official submissions, grades or XP. Instructor submission review is outside this fix.
