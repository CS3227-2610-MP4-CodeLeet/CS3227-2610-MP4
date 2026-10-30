import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

async function seedLocal() {
  if (process.argv.length !== 2) {
    throw new Error(
      'db:seed does not accept arguments or remote database targets.',
    );
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('db:seed is for local development only.');
  }
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const password = randomBytes(24).toString('hex');
  const sql = await readFile(join(root, 'supabase/seed.sql'), 'utf8');
  const config = await readFile(join(root, 'supabase/config.toml'), 'utf8');
  const project = config.match(/^project_id = "([a-zA-Z0-9_-]+)"$/m)?.[1];
  if (!project) throw new Error('Local Supabase project ID is missing.');
  const host =
    process.platform === 'win32'
      ? 'npipe:////./pipe/dockerDesktopLinuxEngine'
      : 'unix:///var/run/docker.sock';
  const result = spawnSync(
    'docker',
    [
      '--host',
      host,
      'exec',
      '-i',
      `supabase_db_${project}`,
      'psql',
      '-X',
      '--set',
      'ON_ERROR_STOP=on',
      '--username',
      'postgres',
      '--dbname',
      'postgres',
    ],
    {
      cwd: root,
      encoding: 'utf8',
      timeout: 120_000,
      input: sql.replace(
        'begin;',
        `begin;\nselect set_config('codeleet.seed_password', '${password}', true);`,
      ),
    },
  );
  if (result.status !== 0) {
    throw new Error(
      'Local seed failed. Check Docker, run pnpm db:start, and apply local migrations. No database reset was requested.',
    );
  }
  console.log('Local seed ready: 10 students, 3 instructors, 10 assignments.');
  console.log(
    'Students: student01@codeleet.example.test through student10@codeleet.example.test',
  );
  console.log(
    'Instructors: instructor01@codeleet.example.test through instructor03@codeleet.example.test',
  );
  console.log(`Generated local password for these accounts: ${password}`);
  console.log(
    'Seed-account passwords rotated; existing coursework and unrelated data preserved.',
  );
}

seedLocal().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
