# Spec-driven specialist workflow

This document defines a planned process. It does not claim agents have executed it or automatically enable agent runtime discovery.

## Issue-to-PR workflow

1. Find or create a GitHub issue before implementation; reuse an issue only when it clearly covers the change.
2. Link the issue to an active OpenSpec proposal/spec/design/tasks. Use OpenSpec status and operation instructions; update artifacts when scope or decisions change.
3. Use relevant repository-local Superpowers skills for design/planning, TDD implementation, debugging, verification, review and branch closeout. These are process gates, not evidence that a skill or independent reviewer ran.
4. Work on a Conventional Commit branch from `develop`. Commit related verified changes incrementally and stage only the owned files.
5. Maintain the per-change `logs/` summary throughout implementation. Before PR creation/update, summarize each prompt and interaction chronologically, including user requests/steering, actual participants/handoffs, decisions, artifacts, checks, limitations, branch/commits, and links to the issue/OpenSpec/PR. Do not copy raw transcripts or sensitive content; keep human verification pending until reviewed.
6. Once implementation and applicable checks are complete, push the branch and create or update a PR to `develop` linked to the issue, OpenSpec change and log summary. Review/merge/deployment/release remain separate human decisions.

## Smallest useful coordination

1. Coordinator selects a capability and acceptance scenarios from an OpenSpec change, records owner, budget, dependencies, and allowed files.
2. Planner clarifies design and interfaces. Security specialist reviews boundaries when auth, AI, execution, or shared data changes.
3. Coordinator assigns a bounded implementation task to an implementer. Delegate only when the current task authorizes multi-agent work; do simple edits directly and record why.
4. Implementer reports changes, tests, unresolved issues, and evidence paths through a handoff.
5. A separate reviewer checks the implementation against scenarios and security requirements. A tester reproduces the relevant checks where useful; these may be the same specialist on a small task, but the author cannot claim independent review of their own work.
6. Coordinator resolves conflicts, integrates shared changes, runs applicable checks, and records disposition. A human approves grades, releases, and final academic claims.
7. Archive the OpenSpec change only when implementation, documentation, and evidence match it; synchronize accepted specs through OpenSpec.

## Ownership and triggering

Use [role definitions](agents/README.md) and [handoff template](templates/Handoff.md). Role/task allocations describe primary responsibility, not exclusive implementation rights; either team member may implement any task. Coordinate shared schema, generated types, lockfiles, and common services, and give parallel work disjoint write sets with agreed contracts. An agent reports a dependency block rather than polling or editing another task's files.

Record task/agent identifiers, start/end times, parent trigger, input artifact paths, output paths, tests, conflicts, and next owner. Roles in a document are not evidence of live multi-agent coordination; preserve actual runtime identifiers when available.

## Context and resource policy

- Provide brief + relevant scenarios + narrow code pointers + current handoff. Retrieve additional context only when needed.
- Keep stable instructions separate from changing task data. Do not resend entire repositories or transcripts.
- Set time/tool/call budgets before delegation; record measured usage when supplied by tools, otherwise mark unavailable.
- Avoid duplicate analysis by checking existing evidence and assigning one accountable owner per task.
- Stop/reassign blocked work after reporting the dependency. Record retries, idle time, and coordination overhead.
- Record model choice and available resource measurements; never infer hidden reasoning-token counts or provider cache hits from elapsed time.

## Completion record

Each material task links its OpenSpec requirement, implementation, independent review (or clearly stated absence), check results, log summary, and any measured experiments. Unresolved blockers remain open tasks.
