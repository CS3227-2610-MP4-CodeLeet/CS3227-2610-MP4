import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({ auth: vi.fn(), rpc: vi.fn() }));
vi.mock('@/lib/auth/verified-user', () => ({
  getVerifiedUserRole: mocks.auth,
}));
import { DELETE, PATCH } from './route';

const courseId = '00000000-0000-4000-8000-000000000001';
const userId = '00000000-0000-4000-8000-000000000002';
const context = { params: Promise.resolve({ courseId, userId }) };
function request(
  method: string,
  body?: unknown,
  origin = 'http://localhost:3000',
) {
  return new NextRequest(
    `http://localhost:3000/api/courses/${courseId}/members/${userId}`,
    {
      method,
      headers: {
        origin,
        ...(body ? { 'content-type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    },
  );
}
function patch(body: unknown) {
  return PATCH(request('PATCH', body), context) as Promise<Response>;
}
function remove(origin = 'http://localhost:3000') {
  return DELETE(
    request('DELETE', undefined, origin),
    context,
  ) as Promise<Response>;
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({
    user: { id: '00000000-0000-4000-8000-000000000003' },
    role: 'instructor',
    supabase: { rpc: mocks.rpc },
  });
  mocks.rpc.mockResolvedValue({ error: null });
});

describe('course member management API', () => {
  it('updates a member role and removes a member through the same authorization RPC', async () => {
    const updated = await patch({ role: 'instructor' });
    expect(updated.status).toBe(200);
    expect(await updated.json()).toEqual({ status: 'updated' });
    expect(mocks.rpc).toHaveBeenNthCalledWith(1, 'set_course_member', {
      p_course: courseId,
      p_user: userId,
      p_role: 'instructor',
    });

    const removed = await remove();
    expect(removed.status).toBe(200);
    expect(await removed.json()).toEqual({ status: 'removed' });
    expect(mocks.rpc).toHaveBeenNthCalledWith(2, 'set_course_member', {
      p_course: courseId,
      p_user: userId,
      p_role: null,
    });
  });

  it('rejects malformed identities, roles and origins before mutation', async () => {
    expect((await patch({ role: 'admin' })).status).toBe(400);
    expect((await remove('https://outside.test')).status).toBe(403);
    expect(
      (
        (await DELETE(request('DELETE'), {
          params: Promise.resolve({ courseId, userId: 'invalid' }),
        })) as Response
      ).status,
    ).toBe(404);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('does not allow a course-role RPC denial to appear successful', async () => {
    mocks.rpc.mockResolvedValueOnce({ error: { code: '42501' } });
    expect((await patch({ role: 'student' })).status).toBe(403);
  });
});
