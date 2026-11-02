import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PATCH } from './route';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  rpc: vi.fn(),
  from: vi.fn(),
}));
vi.mock('@/lib/auth/verified-user', () => ({
  getVerifiedUserRole: mocks.getUser,
}));
const submissionId = '00000000-0000-4000-8000-000000000001';
const criterionId = '00000000-0000-4000-8000-000000000002';
const grade = {
  scores: { [criterionId]: 8 },
  feedback: 'Clear',
  totalScore: 8,
  publish: true,
  expectedVersion: 2,
};
function request(body: unknown, origin = 'http://localhost') {
  return new Request('http://localhost/api/grades/x', {
    method: 'PATCH',
    headers: { origin, host: 'localhost', 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}
function setup({
  submission = true,
  criteria = [{ id: criterionId, title: 'Logic', maxScore: 10 }],
  rpcResult = { data: { version: 3 }, error: null },
}: { submission?: boolean; criteria?: unknown; rpcResult?: unknown } = {}) {
  mocks.from.mockImplementation((table: string) => ({
    select() {
      return this;
    },
    eq() {
      return this;
    },
    maybeSingle: async () =>
      table === 'submissions'
        ? { data: submission ? { assignment_id: 'assignment-1' } : null }
        : { data: { criteria } },
  }));
  mocks.rpc.mockResolvedValue(rpcResult);
  mocks.getUser.mockResolvedValue({
    user: { id: 'instructor' },
    role: 'instructor',
    supabase: { from: mocks.from, rpc: mocks.rpc },
  });
}
const call = (
  body: unknown,
  id = submissionId,
  origin?: string,
): Promise<Response> =>
  PATCH(request(body, origin) as never, {
    params: Promise.resolve({ id }),
  }) as Promise<Response>;

beforeEach(() => {
  vi.stubEnv('APP_SITE_URL', '');
  mocks.getUser.mockReset();
  mocks.from.mockReset();
  mocks.rpc.mockReset();
});

describe('grade PATCH route', () => {
  it('rejects cross-origin, missing-user, invalid-id, and malformed grade requests', async () => {
    expect(
      (await call(grade, submissionId, 'https://attacker.test')).status,
    ).toBe(403);
    mocks.getUser.mockResolvedValueOnce({
      user: null,
      role: null,
      supabase: null,
    });
    expect((await call(grade)).status).toBe(401);
    mocks.getUser.mockResolvedValueOnce({
      user: { id: 'student' },
      role: 'student',
      supabase: {},
    });
    expect((await call(grade)).status).toBe(403);
    setup();
    expect((await call(grade, 'invalid')).status).toBe(404);
    expect((await call({ ...grade, extra: true })).status).toBe(400);
  });

  it('requires an existing submission and exact private-rubric score totals', async () => {
    setup({ submission: false });
    expect((await call(grade)).status).toBe(404);
    setup();
    const invalid = await call({ ...grade, totalScore: 9 });
    expect(invalid.status).toBe(400);
    expect((await invalid.json()).error.message).toContain('private rubric');
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('saves the validated grade with explicit publication and version values', async () => {
    setup();
    const response = await call(grade);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ grade: { version: 3 } });
    expect(mocks.rpc).toHaveBeenCalledWith('save_grade', {
      p_submission_id: submissionId,
      p_scores: grade.scores,
      p_feedback: 'Clear',
      p_total: 8,
      p_publish: true,
      p_expected_version: 2,
    });
  });

  it('maps version conflicts separately from other persistence failures', async () => {
    setup({ rpcResult: { data: null, error: { code: '40001' } } });
    expect((await call(grade)).status).toBe(409);
    setup({ rpcResult: { data: null, error: { code: 'XX000' } } });
    expect((await call(grade)).status).toBe(400);
  });
});
