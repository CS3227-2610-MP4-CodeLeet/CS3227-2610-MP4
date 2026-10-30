// Local-only integration checks. No reset, hosted access, AI calls or source execution.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

const sql = await readFile('supabase/seed.sql', 'utf8');
const body = sql.replace('begin;', '').replace(/commit;\s*$/, '');
const firstStudent = 'c0de0000-0000-4000-8000-000000000001';
const assignment = 'c0de1000-0000-4000-8000-000000000001';
const password = `Local-'\\-` + randomBytes(24).toString('hex');
const host =
  process.platform === 'win32'
    ? 'npipe:////./pipe/dockerDesktopLinuxEngine'
    : 'unix:///var/run/docker.sock';

function query(input) {
  return spawnSync(
    'docker',
    [
      '--host',
      host,
      'exec',
      '-i',
      'supabase_db_cs3227-mp4',
      'psql',
      '-X',
      '--set',
      'ON_ERROR_STOP=on',
      '--username',
      'postgres',
      '--dbname',
      'postgres',
    ],
    { input, encoding: 'utf8', timeout: 120_000 },
  );
}

function command(file, args = []) {
  const result = spawnSync(process.execPath, [file, ...args], {
    encoding: 'utf8',
    timeout: 120_000,
    env: { ...process.env, CODELEET_SEED_PASSWORD: password },
  });
  assert.ok(
    !`${result.stdout}${result.stderr}`.includes(password),
    'Command output must not contain the local password.',
  );
  assert.ok(
    !`${result.stdout}${result.stderr}`.includes(
      Buffer.from(password).toString('base64'),
    ),
    'Command output must not contain an encoded local password.',
  );
  assert.equal(
    result.status,
    0,
    'Local command must succeed (output withheld).',
  );
  return result.stdout;
}

// Supply an ephemeral password over environment only; never print or parse one.
command('workflow/scripts/seed-local.mjs');
command('workflow/scripts/seed-local.mjs');

const fresh = query(`begin;
  delete from public.grades where submission_id::text like 'c0de2000-%';
  delete from public.submissions where id::text like 'c0de2000-%';
  delete from public.assignments where id::text like 'c0de1000-%';
  delete from auth.users where id::text like 'c0de0000-%';
  ${body}
  ${body}
  do $verify$ begin
    assert (select count(*) from auth.users where raw_app_meta_data ->> 'local_seed' = 'codeleet-v1') = 13;
    assert (select count(*) from auth.identities where user_id::text like 'c0de0000-%') = 13;
    assert (select count(*) from public.assignments where id::text like 'c0de1000-%') = 10;
    assert (select count(*) from public.submissions where id::text like 'c0de2000-%') = 288;
    assert (select count(*) from public.grades where id::text like 'c0de3000-%') = 144;
  end; $verify$;
rollback;`);
assert.equal(fresh.status, 0, fresh.stderr);
console.log(
  'PASS: empty fixture set recreates accounts/identities and all coursework without duplicates (rolled back).',
);

const preservation = query(`begin;
  create temp table before_counts as select
    (select count(*) from auth.users) users,
    (select count(*) from public.assignments) assignments,
    (select count(*) from public.submissions) submissions,
    (select count(*) from public.grades) grades;
  update public.assignments set title = 'Edited local seed' where id = '${assignment}';
  update public.profiles set display_name = 'Edited local name' where id = '${firstStudent}';
  update public.grades set feedback = 'Edited local grade'
    where id = 'c0de3000-0000-4000-8000-000000001013';
  insert into auth.users (id, email, raw_user_meta_data)
    values ('c0de9900-0000-4000-8000-000000000001', 'unrelated@seed-verification.example.test', '{}');
  delete from public.grades where id = 'c0de3000-0000-4000-8000-000000001014';
  delete from public.profiles where id = 'c0de0000-0000-4000-8000-000000000010';
  ${body}
  ${body}
  do $verify$ begin
    assert (select title from public.assignments where id = '${assignment}') = 'Edited local seed';
    assert (select display_name from public.profiles where id = '${firstStudent}') = 'Edited local name';
    assert (select feedback from public.grades where id = 'c0de3000-0000-4000-8000-000000001013') = 'Edited local grade';
    assert (select count(*) from auth.users) = (select users + 1 from before_counts);
    assert (select count(*) from public.assignments) = (select assignments from before_counts);
    assert (select count(*) from public.submissions) = (select submissions from before_counts);
    assert (select count(*) from public.grades) = (select grades from before_counts);
    assert exists (select 1 from public.profiles where id = 'c0de0000-0000-4000-8000-000000000010');
    assert exists (select 1 from auth.users where email = 'unrelated@seed-verification.example.test');
  end; $verify$;
rollback;`);
assert.equal(preservation.status, 0, preservation.stderr);
console.log(
  'PASS: repeated seeds, missing-row recovery and edited/unrelated data preservation (rolled back).',
);

const collision = query(`begin;
  update auth.users set raw_app_meta_data = '{}' where id = '${firstStudent}';
  ${body}
rollback;`);
assert.notEqual(collision.status, 0);
assert.match(collision.stderr, /local_seed_identity_conflict/);
console.log('PASS: conflicting identity rejected atomically (rolled back).');

const status = JSON.parse(
  command('node_modules/supabase/dist/supabase.js', ['status', '-o', 'json']),
);
assert.ok(
  ['127.0.0.1', 'localhost'].includes(new URL(status.API_URL).hostname),
);
const key = status.PUBLISHABLE_KEY ?? status.ANON_KEY;

async function signIn(name) {
  const client = createClient(status.API_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const result = await client.auth.signInWithPassword({
    email: `${name}@codeleet.example.test`,
    password,
  });
  assert.equal(
    result.error,
    null,
    'Seed account can sign in with generated password.',
  );
  return client;
}

async function count(client, table, expected) {
  const result = await client
    .from(table)
    .select('id', { count: 'exact', head: true });
  assert.equal(result.error, null);
  assert.equal(result.count, expected, table);
}

async function verifyStudent(name, submissions, grades) {
  const client = await signIn(name);
  await count(client, 'submissions', submissions);
  await count(client, 'grades', grades);
  await count(client, 'assignment_rubrics', 0);
  const revisions = await client
    .from('submissions')
    .select('student_id,language');
  const identity = await client.auth.getUser();
  assert.equal(identity.error, null);
  assert.ok(
    revisions.data.every((row) => row.student_id === identity.data.user.id),
  );
  if (submissions)
    assert.deepEqual(
      new Set(revisions.data.map((row) => row.language)),
      new Set(['python', 'java']),
    );
  await client.auth.signOut();
}

await verifyStudent('student01', 32, 8);
await verifyStudent('student02', 32, 8);
await verifyStudent('student10', 0, 0);
for (const [index, expected] of [
  [1, 4],
  [2, 3],
  [3, 3],
]) {
  const client = await signIn(`instructor0${index}`);
  await count(client, 'assignments', expected);
  await count(client, 'assignment_rubrics', expected);
  await client.auth.signOut();
}
console.log(
  'PASS: supplied-password sign-in, both languages, two-student privacy, empty history, hidden rubrics/draft grades, instructor ownership.',
);
