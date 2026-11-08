import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), from: vi.fn() }));
vi.mock('@/lib/auth/verified-user', () => ({
  getVerifiedUserRole: mocks.getUser,
}));
beforeEach(() => {
  mocks.getUser.mockReset();
  mocks.from.mockReset();
});

describe('AI usage route', () => {
  it('requires a verified role and returns only the current user usage', async () => {
    mocks.getUser.mockResolvedValue({ user: null, role: null, supabase: null });
    expect((await GET()).status).toBe(401);
    const query = {
      select: vi.fn(function (this: unknown) {
        return this;
      }),
      eq: vi.fn(function (this: unknown) {
        return this;
      }),
      order: vi.fn(function (this: unknown) {
        return this;
      }),
      limit: vi
        .fn()
        .mockResolvedValue({ data: [{ review_type: 'student' }], error: null }),
    };
    mocks.from.mockReturnValue(query);
    mocks.getUser.mockResolvedValue({
      user: { id: 'user-1' },
      role: 'student',
      supabase: { from: mocks.from },
    });
    const response = await GET();
    expect(await response.json()).toEqual({
      role: 'student',
      usage: [{ review_type: 'student' }],
    });
    expect(query.eq).toHaveBeenCalledWith('requester_id', 'user-1');
    expect(query.limit).toHaveBeenCalledWith(100);
  });

  it('returns a safe failure when usage cannot be read', async () => {
    const query = {
      select() {
        return this;
      },
      eq() {
        return this;
      },
      order() {
        return this;
      },
      limit: vi
        .fn()
        .mockResolvedValue({ data: null, error: new Error('private') }),
    };
    mocks.from.mockReturnValue(query);
    mocks.getUser.mockResolvedValue({
      user: { id: 'user-2' },
      role: 'admin',
      supabase: { from: mocks.from },
    });
    const response = await GET();
    expect(response.status).toBe(500);
    expect((await response.json()).error.message).toBe(
      'Usage could not be loaded.',
    );
  });
});
