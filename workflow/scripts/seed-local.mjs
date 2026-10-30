import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

function seedPassword() {
  const password = process.env.CODELEET_SEED_PASSWORD;
  if (
    !password ||
    password.length < 12 ||
    Buffer.byteLength(password, 'utf8') > 72 ||
    /[\r\n]/.test(password)
  ) {
    throw new Error(
      'Set CODELEET_SEED_PASSWORD to at least 12 characters, at most 72 UTF-8 bytes, without line breaks.',
    );
  }
  return Buffer.from(password, 'utf8').toString('base64');
}

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
  const encodedPassword = seedPassword();
  const sql = await readFile(join(root, 'supabase/seed.sql'), 'utf8');
  const config = await readFile(join(root, 'supabase/config.toml'), 'utf8');
  const project = config.match(/^project_id = "([a-zA-Z0-9_-]+)"$/m)?.[1];
  if (!project) throw new Error('Local Supabase project ID is missing.');
  const host =
    process.platform === 'win32'
      ? 'npipe:////./pipe/dockerDesktopLinuxEngine'
      : 'unix:///var/run/docker.sock';
  const dockerEnv = Object.fromEntries(
    Object.entries(process.env).filter(
      ([name]) =>
        !name.startsWith('DOCKER_') && name !== 'CODELEET_SEED_PASSWORD',
    ),
  );
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
      env: dockerEnv,
      encoding: 'utf8',
      timeout: 120_000,
      input: sql.replace(
        'begin;',
        `begin;\nselect set_config('codeleet.seed_password', convert_from(decode('${encodedPassword}', 'base64'), 'UTF8'), true);`,
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
  console.log(
    'Seed accounts now use the supplied local password (value not logged).',
  );
  console.log(
    'Seed-account passwords rotated; existing coursework and unrelated data preserved.',
  );
}

seedLocal().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
