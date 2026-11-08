import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({ auth: vi.fn(), rpc: vi.fn() }));
vi.mock('@/lib/auth/verified-user', () => ({
  getVerifiedUserRole: mocks.auth,
}));
import { PUT } from './route';

const courseId = '00000000-0000-4000-8000-000000000001';
function put(body: unknown, origin = 'http://localhost:3000') {
  const request = new NextRequest(
    `http://localhost:3000/api/courses/${courseId}/features`,
    {
      method: 'PUT',
      headers: { origin, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
  return PUT(request, {
    params: Promise.resolve({ courseId }),
  }) as Promise<Response>;
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({
    user: { id: '00000000-0000-4000-8000-000000000002' },
    role: 'student',
    supabase: { rpc: mocks.rpc },
  });
  mocks.rpc.mockResolvedValue({ data: null, error: null });
});

describe('course feature settings API', () => {
  it('validates a shipped feature and delegates course-role authorization to the RPC', async () => {
    expect((await put({ feature: 'ai', enabled: false })).status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith('set_course_feature', {
      p_course: courseId,
      p_feature: 'ai',
      p_enabled: false,
    });
  });
  it('rejects cross-origin, unsupported and malformed feature updates', async () => {
    expect((await put({ feature: 'levels', enabled: false })).status).toBe(400);
    expect(
      (await put({ feature: 'ai', enabled: false }, 'https://attacker.test'))
        .status,
    ).toBe(403);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
