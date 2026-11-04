import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  setSession: vi.fn(),
  getUser: vi.fn(),
  maybeSingle: vi.fn(),
  rpc: vi.fn(),
}));
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: mocks.create,
}));
import { POST } from './route';
const courseId = '00000000-0000-4000-8000-000000000002';
const token = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN';
const session = {
  accessToken: 'access-token-synthetic-value-123456',
  refreshToken: 'refresh-1234',
};
function request(body: unknown, origin = 'http://localhost:3000') {
  return new NextRequest(
    'http://localhost:3000/api/courses/invitations/accept',
    {
      method: 'POST',
      headers: { origin, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
}
function post(body: unknown, origin?: string): Promise<Response> {
  return POST(request(body, origin)) as Promise<Response>;
}
function inviteBody() {
  return { token, ...session };
}
beforeEach(() => {
  vi.stubEnv('APP_SITE_URL', 'http://localhost:3000');
  vi.clearAllMocks();
  mocks.setSession.mockResolvedValue({ data: { session: true }, error: null });
  mocks.getUser.mockResolvedValue({
    data: {
      user: {
        id: '00000000-0000-4000-8000-000000000001',
        email_confirmed_at: '2026-01-01T00:00:00Z',
      },
    },
    error: null,
  });
  mocks.maybeSingle.mockResolvedValue({
    data: { role: 'student' },
    error: null,
  });
  mocks.rpc.mockResolvedValue({ data: courseId, error: null });
  mocks.create.mockResolvedValue({
    auth: { setSession: mocks.setSession, getUser: mocks.getUser },
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: mocks.maybeSingle }) }),
    }),
    rpc: mocks.rpc,
  });
});
describe('course invitation acceptance API', () => {
  it('requires same-origin bounded JSON and a valid invited session', async () => {
    expect((await post(inviteBody(), 'https://attacker.test')).status).toBe(
      403,
    );
    expect((await post({ token: 'short' })).status).toBe(400);
    mocks.setSession.mockResolvedValueOnce({ error: new Error('bad session') });
    expect((await post(inviteBody())).status).toBe(404);
    mocks.getUser.mockResolvedValueOnce({
      data: { user: { id: '00000000-0000-4000-8000-000000000001' } },
      error: null,
    });
    expect((await post(inviteBody())).status).toBe(404);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('verifies the session and then delegates the email match to the database', async () => {
    const response = await post(inviteBody());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ courseId });
    expect(mocks.setSession).toHaveBeenCalledWith({
      access_token: session.accessToken,
      refresh_token: session.refreshToken,
    });
    expect(mocks.rpc).toHaveBeenCalledWith('accept_course_invitation', {
      p_token: token,
    });
  });
  it('does not disclose whether an invitation is expired, revoked or mismatched', async () => {
    mocks.rpc.mockResolvedValueOnce({
      data: null,
      error: new Error('private invitation detail'),
    });
    const response = await post(inviteBody());
    expect(response.status).toBe(404);
    expect(await response.text()).not.toContain('private invitation detail');
  });
});
