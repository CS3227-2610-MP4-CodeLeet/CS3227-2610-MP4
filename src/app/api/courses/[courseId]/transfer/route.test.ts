import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({ auth: vi.fn(), rpc: vi.fn() }));
vi.mock('@/lib/auth/verified-user', () => ({
  getVerifiedUserRole: mocks.auth,
}));
import { POST } from './route';

const courseId = '00000000-0000-4000-8000-000000000001';
const newOwnerId = '00000000-0000-4000-8000-000000000002';
function request(body: unknown, origin = 'http://localhost:3000') {
  return new NextRequest(
    `http://localhost:3000/api/courses/${courseId}/transfer`,
    {
      method: 'POST',
      headers: { origin, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
}
function post(body: unknown, origin?: string, course = courseId) {
  return POST(request(body, origin), {
    params: Promise.resolve({ courseId: course }),
  }) as Promise<Response>;
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

describe('course ownership transfer API', () => {
  it('transfers to the selected instructor through the owner-checked RPC', async () => {
    const response = await post({ newOwnerId });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'transferred' });
    expect(mocks.rpc).toHaveBeenCalledWith('transfer_course_ownership', {
      p_course: courseId,
      p_new_owner: newOwnerId,
    });
  });

  it('rejects forged owner ids, invalid courses and cross-origin requests', async () => {
    expect((await post({ newOwnerId: 'not-a-uuid' })).status).toBe(400);
    expect((await post({ newOwnerId }, 'https://outside.test')).status).toBe(
      403,
    );
    expect((await post({ newOwnerId }, undefined, 'invalid')).status).toBe(404);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
