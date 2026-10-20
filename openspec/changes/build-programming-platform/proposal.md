## Why

Students need simple programming practice and submission workflows; instructors need controlled AI assistance for feedback and grading. CS3227 MP4 requires demonstrated SDD, specialist-agent coordination, AI security, context engineering, and resource-aware use.

## What Changes

- Add student/instructor authentication, trusted instructor provisioning, and text profiles.
- Add instructor-owned assignments, private rubrics, immutable code revisions, and explicit grade publication.
- Add single-file Python execution and Java source compilation/execution entirely in the browser, with stdin, diagnostics, cancellation and verified isolation. Select packages only after feasibility experiments.
- Add distinct SoCLaaS student hints and instructor grading suggestions with authorization, validated output, quotas, scoped caching and usage metadata.
- Add discussion threads/replies, server-controlled XP awards and a seeded leaderboard.
- Establish specialist coordination evidence, security/resource experiments, guides and separate deployment environments.

Exclude uploads, badges, arbitrary student dependencies, server execution and autonomous AI grade publication. All product features remain proposed.

## Capabilities

### New Capabilities

- `accounts-and-access`: Identity, profiles, trusted roles, and ownership boundaries.
- `assignments-and-grading`: Assignment lifecycle, immutable submission revisions and approved grades.
- `browser-code-execution`: Client-only Python and Java practice, isolation, diagnostics and cancellation.
- `role-aware-ai`: SoCLaaS assistance with private-context separation and resource controls.
- `community-and-xp`: Text discussions, idempotent XP and deterministic leaderboard ordering.
- `engineering-and-delivery`: SDD/agent evidence, experiments, deployment and submission artifacts.

### Modified Capabilities

None; new project.

## Impact

Creates a fresh Next.js/Supabase application, browser adapters, SoCLaaS gateway, tests and deployment. Verify runtime compatibility, Java compilation, licensing, download size and provider limits before dependency selection. No previous MP implementation is reused.
