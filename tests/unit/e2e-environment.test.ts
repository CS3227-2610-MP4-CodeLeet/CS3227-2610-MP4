import { describe, expect, it } from 'vitest';
import {
  buildLocalE2eEnvironment,
  serverEnvironment,
} from '../../workflow/scripts/e2e-environment.mjs';

const localApi = 'http://127.0.0.1:54321';
const localStatus = {
  API_URL: localApi,
  ANON_KEY: 'synthetic-public',
  SERVICE_ROLE_KEY: 'synthetic-fixture-admin',
  SECRET_KEY: 'synthetic-metadata-secret',
};

describe('local authenticated CI environment', () => {
  it('gives fixture authority only to the test process', () => {
    const base = {
      PATH: 'synthetic-path',
      SUPABASE_SERVICE_ROLE_KEY: 'inherited-legacy-secret',
      MP4_E2E_SERVICE_ROLE_KEY: 'inherited-fixture-secret',
      MP4_LOCAL_SERVICE_ROLE_KEY: 'inherited-local-secret',
    };
    const build = buildLocalE2eEnvironment(
      localStatus,
      base,
      'build',
      'a'.repeat(32),
    );
    const test = buildLocalE2eEnvironment(
      localStatus,
      base,
      'test',
      'a'.repeat(32),
    );
    expect(build.PATH).toBe('synthetic-path');
    expect(build.NEXT_PUBLIC_SUPABASE_URL).toBe(localApi);
    expect(build.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).toBe('synthetic-public');
    expect(build.SUPABASE_SECRET_KEY).toBe('synthetic-metadata-secret');
    expect(build.MP4_E2E_SERVICE_ROLE_KEY).toBe('');
    expect(build.SUPABASE_SERVICE_ROLE_KEY).toBe('');
    expect(build.MP4_LOCAL_SERVICE_ROLE_KEY).toBe('');
    expect(test.MP4_E2E_SERVICE_ROLE_KEY).toBe('synthetic-fixture-admin');
    expect(base.MP4_E2E_SERVICE_ROLE_KEY).toBe('inherited-fixture-secret');
  });

  it('strips fixture and legacy authority from either Next server', () => {
    const env = serverEnvironment({
      NEXT_PUBLIC_SUPABASE_URL: localApi,
      SUPABASE_SECRET_KEY: 'reviewed-metadata-only',
      MP4_E2E_SERVICE_ROLE_KEY: 'fixture-secret',
      SUPABASE_SERVICE_ROLE_KEY: 'legacy-secret',
      SERVICE_ROLE_KEY: 'raw-cli-secret',
      MP4_LOCAL_SERVICE_ROLE_KEY: 'local-secret',
    });
    expect(env.MP4_E2E_SERVICE_ROLE_KEY).toBe('');
    expect(env.SUPABASE_SERVICE_ROLE_KEY).toBe('');
    expect(env.SERVICE_ROLE_KEY).toBe('');
    expect(env.MP4_LOCAL_SERVICE_ROLE_KEY).toBe('');
    expect(env.SUPABASE_SECRET_KEY).toBe('reviewed-metadata-only');
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe(localApi);
  });

  it.each([
    'https://example.supabase.co',
    'http://127.0.0.1:54321.evil.test',
    'http://127.0.0.1:54322',
    'http://localhost:54321/path',
  ])('rejects nonlocal or unexpected API endpoint %s', (API_URL) => {
    expect(() =>
      buildLocalE2eEnvironment(
        { ...localStatus, API_URL },
        {},
        'test',
        'a'.repeat(32),
      ),
    ).toThrow('local Supabase');
  });

  it.each(['ANON_KEY', 'SERVICE_ROLE_KEY', 'SECRET_KEY'])(
    'fails instead of silently skipping when %s is absent',
    (missing) => {
      expect(() =>
        buildLocalE2eEnvironment(
          { ...localStatus, [missing]: '' },
          {},
          'test',
          'a'.repeat(32),
        ),
      ).toThrow('local Supabase');
    },
  );
});

it('runs the authenticated local browser journey with bundled runner parity', () => {
  expect(
    buildLocalE2eEnvironment(localStatus, {}, 'test', 'a'.repeat(32))
      .VERCEL_ENV,
  ).toBe('preview');
});
