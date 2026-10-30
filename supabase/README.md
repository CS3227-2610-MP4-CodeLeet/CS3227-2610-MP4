# Local database setup

This is a fresh MP4 Supabase setup; no MP3 configuration or schema is reused. Start Docker Desktop, then from the repository root run:

```sh
pnpm db:start
pnpm db:seed
pnpm db:test
```

`db:seed` adds missing local fixtures without resetting the database. Set `CODELEET_SEED_PASSWORD` in the current process before running it (at least 12 characters, at most 72 UTF-8 bytes, without line breaks). It applies that password to the thirteen seed accounts without logging the value. It uses Docker's local socket and the configured project container; it does not read `.env.local`, use hosted credentials or accept a remote target. Windows uses Docker Desktop's Linux engine pipe; Linux/macOS use `/var/run/docker.sock`. Custom Docker socket locations are not supported by this command.

Native Supabase seeds run after migrations on a fresh local start or `db:reset`. Their initial account passwords are random and unknown; run `db:seed` with `CODELEET_SEED_PASSWORD` set to choose usable local login credentials. Starting an already initialized stack does not reseed it. `db:reset` destroys and recreates **all** local data; use it only when you intend that. `db:seed` alone does not apply pending migrations. `db:test` runs the pgTAP access/seed tests and expects the seed dataset to be present. Use `pnpm db:stop` to retain the local database volume.

## Set a local seed password

In PowerShell, enter the password through a hidden prompt so its value stays out of shell history and command output:

```powershell
$localSeedSecret = Read-Host "Local seed password (12+ characters, max 72 UTF-8 bytes)" -AsSecureString
$env:CODELEET_SEED_PASSWORD = [System.Net.NetworkCredential]::new("", $localSeedSecret).Password
try {
  npx.cmd --yes pnpm@12.15.0 db:seed
} finally {
  Remove-Item Env:CODELEET_SEED_PASSWORD
  $localSeedSecret.Dispose()
}
```

Sign in using that password and an account below. Keep it out of `.env.local`, committed files, command arguments and logs. For noninteractive local automation, supply it in the process environment. The integration test generates an ephemeral password internally and verifies that neither it nor its base64 representation appears in command output.

## Synthetic local workspaces

| Accounts | What to test |
| --- | --- |
| `student01@codeleet.example.test` through `student09@codeleet.example.test` | Each has 32 revisions across eight published Python/Java assignments, eight published grades and eight hidden draft grades |
| `student10@codeleet.example.test` | Empty submission history |
| `instructor01@codeleet.example.test` | Four owned assignments, including one draft |
| `instructor02@codeleet.example.test` | Three owned assignments |
| `instructor03@codeleet.example.test` | Three owned assignments, including one draft |

The ten assignments use simple stdin/stdout exercises; five are Python and five Java. Titles start with `[Local seed]`. All have private rubrics; two remain unpublished. There are 288 immutable revisions and 144 synthetic grades total. Seed grades are test records, not results inferred from running code or calling AI. No public teacher test-case records or XP awards are added.

Stable reserved UUIDs and `.example.test` emails make seeding repeatable. Existing profiles, assignment text, submissions and grades are retained; missing rows are restored. Conflicting reserved account IDs/emails without trusted seed metadata abort the transaction before instructor provisioning. Keep this seed out of hosted deployment inputs; never use it to provision real users.

Run `node tests/integration/local-seed.mjs` for the opt-in local integration checks. They reapply seeds, rotate seed-account passwords, test supplied-password sign-in and role/privacy rules, and use rollback-only transactions for fresh-fixture recreation, recovery, identity conflicts and preservation checks. Run `db:seed` afterwards with your own process-scoped password to restore a known login password.

Migrations provide text profiles, protected student/instructor roles, assignments with a separately protected rubric, immutable Python/Java submission revisions, grades, AI reviews, and usage records. Public signup always receives the `student` role. There is no public instructor-role selector or upgrade endpoint.

To provision a trusted instructor locally, first register the account through `/sign-up`, then use the local Supabase SQL editor or a trusted admin SQL session to update that exact account UUID:

```sql
update public.user_roles
set role = 'instructor'
where user_id = 'REPLACE-WITH-VERIFIED-USER-UUID';
```

Never run this through an application route or accept an account UUID/role from an untrusted client. Hosted instructor provisioning is an administrator action in the team's own Supabase project.

The app reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. AI is disabled unless `SOCLAAS_AI_ENABLED=true`, `SOCLAAS_BASE_URL`, `SOCLAAS_API_KEY`, and `SOCLAAS_MODEL` are configured server-side. Do not use a Supabase secret/service-role key in the app. This repository change configures only the local stack; no hosted project is configured.

Local generated keys are development-only. Keep separate hosted projects for development and production and do not commit credentials. Submitted source is stored for review and never executed by Next.js/Node or a remote service; the separate opt-in practice runner remains browser-local.

To stress the student daily quota locally, run `workflow/scripts/check-ai-quota-concurrency.mjs` with the local Supabase URL, publishable key, and service-role key in process environment variables (`MP4_LOCAL_SERVICE_ROLE_KEY` for the last value). The script creates and deletes synthetic accounts and fixtures. It sends 12 concurrent reservation requests and expects five accepted and seven rate-limited; it does not call SoCLaaS or execute submitted source.
