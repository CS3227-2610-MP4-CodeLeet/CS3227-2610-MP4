# Session: 3 November 2026 — username sign-in and student acceptance

- Timezone: Asia/Singapore
- Participants/actual agent IDs: requester, coordinator Codex `/root`, fresh read-only builder `/root/username_design_check`
- AI tools/models: Codex; exact coordinator model/resource measurements unavailable
- GitHub issue: [#84](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/84)
- OpenSpec change: `openspec/changes/build-programming-platform/`
- Branch and commits: `feat/username-sign-in` from develop `0aca647`; design work uncommitted
- Pull request: not created
- Human verification: pending
- Verifier/date: pending

## Prompt and interaction summaries

1. Requester confirmed the prior feature works, requested email-or-username sign-in with an Email/username field and student acceptance/security evidence, and noted teammate course/workspace work separately. Coordinator read current auth/profile/schema and existing evidence. Current email-only Supabase calls and non-unique profile names mean the change requires actual authentication/uniqueness work.
2. Coordinator presented unique current usernames versus a separate login handle. Requester selected case-insensitive unique usernames. No silent rename or arbitrary owner of an existing duplicate is proposed. Remaining policy/security defaults await approval in the design document.
3. Confirmed draft PR #83 merged, fetched develop `0aca647`, fast-forwarded local develop and created the feature branch. Preserved the existing unrelated `next-env.d.ts` modification; no app or environment edits. Created matching issue #84 and wrote the concrete proposed design.
4. Prepared a dated student acceptance/security matrix from actual source/test inspection. All fresh checks remain marked unrun; the prior 581-unit/84-browser results remain explicitly historical. Existing AI browser flows intercept responses, so they are labeled mocked evidence rather than live-provider security checks.
5. Brainstorming required a fresh bounded builder check. Dispatched `/root/username_design_check` with only design/source pointers, four-minute requested budget, read-only/no-secrets/no-services/no-tests/no-subagents constraints. It identified the legacy-name reservation lifecycle as the only consequential ambiguity. Coordinator proposed explicit claim by the sole remaining legacy owner and release after all owners rename; this remains subject to requester approval with the full design. Reviewer found no other consequential planning gaps and ran no tests. Actual token/cache/cost measurements unavailable.

## Work and verification

- Artifacts: `workflow/plans/2026-11-03-username-sign-in-design.md`, this summary; issue-body scratch file ignored.
- Existing evidence read: prior local 581-unit/84-browser-pass draft feature results and the earlier security audit are historical, not fresh checks for this change. Identified current synthetic student/runtime/grade/revision/AI coverage to reuse.
- Checks: read-only source/schema/evidence inspection, Git/GitHub branch/merge status. No implementation, fresh tests, migration or hosted/provider verification yet.
- Failures/limitations: two guessed profile file paths did not exist; used rg file discovery to locate `src/features/profile/`. Git global-ignore permission warnings did not prevent elevated operations. Supabase markdown changelog fetch has a content-type limitation; verify applicable current docs before implementation.
- Next steps: requester approves the complete design (including proposed legacy policy and server-only lookup/rate-limit configuration), then implementation plan, TDD/acceptance checks and sanitized evidence. Do not mark mock/local results as hosted/live AI security proof.
