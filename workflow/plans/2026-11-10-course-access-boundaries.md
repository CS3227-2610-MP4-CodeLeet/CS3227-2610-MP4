# Course access boundaries implementation plan

**Issue:** [#131](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/131)

**OpenSpec:** [build-programming-platform](../../openspec/changes/build-programming-platform/)
**Branch:** `feat/131-course-access-controls` from `develop`

## Goal

Keep join-code access instructor-only, give nonmember platform admins a metadata-only course overview, and restrict ownership transfer to course instructors.

## Approach

- Preserve the existing hash-only code storage and instructor membership gates. Add clear sharing guidance, a copy action, and page/API/database regression coverage for student denials.
- Route nonmember admins to a dedicated admin course overview that reads only course metadata. Keep the ordinary course layout and activity route membership checks intact.
- Filter transfer choices to other instructor members and enforce the same rule in a new database migration; a student must be promoted separately before transfer.

## Verification

- Vitest coverage for course page/card/access behavior and route authorization.
- pgTAP assertions for join-code RPC denial and student ownership-transfer denial, plus successful instructor-to-instructor transfer.
- Run focused and full unit tests, local database tests, typecheck, lint, formatting, production build and strict OpenSpec validation where available. Record exact outcomes in the dated session log.
