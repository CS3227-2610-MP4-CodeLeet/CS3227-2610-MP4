import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const create = vi.hoisted(() => vi.fn());
const privateSyntheticKey = 'private-synthetic';
vi.mock('@supabase/supabase-js', () => ({ createClient: create }));
import {
  createPrivilegedMetadataClient,
  createSignInClients,
} from './metadata.server';
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://synthetic.example.test');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'public-synthetic');
  vi.stubEnv('SUPABASE_SECRET_KEY', privateSyntheticKey);
  vi.stubEnv(
    'AUTH_RATE_LIMIT_SECRET',
    'synthetic-hmac-secret-at-least-32-characters',
  );
  create.mockReset();
  create.mockReturnValue({});
});
afterEach(() => vi.unstubAllEnvs());
it('isolates metadata and stateless dummy clients and disables persisted sessions', () => {
  const clients = createSignInClients();
  clients.getDummyClient();
  expect(create.mock.calls.map((call) => call[1])).toEqual([
    privateSyntheticKey,
    'public-synthetic',
  ]);
  for (const call of create.mock.calls)
    expect(call[2]).toEqual({
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
});
it('creates a server metadata client without coupling it to sign-in throttling configuration', () => {
  vi.stubEnv('AUTH_RATE_LIMIT_SECRET', '');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '');
  expect(createPrivilegedMetadataClient()).toBeDefined();
  expect(create).toHaveBeenCalledWith(
    'https://synthetic.example.test',
    privateSyntheticKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
});
it.each(['SUPABASE_SECRET_KEY', 'AUTH_RATE_LIMIT_SECRET'])(
  'fails closed without %s',
  (name) => {
    vi.stubEnv(name, '');
    expect(() => createSignInClients()).toThrow(
      'Sign-in configuration unavailable',
    );
    expect(create).not.toHaveBeenCalled();
  },
);
