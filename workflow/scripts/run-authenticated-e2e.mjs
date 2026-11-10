import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { buildLocalE2eEnvironment } from './e2e-environment.mjs';

// CI only: capture CLI output privately. Never export fixture authority through
// GITHUB_ENV, command arguments, build output, or an uploaded results artifact.
const mode = process.argv[2];
if (!process.env.GITHUB_ACTIONS || !['build', 'test'].includes(mode)) {
  throw new Error('Use this launcher in GitHub Actions with build or test.');
}
const result = spawnSync('pnpm', ['exec', 'supabase', 'status', '--output', 'json'], {
  encoding: 'utf8',
});
if (result.status !== 0) {
  throw new Error('Unable to read local Supabase status.');
}
const status = JSON.parse(result.stdout);
const rateLimitSecret = randomBytes(32).toString('hex');
const env = buildLocalE2eEnvironment(status, process.env, mode, rateLimitSecret);
for (const value of [...Object.values(status), rateLimitSecret]) {
  if (typeof value === 'string' && !value.startsWith('http')) {
    process.stdout.write(`::add-mask::${value}\n`);
  }
}
const args = mode === 'build' ? ['build'] : ['test:e2e', '--project=chromium'];
const child = spawnSync('pnpm', args, { env, stdio: 'inherit' });
process.exit(child.status ?? 1);
