# Email or username sign-in and student acceptance

Status: requester approved the complete design and requested implementation on 3 November 2026, including the proposed legacy lifecycle, reviewed server-only lookup and attempt limits.

Issue [#84](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/84). Branch `feat/username-sign-in` from merged develop `0aca647`. Active OpenSpec: `build-programming-platform`, accounts-and-access and engineering-and-delivery. Summary: `logs/2026-11-03-username-sign-in.md`.

## Intent and approaches

Sign-in currently sends an email/password directly to Supabase Auth. Usernames are editable `profiles.display_name` values and duplicates are permitted. A field-label change alone would reject usernames as invalid emails or send unsupported credentials to Auth. The requester wants real email-or-username sign-in and fresh student acceptance/security evidence, while their teammate implements courses separately.

1. **Unique current usernames — selected.** Add case-insensitive login identity behind the existing Username field and retain email/password login. Requires atomic uniqueness and a safe transition for old duplicates.
2. **Separate unique login handle.** Keeps display names freely duplicated, but introduces a second name for users to manage. Not selected.

Never publish an unauthenticated username-to-email lookup. Preserve existing own-profile RLS and trusted roles. No course membership, assignment ownership, forum scope, XP or runtime execution behavior changes.

## Proposed user behavior and name policy

3 November continuation: the requester asked for loading feedback on sign-in,
registration, recovery and other asynchronous buttons. A shared indicator reuses
each action's real pending state, with decorative spinner, disabled/aria-busy
semantics and action-specific account labels. Account requests show a friendly
notice after ten seconds and keep pending through navigation. Thrown signup
failures restore retry. Existing Next Form searches use `useFormStatus` per the
installed framework guide. This does not diagnose the hosted delay or automatically
retry requests; network deadlines and provider/deployment behavior remain separate.

- Sign-in shows **Email or username**, uses a text field and username autocomplete, and accepts the same password for either identifier. Signup and forgot-password still require an email. Password visibility, theme support and role-aware destinations remain.
- Keep the current trimmed 1–80-character username length rather than imposing a new short ASCII-only handle. New/changed usernames must exclude `@`, NUL and control characters so email-shaped identifiers cannot be ambiguous. Canonical login comparison is the database's lowercased, trimmed username under one fixed normalization rule; application code must not implement a competing case-folding algorithm. Preserve the user's preferred visible capitalization. Do not claim visual-confusable or full Unicode-equivalence detection.
- Newly registered or renamed usernames must be unique without regard to case; concurrent claims have one winner enforced in the database. A username edit takes effect for login immediately after its committed profile save. Old handles stop resolving; account email/password remain unchanged.
- Existing unique eligible usernames gain login support automatically. Existing duplicate or ineligible names are not silently renamed, deleted or assigned to an arbitrary winner. Those accounts keep email sign-in and receive a profile message asking them to choose an available username. Reserve conflicting legacy names against a new account taking them; a legacy account must explicitly resolve its name before username login is enabled.
- Legacy reservation lifecycle (coordinator's proposed default after builder check): while multiple legacy accounts still hold a colliding name, none may claim it for login. The sole remaining legacy owner may explicitly claim it by saving their profile; do not auto-assign it. If all legacy owners rename away, release the reservation so a future explicit signup/profile claim can take it. Enforce claim/release transitions transactionally; do not leave permanent tombstones.
- Duplicate/invalid signup and profile choices receive concise actionable validation. Sign-in failures use one generic message for unknown username/email, wrong password, legacy ambiguity and unconfirmed accounts. Do not add a public availability/directory endpoint or reveal another user's email.

## Authentication and persistence boundary

- Both identifier types use a bounded, same-origin server sign-in route with strict JSON, private/no-store responses and Supabase's normal password authentication. Only the request-scoped publishable-key SSR client establishes cookies; do not create sessions with an admin API or trust client-supplied user IDs/roles.
- For usernames, a narrow service-role-only database lookup resolves the canonical login name to the current Auth email inside the server. Do not grant anonymous/authenticated users this reader, expose it as a public directory, widen profile reads or send the resolved email back to the browser.
- This requires an explicitly server-only Supabase privileged key for the reviewed metadata lookup and rate-limit RPC, configured separately for development/production. Never put it in `NEXT_PUBLIC_*`, browser clients, build-time public configuration or evidence. Use a separate server-only rate-limit secret to HMAC normalized identifiers; no plaintext email/password stored in rate counters. The design approval authorizes this limited application use, not access to or publication of secret values.
- Keep privileged clients isolated in a server-only module with session persistence/refresh disabled. The ordinary session client authenticates with the resolved email/password and retains existing cookie options/verified role checks. Configure and verify the privileged key/rate secret and migration before deploying the new sign-in route; both identifier types use its quota guard. Missing required backend configuration returns a safe temporary-unavailable state rather than bypassing limits or exposing lookup results. Existing duplicate-name accounts retain the email identifier path once the deployment is configured.
- A private login-key registry or equivalent private canonical column/index enforces uniqueness transactionally for signup, profile edits and direct allowed profile updates, including legacy-name reservation. Explicit grants and database triggers/RPCs protect against bypass through user metadata or the Data API. Missing-name administrative fixture/provisioning accounts retain email login and need an explicit username claim; do not allocate duplicate default Student handles.
- Apply an additive migration and document rollout order. Preserve existing data and immutable submissions; do not reset local databases. Do not drop the uniqueness guard on an application rollback. Auth emails are read from current Auth records, so an email change cannot leave stale mapped credentials.

## Attempt limits and disclosure

- Reserve attempts atomically before resolution/password verification. Proposed bounds: ten attempts per normalized identifier per minute and sixty total route attempts per minute for this small deployment; return a safe retry message and Retry-After. HMAC identifiers with the server-only secret and expire old counters. The global cap is intentionally conservative; a hostile caller can consume it, so document availability limits rather than claiming complete denial-of-service protection.
- Do not depend solely on caller-supplied IP/forwarded headers, process-local counters or client-side disable buttons. Supabase's own Auth throttling remains in effect. Fail closed when rate-limit storage is unavailable for the new server route; configuration behavior and existing email continuity must be tested together.
- Unknown usernames must still traverse the normal safe Auth failure path using a controlled non-deliverable dummy identity; never attempt signup, send recovery email or retry guessed real addresses. Match response shape/status/message for credential failures. Provider/network failures are sanitized. Do not promise perfect timing indistinguishability or immunity to online guessing.
- Never log credential bodies, resolved email, keys, cookies or raw provider diagnostics. Protect cross-origin requests and bound identifier/password lengths before privileged calls. Login role is always derived from existing protected role storage after verified authentication.

## Student acceptance and security evidence

Build a dated acceptance matrix tied to the tested commit/environment/browser, with pass/fail/skip and prerequisites. Reuse existing synthetic fixtures and narrow tests before adding missing coverage. Test email and username sign-in, sign-out, assignment access, Python/Java browser runs, draft recovery, revision save/retry/history/comparison, published-grade privacy, and AI feedback/error presentation. Run database ownership/uniqueness and auth security checks, including case collisions, legacy names, rejected cross-origin requests, bounded attempts and private lookup grants.

Keep the evidence types distinct: mocked AI route/UI tests do not establish live SoCLaaS behavior; local browser/database success does not establish deployed configuration. No live provider calls, hosted migrations, production account changes, remote execution or teammate messages are included. Hosted URL/commit, confirmation/reset emails, actual provider-limit/adversarial AI testing and course-boundary acceptance remain explicit release gates until performed in the intended environment.

Update the User Guide only with verified implemented behavior. Maintain the dated interaction log, seek an independent source/security review, pass branch CI before creating the PR to develop, then confirm final-head checks. No coordinator merge or manual deployment.

## Builder-owned implementation choices

Exact module/function names, private schema names, SQL normalization implementation, counter cleanup mechanism and test-fixture refactoring are implementation details. Record any choice that changes the user-visible policy or scope in this design; bring material policy changes back for approval. No additional UI mockup is necessary for changing one identifier field and an existing profile validation message.
