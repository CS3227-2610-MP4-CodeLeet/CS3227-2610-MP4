import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ auth: vi.fn(), rpc: vi.fn() }));
vi.mock('@/lib/auth/verified-user', () => ({
  getVerifiedUserRole: mocks.auth,
}));
import { postForum } from './post-route';

const id = 'f0300000-0000-4000-8000-000000000001';
const input = { title: 'Question', body: 'Message', requestId: id };
function request(value: unknown = input, origin = 'http://localhost:3000') {
  return new Request('http://localhost:3000/api/forums/posts', {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify(value),
  });
}
beforeEach(() => {
  vi.stubEnv('APP_SITE_URL', 'http://localhost:3000');
  mocks.auth.mockReset();
  mocks.rpc.mockReset();
  mocks.auth.mockResolvedValue({
    user: { id },
    role: 'student',
    supabase: { rpc: mocks.rpc },
  });
  mocks.rpc.mockResolvedValue({
    data: { threadId: id, postId: id },
    error: null,
  });
});
describe('forum posting boundary', () => {
  it('rejects foreign origin before looking up identity', async () => {
    expect(
      (await postForum(request(input, 'https://foreign.example'))).status,
    ).toBe(403);
    expect(mocks.auth).not.toHaveBeenCalled();
  });
  it.each([null, 'unprovisioned'])(
    'rejects invalid membership (%s)',
    async (role) => {
      mocks.auth.mockResolvedValue({
        user: role ? { id } : null,
        role: null,
        supabase: role ? { rpc: mocks.rpc } : null,
      });
      expect((await postForum(request())).status).toBe(role ? 403 : 401);
      expect(mocks.rpc).not.toHaveBeenCalled();
    },
  );
  it('rejects forged author fields without writing', async () => {
    expect((await postForum(request({ ...input, authorId: id }))).status).toBe(
      400,
    );
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('bounds incoming JSON before parsing', async () => {
    expect(
      (await postForum(request({ ...input, body: 'x'.repeat(34001) }))).status,
    ).toBe(413);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it.each(['student', 'instructor'])(
    'saves for %s with no client author',
    async (role) => {
      mocks.auth.mockResolvedValue({
        user: { id },
        role,
        supabase: { rpc: mocks.rpc },
      });
      const response = await postForum(request());
      expect(response.status).toBe(201);
      expect(response.headers.get('cache-control')).toBe('private, no-store');
      expect(mocks.rpc).toHaveBeenCalledWith('create_forum_post', {
        p_thread_id: null,
        p_title: 'Question',
        p_body: 'Message',
        p_request_id: id,
      });
    },
  );
  it.each([
    ['23505', 'conflict', 409],
    ['P0002', 'missing', 404],
    ['42501', 'denied', 403],
    ['22023', 'invalid', 400],
    ['XX000', 'private provider detail', 503],
  ])('maps safe errors (%s)', async (code, message, status) => {
    mocks.rpc.mockResolvedValue({ error: { code, message }, data: null });
    const response = await postForum(request());
    expect(response.status).toBe(status);
    expect(await response.text()).not.toContain('private provider detail');
  });
  it('returns retry guidance for rate limits', async () => {
    mocks.rpc.mockResolvedValue({
      error: { code: 'P0001', message: 'forum_rate_limited' },
    });
    const response = await postForum(request());
    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('60');
  });
});
