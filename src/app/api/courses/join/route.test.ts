import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => ({ auth: vi.fn(), rpc: vi.fn() }));
vi.mock('@/lib/auth/verified-user', () => ({
  getVerifiedUserRole: mocks.auth,
}));
import { POST } from './route';
const courseId = '00000000-0000-4000-8000-000000000002';
const code = 'synthetic-join-code-abcdefghijklmnopqrstuvwxyz';
function request(body: unknown, origin = 'http://localhost:3000') {
  return new NextRequest('http://localhost:3000/api/courses/join', {
    method: 'POST',
    headers: { origin, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}
function post(body: unknown, origin?: string): Promise<Response> {
  return POST(request(body, origin)) as Promise<Response>;
}
beforeEach(() => {
  vi.stubEnv('APP_SITE_URL', 'http://localhost:3000');
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({
    user: {
      id: '00000000-0000-4000-8000-000000000001',
      email_confirmed_at: '2026-01-01T00:00:00Z',
    },
    role: 'student',
    supabase: { rpc: mocks.rpc },
  });
  mocks.rpc.mockResolvedValue({ data: courseId, error: null });
});
describe('student course join API', () => {
  it('requires same-origin bounded JSON and a valid code shape', async () => {
    expect((await post({ code }, 'https://attacker.test')).status).toBe(403);
    expect((await post({ code: 'short' })).status).toBe(400);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('requires verified sign-in and delegates a valid code to the rate-limited RPC', async () => {
    mocks.auth.mockResolvedValueOnce({
      user: { id: '00000000-0000-4000-8000-000000000001' },
      role: 'student',
      supabase: { rpc: mocks.rpc },
    });
    expect((await post({ code })).status).toBe(403);
    expect(mocks.rpc).not.toHaveBeenCalled();
    const response = await post({ code });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ courseId });
    expect(mocks.rpc).toHaveBeenCalledWith('join_course_by_code', {
      p_code: code,
    });
  });
  it('returns a generic response for an invalid, revoked or exhausted code', async () => {
    mocks.rpc.mockResolvedValueOnce({ data: null, error: null });
    expect((await post({ code })).status).toBe(404);
  });
});
