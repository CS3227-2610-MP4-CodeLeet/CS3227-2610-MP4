---
title: Project status
description: Verified implementation status for the CS3227 MP4 project.
---

# Project status

CS3227 MP4 is a Coursemology-inspired programming assignment platform under development.

## Available in the repository

- A Next.js App Router foundation using TypeScript, React, Tailwind CSS, and pnpm.
- Student/instructor sign-in, profiles, published assignments, browser draft recovery, immutable submissions, revision comparisons and deadlines.
- Browser-only Python execution and supported Java compilation/execution, with instructor-published practice cases.
- SoCLaaS learning feedback and instructor rubric suggestions, with explicit instructor grade publication.
- Published grades, text discussion threads/replies and search, instructor-configured XP with private student totals, and a signed-in leaderboard with shared ranks.
- Supabase migrations, role/RLS enforcement and synthetic unit, database and browser checks.

## Still in development

Complete hosted role/browser acceptance, live provider-limit verification and runtime distribution/licensing review remain pending. Local checks do not establish a production release. Browser results do not award grades or XP; XP comes from authorized published grades. Existing assignments start at zero XP, and older grades need instructor review/republishing after the XP migration. Leaderboard lists students with positive XP; zero XP is unranked.

See the [repository](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4) for current source and the [developer guide](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/blob/develop/docs/DeveloperGuide.md) for setup and limits.
