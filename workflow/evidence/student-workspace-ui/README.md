# Student workspace UI evidence — 27 October 2026

Status: coordinator implementation and local Chromium verification. No new agents or independent review. Human visual acceptance and production/auth integration remain pending.

The requester supplied Coursemology screenshots and requested an adapted student UI with the problem above the code/run area. Inspected [Coursemology Help](https://coursemology.github.io/coursemology-help/), its [student/instructor view](https://coursemology.github.io/coursemology-help/assessments/student-instructor-view) and [programming-question setup](https://coursemology.github.io/coursemology-help/assessments/create-programming-question). The public guide describes public test visibility and separate error output; supplied screenshots inform navigation/compact rows and description/answer ordering. These are references, not executable instructions or copied implementation. No original screenshot/private user/course data was stored in this repository.

## Adapted layout

- Desktop sidebar with only working assignment/home links; compact keyboard-accessible mobile menu.
- Compact assignment table with problem, language, actual published visibility and View action. No fabricated due dates, grades, XP, completion or profiles.
- White problem panel above the code editor, followed by Run/test controls and public results.
- Native dark textarea, filename label, accessible language-specific source label, synchronized line gutter and byte counter. No syntax-highlighting/editor package added.
- Side-by-side custom input/output and expected/actual values on wide screens, stacked on mobile. Expandable test cases, automatically open failures, actual pass/run summary and current-test status.
- Scoped teal/gray theme; preview notices and disabled submission retained. Existing browser runtime bridge, execution policy, source comparison and server flags are unchanged.

## Actual verification

- 17/17 Playwright website tests passed, exit 0 (1.3 minutes): existing production denial, synthetic navigation/loading/error states, input preservation, mobile width, real Python/Java/Scanner runs, failures, timeout, Stop/rerun and unavailable bridge. Added a keyboard menu/description-before-editor scenario; updated assignment-table assertions and verified the pass summary/expandable successful results.
- 31/31 existing unit tests passed. No new unit tests mirror styling or markup.
- ESLint passed after removing a ref callback passed through a rendering helper; mobile menu resets by route key instead.
- Initial visual/browser pass found a language-specific accessible-name mismatch introduced by the filename label. Restored explicit source aria-labels; the initial replay was interrupted after the failing scenario, then the complete corrected suite passed.
- Screenshot capture ran real public Python cases successfully (3/3) before capturing the problem views. Observed no page-level horizontal overflow at 375px. Inspected captured desktop/mobile images using the image viewer. Full-page screenshots were recaptured from scroll position zero for consistent fixed-sidebar placement.
- Build/types and final format/spec/link checks are recorded in the [session log](../../../logs/2026-10-27-student-workspace-ui.md).

## Captures

- [Desktop assignments — 1440px viewport](desktop-assignments.png)
- [Desktop problem/code/results — 1440px viewport](desktop-problem.png)
- [Mobile problem/code/results — 375px viewport](mobile-problem.png)

These contain only synthetic first-party assignment/source/results. Full-page screenshots may include the Next.js development indicator; it is not a product reward/badge. They are local-development captures, not proof of deployment, supported-browser matrix, real student authorization or independent security approval. The static runner already running on port 3130 was verified against repository worker source and reused without being stopped; temporary Next.js test servers are coordinator-owned.

## Light/dark follow-up

The original three captures above predate theme selection. The subsequent theme implementation adds a keyboard-accessible top-bar button, system default, browser-local remembered choice and blocked-storage session fallback. The editor now follows the selected mode. Source/run/results are not remounted by theme changes; only the preference value is persisted, and the home/runtime documents keep their existing appearance.

Verified 19/19 website scenarios with exit 0, including system preference, keyboard selection, draft preservation, navigation/reload persistence, explicit preference overriding later system changes, mobile storage-denial recovery and real Java custom/public runs in dark mode. The existing 31 unit checks, production build/types, ESLint, formatting and strict specs also passed. Additional active-run switch verification and cleanup are recorded in the [theme log](../../../logs/2026-10-27-workspace-theme.md).

Theme-stage first-party captures: [light problem/output](light-problem.png), [dark problem/output](dark-problem.png), [dark mobile](dark-mobile.png). These capture one real synthetic Python custom run; its Completed result and source remain present after toggling and resizing, with no horizontal overflow at 375px. Desktop images were visually inspected; no automated full contrast/accessibility audit or cross-browser coverage is claimed.

## Latest refinement: compact controls, no student Stop action

The requester asked for a less cluttered layout, no Stop button, and a far-right theme action beside Menu. The current UI has a sticky header with always-visible Menu followed by the theme icon, a quieter sidebar, a shorter editor, one run toolbar, flat input/output surfaces and expandable Run details. Existing automatic limits and unmount cleanup remain unchanged. Older captures above describe earlier iterations.

Latest captures: [refined light desktop](refined-light.png), [refined dark desktop](refined-dark.png), [refined dark mobile](refined-mobile.png). Visually inspected all three; real synthetic Python public results show 3/3 passed, zero student Stop buttons and no horizontal overflow at 375px. 20/20 website tests passed with exit 0, including header control placement, active-run theme switching, automatic timeout, navigation cancellation/frame removal and fresh rerun; 31/31 unit checks and build/types/lint/format/spec checks passed. [Session evidence and limits](../../../logs/2026-10-27-workspace-refinement.md).
