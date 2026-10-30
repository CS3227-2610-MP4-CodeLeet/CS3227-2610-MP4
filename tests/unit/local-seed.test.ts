import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const script = 'workflow/scripts/seed-local.mjs';

describe('local seed command boundaries', () => {
  it.each([
    '--linked',
    '--db-url=postgres://remote/db',
    '--help',
    'production',
  ])('rejects unexpected argument %s before accessing a database', (arg) => {
    const result = spawnSync(process.execPath, [script, arg], {
      encoding: 'utf8',
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('does not accept arguments');
    expect(result.stdout).toBe('');
  });

  it('refuses production mode before accessing a database', () => {
    const result = spawnSync(process.execPath, [script], {
      encoding: 'utf8',
      env: { ...process.env, NODE_ENV: 'production' },
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('local development only');
    expect(result.stdout).toBe('');
  });
});
