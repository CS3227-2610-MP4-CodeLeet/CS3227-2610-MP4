# Email confirmation result

Issue: [#144](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/144). Active change: `openspec/changes/build-programming-platform`.

## Decision and boundaries

After exchanging a valid signup confirmation code, show a short success page with a path to Courses. The page independently checks a server-verified, email-confirmed user so a direct URL, stale cookie or unconfirmed session cannot display a false success. If the verified account lacks a platform role, explain that access still needs an administrator instead of silently sending the user into Courses. Expired/invalid links show a clear sign-in failure with a new account-creation route. Keep password recovery and course invitation callback destinations unchanged. Never expose code, email, session or provider detail in the UI or URL.

This uses existing Next.js server pages, the cookie-backed Supabase client and current UI primitives. It needs no migration, dependency or external service. The callback's role lookup is no longer needed for ordinary signup links; role access is checked at the destination and by Courses itself.

## Implementation plan

1. Add failing callback and page tests for confirmed success, missing/unconfirmed session, missing role, invalid link, recovery and invitation preservation.
2. Update the callback's ordinary signup destination and add the guarded result page. Render an actionable failure message on sign-in for invalid or expired confirmation links.
3. Update the verified User Guide, run focused/full unit checks, lint, types, format, build and strict OpenSpec validation; record actual results.
4. Commit focused code/spec/docs/log changes, push, open a PR to `develop`, and verify its final-head checks. Teammate review and merge remain separate.
