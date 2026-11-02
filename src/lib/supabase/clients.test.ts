/* eslint-disable sonarjs/no-duplicate-string -- repeated expected text documents the user-facing contract. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createBrowserClient: vi.fn(),
  createServerClient: vi.fn(),
  cookies: vi.fn(),
}));
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: mocks.createBrowserClient,
  createServerClient: mocks.createServerClient,
}));
vi.mock('next/headers', () => ({ cookies: mocks.cookies }));

import { createSupabaseBrowserClient } from './browser';
import { createSupabaseServerClient } from './server';

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://supabase.example.test');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'public-test-key');
  mocks.createBrowserClient.mockReset();
  mocks.createServerClient.mockReset();
  mocks.cookies.mockReset();
});
afterEach(() => vi.unstubAllEnvs());

describe('Supabase client configuration boundaries', () => {
  it('requires public browser configuration and forwards the configured values', () => {
    const client = {};
    mocks.createBrowserClient.mockReturnValue(client);
    expect(createSupabaseBrowserClient()).toBe(client);
    expect(mocks.createBrowserClient).toHaveBeenCalledWith(
      'https://supabase.example.test',
      'public-test-key',
    );
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '');
    expect(() => createSupabaseBrowserClient()).toThrow(
      'Supabase is not configured',
    );
  });

  it('adapts cookie reads and writes for the server client', async () => {
    const cookieStore = {
      getAll: vi.fn(() => [{ name: 'session', value: 'one' }]),
      set: vi.fn(),
    };
    mocks.cookies.mockResolvedValue(cookieStore);
    const client = {};
    mocks.createServerClient.mockImplementation((_url, _key, options) => {
      expect(options.cookies.getAll()).toEqual([
        { name: 'session', value: 'one' },
      ]);
      options.cookies.setAll([
        { name: 'session', value: 'two', options: { httpOnly: true } },
      ]);
      return client;
    });
    await expect(createSupabaseServerClient()).resolves.toBe(client);
    expect(cookieStore.set).toHaveBeenCalledWith('session', 'two', {
      httpOnly: true,
    });
    expect(mocks.createServerClient).toHaveBeenCalledWith(
      'https://supabase.example.test',
      'public-test-key',
      expect.any(Object),
    );
  });

  it('ignores cookie writes rejected by a server component and checks missing server config', async () => {
    const cookieStore = {
      getAll: vi.fn(() => []),
      set: vi.fn(() => {
        throw new Error('read-only context');
      }),
    };
    mocks.cookies.mockResolvedValue(cookieStore);
    mocks.createServerClient.mockImplementation((_url, _key, options) => {
      expect(() =>
        options.cookies.setAll([{ name: 'a', value: 'b', options: {} }]),
      ).not.toThrow();
      return {};
    });
    await createSupabaseServerClient();
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    await expect(createSupabaseServerClient()).rejects.toThrow(
      'Supabase is not configured',
    );
  });
});
