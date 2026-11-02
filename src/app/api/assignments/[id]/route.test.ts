import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PATCH } from './route';

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), rpc: vi.fn() }));
vi.mock('@/lib/auth/verified-user', () => ({
  getVerifiedUserRole: mocks.getUser,
}));
const id = '00000000-0000-4000-8000-000000000010';
const input = {
  title: 'Loop exercise',
  instructions: 'Print a result.',
  language: 'python',
  publicationStatus: 'published',
  expectedVersion: 3,
  rubric: [
    {
      id: '00000000-0000-4000-8000-000000000011',
      title: 'Correctness',
      description: 'Expected behavior',
      maxScore: 10,
    },
  ],
};
function req(body: unknown, origin = 'http://localhost') {
  return new Request('http://localhost/api/assignments/id', {
    method: 'PATCH',
    headers: { origin, host: 'localhost', 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}
const call = (body: unknown, assignmentId = id, origin?: string) =>
  PATCH(req(body, origin) as never, {
    params: Promise.resolve({ id: assignmentId }),
  });
beforeEach(() => {
  vi.stubEnv('APP_SITE_URL', '');
  mocks.getUser.mockReset();
  mocks.rpc.mockReset();
});
it('updates XP and an explicitly cleared deadline together', async () => {
  mocks.getUser.mockResolvedValue({
    user: { id: 'owner' },
    role: 'instructor',
    supabase: { rpc: mocks.rpc },
  });
  mocks.rpc.mockResolvedValue({ data: { id, max_xp: 0 }, error: null });
  expect((await call({ ...input, maxXp: 0, dueAt: null })).status).toBe(200);
  expect(mocks.rpc).toHaveBeenCalledWith(
    'save_assignment_with_xp',
    expect.objectContaining({
      p_max_xp: 0,
      p_update_due_at: true,
      p_due_at: null,
    }),
  );
});

describe('assignment PATCH route', () => {
  it('rejects cross-origin and unauthorized callers', async () => {
    expect((await call(input, id, 'https://attacker.test')).status).toBe(403);
    mocks.getUser.mockResolvedValueOnce({
      user: null,
      role: null,
      supabase: null,
    });
    expect((await call(input)).status).toBe(401);
    mocks.getUser.mockResolvedValueOnce({
      user: { id: 'student' },
      role: 'student',
      supabase: {},
    });
    expect((await call(input)).status).toBe(403);
  });

  it('validates bounded input and the assignment identifier before writing', async () => {
    const context = {
      user: { id: 'teacher' },
      role: 'instructor',
      supabase: { rpc: mocks.rpc },
    };
    mocks.getUser.mockResolvedValue(context);
    expect((await call('not json')).status).toBe(400);
    expect((await call({ ...input, extra: true })).status).toBe(400);
    expect((await call(input, 'invalid')).status).toBe(404);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('updates the expected version and maps language-lock and concurrency errors', async () => {
    mocks.getUser.mockResolvedValue({
      user: { id: 'teacher' },
      role: 'admin',
      supabase: { rpc: mocks.rpc },
    });
    mocks.rpc.mockResolvedValueOnce({ data: { id, version: 4 }, error: null });
    const saved = await call(input);
    expect(saved.status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith(
      'save_assignment',
      expect.objectContaining({ p_assignment_id: id, p_expected_version: 3 }),
    );
    mocks.rpc.mockResolvedValueOnce({
      data: null,
      error: { code: '40001', message: 'assignment_language_locked' },
    });
    const locked = await call(input);
    expect(locked.status).toBe(409);
    expect((await locked.json()).error.message).toContain(
      'Language cannot change',
    );
    mocks.rpc.mockResolvedValueOnce({
      data: null,
      error: { code: 'XX000', message: 'private' },
    });
    expect((await call(input)).status).toBe(400);
  });
});
