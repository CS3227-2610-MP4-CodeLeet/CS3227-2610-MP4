/* eslint-disable max-lines-per-function -- behavioral test suites keep related scenarios together. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
}));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));

import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  getVerifiedUserRole,
  requireRole,
  requireMember,
} from './verified-user';

describe('verified application identity', () => {
  it('requires a verified provisioned member for shared pages', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(requireMember()).rejects.toThrow('redirect:/sign-in');
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'member' } },
      error: null,
    });
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    mocks.from.mockReturnValue({
      select: () => ({ eq: () => ({ maybeSingle }) }),
    });
    await expect(requireMember()).rejects.toThrow('redirect:/unauthorized');
    maybeSingle.mockResolvedValue({ data: { role: 'student' }, error: null });
    expect((await requireMember()).role).toBe('student');
  });
  afterEach(() => vi.unstubAllEnvs());

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://localhost:54321');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'test-public-key');
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: { getUser: mocks.getUser },
      from: mocks.from,
    } as never);
  });

  it('uses the verified user and protected user_roles row as identity', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'trusted-user-id' } },
      error: null,
    });
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { role: 'instructor' },
      error: null,
    });
    const eq = vi.fn(() => ({ maybeSingle }));
    const select = vi.fn(() => ({ eq }));
    mocks.from.mockReturnValue({ select });

    const context = await getVerifiedUserRole();

    expect(context.user?.id).toBe('trusted-user-id');
    expect(context.role).toBe('instructor');
    expect(mocks.from).toHaveBeenCalledWith('user_roles');
    expect(mocks.getUser).toHaveBeenCalledOnce();
  });

  it('resolves admin as a verified application role', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'trusted-admin-id' } },
      error: null,
    });
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { role: 'admin' },
      error: null,
    });
    const eq = vi.fn(() => ({ maybeSingle }));
    mocks.from.mockReturnValue({ select: vi.fn(() => ({ eq })) });

    const context = await getVerifiedUserRole();

    expect(context.role).toBe('admin');
  });

  it('does not resolve a role when the auth server cannot verify a user', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error(),
    });

    const context = await getVerifiedUserRole();

    expect(context.user).toBeNull();
    expect(context.role).toBeNull();
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('fails closed when Supabase config is missing or the role row is invalid', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    expect(await getVerifiedUserRole()).toEqual({
      supabase: null,
      user: null,
      role: null,
    });
    expect(createSupabaseServerClient).not.toHaveBeenCalled();

    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://localhost:54321');
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'user' } },
      error: null,
    });
    const maybeSingle = vi
      .fn()
      .mockResolvedValue({ data: { role: 'owner' }, error: null });
    mocks.from.mockReturnValue({
      select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle })) })),
    });
    expect((await getVerifiedUserRole()).role).toBeNull();
  });

  it('fails on role lookup errors and enforces redirects in requireRole', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'user' } },
      error: null,
    });
    mocks.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi
            .fn()
            .mockResolvedValue({ data: null, error: new Error() }),
        })),
      })),
    });
    await expect(getVerifiedUserRole()).rejects.toThrow(
      'Unable to verify account role',
    );

    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: { getUser: mocks.getUser },
      from: mocks.from,
    } as never);
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(requireRole('student')).rejects.toThrow('redirect:/sign-in');

    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'student' } },
      error: null,
    });
    const maybeSingle = vi
      .fn()
      .mockResolvedValue({ data: { role: 'student' }, error: null });
    mocks.from.mockReturnValue({
      select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle })) })),
    });
    await expect(requireRole('admin')).rejects.toThrow(
      'redirect:/unauthorized',
    );
    await expect(requireRole('student')).resolves.toMatchObject({
      role: 'student',
      user: { id: 'student' },
    });
  });
});
