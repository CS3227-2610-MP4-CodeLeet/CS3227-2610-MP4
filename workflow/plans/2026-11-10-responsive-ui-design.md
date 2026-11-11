# Responsive UI Audit and Fixes — Design

**Issue:** [#146](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/146)
**Branch:** `fix/146-responsive-layouts` from `develop`
**Active OpenSpec:** `openspec/changes/build-programming-platform/`

## Intent

Review the current CodeLeet application UI across narrow phones, phones, tablets, and desktops, then correct verified layout and interaction problems. The purpose is to make the existing student, instructor, and admin journeys usable at all target widths for the graded project, while retaining the current visual language and feature behavior.

## Goals

- Audit shared navigation and the public/authenticated page families, including course, assignment/editor, grading/submission, discussion, progress, profile, admin, and their loading, empty, error, and unavailable states.
- Inspect representative widths of 320, 375, 768, 1024, and 1440 CSS pixels; add a boundary viewport when a specific layout changes there.
- Keep the document free of unintended horizontal overflow. Wide source code and inherently wide data may scroll inside a clearly bounded, keyboard/touch-usable region.
- Correct only confirmed layout or interaction issues with the current Next.js, React, and Tailwind patterns.
- Preserve legibility, visible focus, reachable controls, touch operation, light/dark themes, and content order as layouts adapt.
- Add or extend responsive browser checks for changed behavior and record what could not be checked.

## Non-goals and constraints

- No general visual rebrand or replacement of the current design system.
- No changes to authentication, course authorization, grading, AI authority, or data access.
- Keep Python execution and Java compilation/execution entirely in the browser; do not add uploads, badges, paid services, or server-side student-code execution.
- Do not remove meaningful table information solely to fit a phone. Choose a readable stack/card representation or contained scrolling where appropriate.
- Do not claim browser coverage for routes or states that were not exercised.

## Approaches

1. **Targeted responsive audit and fixes (selected).** Inspect every routed page family and shared shell at the agreed widths, identify concrete failures, and make the smallest local layout changes that address them. Keep existing navigation and product styling where they work. This directly matches the request and limits visual regression risk.
2. **Broad responsive redesign.** Replace shared layout patterns and restyle most pages around a new mobile-first system. This could create more consistency, but would change the product design beyond the evidence and introduce avoidable regression risk.
3. **Audit report only.** Deliver findings without code changes. This would not fulfill the request to make the necessary improvements.

Approach 1 is selected because it covers the app broadly while tying each code change to a reproduced issue and keeping the current product identity.

## Review and implementation decisions

- Start with the shared header, course shell, student workspace shell, and reusable page/content components; then exercise the route-specific data and form views.
- Treat browser document overflow and local region overflow separately. A wide table/code editor can retain horizontal navigation inside its own region; surrounding page content must remain within the viewport.
- Use real app data only when it is synthetic/local and authorized; never put secrets or real student data in screenshots, logs, or test artifacts.
- Preserve semantic landmarks, names, keyboard navigation, and existing focus behavior when controls wrap or move.
- The current `develop` worktree has a passing baseline of 883 unit tests across 170 files. Browser access through CUA is unavailable in this environment; use the repository's local Playwright/browser setup if available and report any remaining limitation explicitly.

## Acceptance evidence

- A route-family inventory records the pages and states inspected, along with viewport widths and the actual findings.
- Each implemented fix has a reproducible responsive check at the relevant viewport; shared shell changes are checked at all agreed widths.
- No unintended document-level horizontal overflow remains in the exercised journeys; any contained scrolling region remains operable.
- Unit, browser, lint, type, format, OpenSpec, scaffold, and whitespace results are recorded with exact outcomes and applicable skips.
- Human/team review and hosted/deployment acceptance remain pending until separately performed.

## Decisions left to implementation

The exact pages and states reached by local authenticated fixtures, the minimal class/component edits for each confirmed defect, and whether a narrow data view should stack or use contained scrolling are implementation calls guided by the acceptance criteria above. If local fixtures or the browser tool cannot reach a required route, record the gap rather than substituting an unverified claim.
