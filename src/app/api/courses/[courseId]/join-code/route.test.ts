import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({ auth: vi.fn(), rpc: vi.fn() }));
vi.mock('@/lib/auth/verified-user', () => ({
  getVerifiedUserRole: mocks.auth,
}));
import { DELETE, PUT } from './route';

const courseId = '00000000-0000-4000-8000-000000000001';
const context = { params: Promise.resolve({ courseId }) };
function request(method: string, origin = 'http://localhost:3000') {
  return new NextRequest(
    `http://localhost:3000/api/courses/${courseId}/join-code`,
    {
      method,
      headers: { origin },
    },
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({
    user: { id: '00000000-0000-4000-8000-000000000002' },
    role: 'instructor',
    supabase: { rpc: mocks.rpc },
  });
  mocks.rpc.mockResolvedValue({ error: null });
});

describe('course join-code API', () => {
  it('rotates a high-entropy code and revokes it through course authorization RPCs', async () => {
    const created = await PUT(request('PUT'), context);
    const { code } = await created.json();
    expect(created.status).toBe(200);
    expect(code).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(mocks.rpc).toHaveBeenNthCalledWith(1, 'rotate_course_join_code', {
      p_course: courseId,
      p_code: code,
    });

    const revoked = await DELETE(request('DELETE'), context);
    expect(revoked.status).toBe(200);
    expect(await revoked.json()).toEqual({ status: 'revoked' });
    expect(mocks.rpc).toHaveBeenNthCalledWith(2, 'revoke_course_join_code', {
      p_course: courseId,
    });
  });

  it('rejects invalid context and unauthenticated requests before the RPC', async () => {
    expect(
      (await PUT(request('PUT', 'https://outside.test'), context)).status,
    ).toBe(403);
    expect(
      (
        await PUT(request('PUT'), {
          params: Promise.resolve({ courseId: 'invalid' }),
        })
      ).status,
    ).toBe(404);
    mocks.auth.mockResolvedValueOnce({
      user: null,
      supabase: null,
      role: null,
    });
    expect((await DELETE(request('DELETE'), context)).status).toBe(401);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('maps membership denial without revealing database details', async () => {
    mocks.rpc.mockResolvedValueOnce({
      error: { code: '42501', message: 'secret' },
    });
    const response = await PUT(request('PUT'), context);
    expect(response.status).toBe(403);
    expect(await response.text()).not.toContain('secret');
  });

  it('denies students who directly request code creation or revocation', async () => {
    mocks.auth.mockResolvedValue({
      user: { id: 'student-id' },
      role: 'student',
      supabase: { rpc: mocks.rpc },
    });
    mocks.rpc.mockResolvedValue({
      error: { code: '42501', message: 'course_staff_required' },
    });

    const created = await PUT(request('PUT'), context);
    const revoked = await DELETE(request('DELETE'), context);

    expect(created.status).toBe(403);
    expect(revoked.status).toBe(403);
    expect(mocks.rpc).toHaveBeenNthCalledWith(1, 'rotate_course_join_code', {
      p_course: courseId,
      p_code: expect.any(String),
    });
    expect(mocks.rpc).toHaveBeenNthCalledWith(2, 'revoke_course_join_code', {
      p_course: courseId,
    });
  });
});
