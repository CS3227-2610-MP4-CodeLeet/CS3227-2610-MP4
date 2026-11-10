# Illustrated Empty States

## Intent

Give every user-facing data view a clear, illustrated zero-data state so an empty course, list, or activity view reads as intentional and helps the user decide what to do next.

## Goals and boundaries

- Cover empty collections, filtered no-results, and zero-activity summaries throughout course and platform views.
- Keep each view's accurate copy and role-aware next action.
- Distinguish a successful empty result from loading, errors, unavailable data, empty editor inputs, and empty program output.
- Do not change data fetching, authorization, or product capabilities.

## Approaches

1. **Shared illustrated component with semantic variants (selected).** Build one accessible component using local inline SVG illustrations, compact and standard layouts, and optional actions. Views supply their heading, explanation, illustration kind, and permitted action. This keeps empty states consistent and easy to maintain while allowing context-specific artwork.
2. **Custom artwork in every feature.** Gives each screen maximum visual freedom but duplicates layout/accessibility behavior and creates inconsistent maintenance.
3. **Reuse existing icon-only states.** Has the lowest implementation cost but does not provide the requested illustrated empty states.

## Implementation decisions

- Use React/SVG and existing Tailwind tokens; add no image, icon, or runtime dependency.
- Mark decorative SVG as hidden from assistive technology; expose heading and explanation as semantic text.
- Provide a compact size for embedded sections and a standard size for primary lists and pages.
- Keep links/buttons optional and supplied by each view so existing role and lifecycle checks remain authoritative.
- Cover course and admin directories, student and instructor assignments/submissions, forum threads/replies, grades and progress summaries, AI usage, XP/leaderboard, context comparison, filtered no-results, and published practice-case views.
- Exclude loading/error/not-found views, empty form controls, and empty runtime output. A zero-case authoring or published-case list is in scope.

## Constraints

Use the active `build-programming-platform` OpenSpec change, issue #134, and a dated `logs/` summary. Preserve the unrelated `next-env.d.ts` edit. Add behavior-focused component/view tests before implementation and run applicable checks before marking OpenSpec tasks complete.
