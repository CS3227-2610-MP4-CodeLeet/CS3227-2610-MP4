import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({ getVerifiedUserRole: vi.fn(), rpc: vi.fn() }));
vi.mock('@/lib/auth/verified-user', () => ({
  getVerifiedUserRole: mocks.getVerifiedUserRole,
}));

import { PATCH } from './route';

const userId = '00000000-0000-4000-8000-000000000002';
const context = { params: Promise.resolve({ userId }) };
const request = (body: unknown) =>
  new NextRequest(`http://localhost:3000/api/admin/users/${userId}/role`, {
    method: 'PATCH',
    headers: {
      origin: 'http://localhost:3000',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getVerifiedUserRole.mockResolvedValue({
    user: { id: '00000000-0000-4000-8000-000000000001' },
    role: 'admin',
    supabase: { rpc: mocks.rpc },
  });
  mocks.rpc.mockResolvedValue({ data: null, error: null });
});

describe('PATCH /api/admin/users/:userId/role', () => {
  it('updates a role through the protected database operation', async () => {
    const response = await PATCH(request({ role: 'instructor' }), context);
    expect(response.status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith('admin_set_user_role', {
      p_user_id: userId,
      p_role: 'instructor',
    });
  });

  it('rejects unsupported roles without calling the database', async () => {
    const response = await PATCH(request({ role: 'owner' }), context);
    expect(response.status).toBe(400);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('maps final-admin protection to conflict', async () => {
    mocks.rpc.mockResolvedValueOnce({
      data: null,
      error: { code: 'P0001', message: 'final_admin_required' },
    });
    const response = await PATCH(request({ role: 'student' }), context);
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      error: { code: 'final_admin_required' },
    });
  });

  it('denies non-admins before calling the database', async () => {
    mocks.getVerifiedUserRole.mockResolvedValueOnce({
      user: { id: 'student-id' },
      role: 'student',
      supabase: { rpc: mocks.rpc },
    });
    const response = await PATCH(request({ role: 'admin' }), context);
    expect(response.status).toBe(403);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
