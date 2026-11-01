import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  getUser: vi.fn(),
}));
vi.mock('@supabase/ssr', () => ({
  createServerClient: mocks.createServerClient,
}));
import { proxy } from './proxy';
afterEach(() => vi.unstubAllEnvs());

describe('session refresh proxy', () => {
  it('passes requests through when Supabase is not configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'key');
    const response = await proxy(
      new NextRequest('https://app.example.test/student'),
    );
    expect(response.status).toBe(200);
    expect(mocks.createServerClient).not.toHaveBeenCalled();
  });

  it('refreshes the verified session and copies refreshed cookies to the response', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://supabase.example.test');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'public-key');
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'user' } } });
    mocks.createServerClient.mockImplementation((_url, _key, options) => {
      expect(options.cookies.getAll()).toEqual([
        { name: 'session', value: 'old' },
      ]);
      options.cookies.setAll([
        {
          name: 'session',
          value: 'new',
          options: { httpOnly: true, path: '/' },
        },
      ]);
      return { auth: { getUser: mocks.getUser } };
    });
    const response = await proxy(
      new NextRequest('https://app.example.test/student', {
        headers: { cookie: 'session=old' },
      }),
    );
    expect(mocks.getUser).toHaveBeenCalledOnce();
    expect(response.cookies.get('session')?.value).toBe('new');
  });
});
