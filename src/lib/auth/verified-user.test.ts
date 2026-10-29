import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
}));

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getVerifiedUserRole } from './verified-user';

describe('verified application identity', () => {
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
});
