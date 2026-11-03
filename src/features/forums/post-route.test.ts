import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  rpc: vi.fn(),
  from: vi.fn(),
  courseRole: 'student' as string | null,
}));
vi.mock('@/lib/auth/verified-user', () => ({
  getVerifiedUserRole: mocks.auth,
}));
import { postForum } from './post-route';

const id = 'f0300000-0000-4000-8000-000000000001';
const courseId = 'f0300000-0000-4000-8000-000000000020';
const input = { title: 'Question', body: 'Message', requestId: id, courseId };
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
  mocks.from.mockReset();
  mocks.courseRole = 'student';
  mocks.from.mockImplementation((table: string) => {
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      maybeSingle: vi.fn(async () => {
        if (table === 'course_memberships')
          return { data: mocks.courseRole ? { role: mocks.courseRole } : null };
        if (table === 'courses') return { data: { lifecycle: 'active' } };
        if (table === 'course_features') return { data: { enabled: true } };
        return { data: null };
      }),
    };
    return query;
  });
  mocks.auth.mockResolvedValue({
    user: { id },
    role: 'student',
    supabase: { rpc: mocks.rpc, from: mocks.from },
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
        role: role ? 'student' : null,
        supabase: role ? { rpc: mocks.rpc, from: mocks.from } : null,
      });
      if (role) mocks.courseRole = null;
      expect((await postForum(request())).status).toBe(role ? 404 : 401);
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
        supabase: { rpc: mocks.rpc, from: mocks.from },
      });
      const response = await postForum(request());
      expect(response.status).toBe(201);
      expect(response.headers.get('cache-control')).toBe('private, no-store');
      expect(mocks.rpc).toHaveBeenCalledWith('create_forum_post', {
        p_course_id: courseId,
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

describe('forum account provisioning', () => {
  it('requires a provisioned account before checking course enrollment', async () => {
    mocks.auth.mockResolvedValue({
      user: { id },
      role: null,
      supabase: { rpc: mocks.rpc, from: mocks.from },
    });
    expect((await postForum(request())).status).toBe(403);
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
