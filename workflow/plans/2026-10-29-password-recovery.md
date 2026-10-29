# Email password recovery

Issue #15 / PR #16; branch `fix/account-workspace-controls`; OpenSpec `build-programming-platform`, task 7.21.

Add Forgot password to sign-in. `/forgot-password` collects a required email and uses the existing browser Supabase client's PKCE `resetPasswordForEmail` with a same-origin callback and fixed `/reset-password` destination. Use a generic account-independent acknowledgement, pending/error states and a 60-second UI resend delay; provider rate limits remain authoritative. Never log email bodies, codes, passwords or tokens. Both pages share account styling/theme.

Allow only the fixed recovery destination in the callback; verify exchanged identity before showing the recovery form. Missing, expired, replayed or invalid codes go to a helpful request-another-link page without leaking provider errors or accepting arbitrary redirects. `/reset-password` verifies identity with server `getUser`, then accepts matching passwords using existing eye controls/minimum eight characters and calls `updateUser`. On success sign out through Auth and offer sign-in with the new password. Report password-update versus sign-out failures accurately. No database schema or role changes.

- [x] Write failing callback/security and browser navigation/email-request tests.
- [x] Implement request/reset forms and pages, safe callback recovery routing and authenticated access; reuse shared controls.
- [x] Test a real local Mailpit email through callback and password update, old-password failure/new-password login and link replay. Test mismatch/provider failure/rate limit/session denial, then run applicable unit/browser/static/build checks and update guides/log/spec.
- [x] Commit/push and update PR #16 with actual evidence; hosted SMTP/delivery and human review remain pending.
