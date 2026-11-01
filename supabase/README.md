# Local database setup

This is a fresh MP4 Supabase setup; no MP3 configuration or schema is reused. Start Docker Desktop, then from the repository root run:

```sh
pnpm db:start
pnpm db:seed
pnpm db:test
```

`db:seed` and `db:reset` print a warning, then destroy and recreate the local database, apply migrations, and explicitly load the synthetic fixtures from `supabase/seed.sql`. Automatic CLI seed loading is disabled, so `pnpm db:start` starts an empty migrated database and local fixtures are never implicitly added by a linked/hosted reset. Both pnpm reset commands explicitly target only the local Supabase database. `db:test` runs the pgTAP access tests. Use `pnpm db:stop` to stop the local services and retain their local database volume.

Migrations provide text profiles, protected student/instructor/admin roles, assignments with a separately protected rubric, immutable Python/Java submission revisions, grades, AI reviews, and usage records. Public signup always receives the `student` role. Role writes remain unavailable to application clients; admins use the guarded role-management panel.

The seed creates 12 synthetic students, 3 synthetic instructors, 1 synthetic admin, 12 assignments (10 published and 2 drafts), rubrics, student submissions, and a mix of published and unpublished grades. Fresh assignment examples alternate between deadlines seven days ahead, one day ago and no deadline; new revisions capture their timing automatically. The seeded login emails are:

- Students: `student01@codeleet.test` through `student12@codeleet.test` (display names `Student 01` through `Student 12`).
- Instructors: `instructor1@codeleet.test` through `instructor3@codeleet.test` (display names `Instructor 1` through `Instructor 3`).
- Admin: `admin@codeleet.test` (display name `Admin`).

These accounts have **no preset password**. To set one for local sign-in, start the local Supabase services and app, open `http://localhost:3000/forgot-password`, and submit the seeded email. Open the newest reset email in [local Mailpit](http://localhost:54324), follow its link in the same browser, and choose a new password. Then sign in at `http://localhost:3000/sign-in` with that email and password. Reset messages are captured locally and are not sent to real inboxes. Running `pnpm db:seed` or `pnpm db:reset` recreates these accounts without passwords, so repeat this setup after resetting. No password is committed to the repository.

## Provision the first admin

Public registration remains student-only, so a new hosted project needs an operator to provision its first admin before the admin panel is available. In the trusted Supabase SQL Editor, first verify the intended account by its email:

```sql
select u.id, u.email, p.display_name, r.role
from auth.users u
join public.user_roles r on r.user_id = u.id
left join public.profiles p on p.id = u.id
where lower(u.email) = lower('admin@example.edu');
```

After confirming the result is exactly the intended existing, verified account, promote its UUID in the same trusted SQL Editor:

```sql
update public.user_roles
set role = 'admin'
where user_id = 'REPLACE-WITH-VERIFIED-USER-UUID'
  and exists (
    select 1 from auth.users u
    where u.id = public.user_roles.user_id
      and lower(u.email) = lower('admin@example.edu')
      and u.email_confirmed_at is not null
  );
```

Confirm that one role row changed. This operator-only step establishes the first admin; after that, admins can manage student, instructor, and admin roles through the panel. The database blocks a role change that would remove the final admin. Never use the service-role key in the app or accept first-admin provisioning through a public route or user-editable metadata.

The app reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. AI is disabled unless `SOCLAAS_AI_ENABLED=true`, `SOCLAAS_BASE_URL`, `SOCLAAS_API_KEY`, and `SOCLAAS_MODEL` are configured server-side. Do not use a Supabase secret/service-role key in the app. This repository change configures only the local stack; no hosted project is configured.

Local generated keys are development-only. Keep separate hosted projects for development and production and do not commit credentials. Submitted source is stored for review and never executed by Next.js/Node or a remote service; the separate opt-in practice runner remains browser-local.

To stress the student daily quota locally, run `workflow/scripts/check-ai-quota-concurrency.mjs` with the local Supabase URL, publishable key, and service-role key in process environment variables (`MP4_LOCAL_SERVICE_ROLE_KEY` for the last value). The script creates and deletes synthetic accounts and fixtures. It sends 12 concurrent reservation requests and expects five accepted and seven rate-limited; it does not call SoCLaaS or execute submitted source.

## Forum migration and local examples

Apply `pnpm exec supabase migration up --local` before testing Forums. The additive forum migration creates protected thread/reply tables and a trusted posting RPC. `pnpm db:seed` also inserts three synthetic discussions and two replies; repeat seeds preserve existing rows. Seed loading remains explicitly local-only and is disabled on reset by default. Forum rows use reserved `97000000`/`97000001` UUID prefixes and existing synthetic account identities. No forum passwords, uploads, AI calls or XP are added.
