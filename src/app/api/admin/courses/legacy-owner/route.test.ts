import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({ auth: vi.fn(), rpc: vi.fn() }));
vi.mock('@/lib/auth/verified-user', () => ({
  getVerifiedUserRole: mocks.auth,
}));
import { PUT } from './route';

const ownerId = '00000000-0000-4000-8000-000000000001';
function request(body: unknown, origin = 'http://localhost:3000') {
  return new NextRequest(
    'http://localhost:3000/api/admin/courses/legacy-owner',
    {
      method: 'PUT',
      headers: { origin, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
}
function put(body: unknown, origin?: string) {
  return PUT(request(body, origin)) as Promise<Response>;
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({
    user: { id: '00000000-0000-4000-8000-000000000002' },
    role: 'admin',
    supabase: { rpc: mocks.rpc },
  });
  mocks.rpc.mockResolvedValue({ error: null });
});

describe('Legacy course ownership API', () => {
  it('assigns an instructor through the platform-admin RPC', async () => {
    const response = await put({ ownerId });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'assigned' });
    expect(mocks.rpc).toHaveBeenCalledWith('assign_legacy_course_owner', {
      p_owner: ownerId,
    });
  });

  it('rejects non-admins, invalid owners, cross-origin requests, and RPC denial', async () => {
    mocks.auth.mockResolvedValueOnce({
      user: { id: '00000000-0000-4000-8000-000000000002' },
      role: 'instructor',
      supabase: { rpc: mocks.rpc },
    });
    expect((await put({ ownerId })).status).toBe(403);
    expect((await put({ ownerId: 'invalid' })).status).toBe(400);
    expect((await put({ ownerId }, 'https://outside.test')).status).toBe(403);
    mocks.rpc.mockResolvedValueOnce({ error: { code: '42501' } });
    expect((await put({ ownerId })).status).toBe(403);
  });
});
