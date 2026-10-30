# My submissions implementation plan

Issue [#23](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/23), refs #5. Branch `feat/my-submissions` from develop a714fa6. Active OpenSpec `build-programming-platform`, task group 10. Use inline execution and TDD; specialist delegation is not authorized. Preserve the unrelated generated Next declaration edit.

**Goal:** Let a signed-in student find their own immutable revisions across assignments and open existing code/AI feedback/published-grade details.

**Design:** Add `/student/submissions` and an authenticated-only My submissions sidebar/Menu tab. Use the shared workspace for list and existing detail routes, with active navigation and return links. The verified student session plus explicit `student_id` filter and unchanged RLS scope every list request. Select only revision metadata and public assignment title, never source/rubrics/grades. Sort created_at descending then ID descending; fetch 26 rows to show 25 with Previous/Next. Validate page numbers (1–10,000), ignore attempted identity parameters, and handle an empty later page explicitly. Preserve own revisions when joined assignment metadata is hidden using “Assignment unavailable”.

Keep the server loader separate from pure row/page validation and presentation. Render titles as text. Show submitted time in SGT with a machine-readable datetime. The list and detail remain authenticated even in assignment preview mode; no synthetic history fallback. Shared layout guards roles; page guards provide verified identity for reads, following the existing assignment layout/page pattern. Expected query failures render a safe retry state, with a route loading boundary and unexpected-error fallback. No migration, privilege change, dependency, product AI call, remote execution or deployment work.

**Files:** new `history.ts`, `history.server.ts` and unit tests in student-submissions; `history-list.tsx` for list/pagination/empty states; submissions route layout/page/loading/error. Adapt existing detail to shared shell and return navigation. Update workspace navigation, affected navigation tests, real two-student browser tests and documentation/logs.

- [ ] Write failing tests for metadata-only identity-scoped query, page bounds, pagination, hidden metadata and safe errors; add authenticated browser acceptance checks.
- [ ] Implement list/data/route states and shared navigation/detail integration. Verify unit and targeted browser tests before marking complete.
- [ ] Test Python/Java, multiple assignments/revisions, first/second page, empty account, two-student privacy, forged queries, signed-out/instructor denial, hidden grading data, safe title rendering and mobile fit. Run appropriate regressions/static/build checks; no database reset.
- [ ] Update guides/specs/log with actual evidence, perform author review (independent review pending), commit/push focused milestones and create a PR to develop linked to #23/#5. No merge/deployment.
