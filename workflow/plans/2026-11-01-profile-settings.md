# Profile settings implementation plan

Issue [#38](https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/issues/38), branch `feat/profile-settings` from develop `35daede`. Active OpenSpec: `build-programming-platform`, accounts-and-access, task group 15 (group 14 is reserved for the separate open Forums PR #37).

## Design

Implement the requested independent profile feature using existing Supabase profiles/RLS. Reuse `display_name` as the editable Username; no uniqueness or sign-in identifier change. The shared `/profile` page verifies identity/trusted role, reads only the current user's profile and shows email from verified Auth plus role from protected role lookup as read-only. No public profile query, schema migration, role administration, email/password editing or uploads.

`PATCH /api/profile` requires same Origin, verified identity/role and strict JSON up to 1,024 bytes containing only username (trimmed 1–80 characters). Derive the target UUID from the session, update only display_name and select only the updated name. RLS remains a second ownership boundary. Missing profile is unavailable, not invented/upserted. Use private/no-store responses and sanitized errors; preserve typed input on failure and show pending/success states. Never log account data or secrets.

Use a compact shared account page with back-to-workspace link, theme and sign-out controls. Student Menu adds Profile settings after its existing navigation; instructor account controls add Profile. Avoid editing sidebar contents/breadcrumb logic changed by open Forums work. Keep mobile/theme support and no dependency on that PR. Existing forum snapshots, if later merged, remain historical; new posts read the updated profile.

## Tasks

- [x] Write failing username/API contract tests; add targeted existing-policy checks for peer protection and instructor edits.
- [x] Implement own-profile loading, bounded PATCH and shared profile form/page/loading/error states and account links.
- [x] Verify both roles, reload persistence, readonly fields/forgery, safe text, errors, mobile/theme, current DB policies and workspace regressions; run unit/static/build checks.
- [ ] Update current guides/specs/logs, commit milestones, push and create labelled PR to develop linked to issue #38.

## Constraints and review

Node 24; no new dependency or privileged app key. Preserve `.env.local` and the pre-existing generated `next-env.d.ts` edit. No specialist delegation authorized; author review must not be represented as independent review. Human log/teammate review remains pending. Existing destructive local seed/reset commands are not needed or run.
