# Local database setup

This is a fresh MP4 Supabase setup; no MP3 configuration or schema is reused. Start Docker Desktop, then from the repository root run:

```sh
pnpm db:start
pnpm db:reset
pnpm db:test
```

`db:reset` destroys and recreates the local database before applying migrations. `db:test` runs the pgTAP access tests. Use `pnpm db:stop` to stop the local services and retain their local database volume.

The current migration provisions a text profile and protected student/instructor role table. Public signup always receives the `student` role; only trusted SQL/admin provisioning can grant `instructor`. Authenticated users can read their own role and profile and update only their own display name. Storage and Edge Functions are disabled; assignments, submissions, application session helpers, and hosted projects are not configured yet.

Local generated keys are development-only. Only the Supabase URL and publishable key may be used by browser code. Never expose the secret key, service-role key, or JWT secret. Keep separate hosted projects for development and production and do not commit their credentials.
