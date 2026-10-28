# Spec-driven specialist workflow

This document defines a planned process. It does not claim agents have executed it or automatically enable agent runtime discovery.

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
