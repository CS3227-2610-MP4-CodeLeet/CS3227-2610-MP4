import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { PATCH } from './route';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  rpc: vi.fn(),
  from: vi.fn(),
  courseRole: 'instructor' as string | null,
  featureEnabled: true,
  lifecycle: 'active' as string,
  submission: true,
  criteria: [
    {
      id: '00000000-0000-4000-8000-000000000002',
      title: 'Logic',
      maxScore: 10,
    },
  ],
}));
vi.mock('@/lib/auth/verified-user', () => ({
  getVerifiedUserRole: mocks.getUser,
}));
const submissionId = '00000000-0000-4000-8000-000000000001';
const courseId = '00000000-0000-4000-8000-000000000003';
const criterionId = '00000000-0000-4000-8000-000000000002';
const grade = {
  scores: { [criterionId]: 8 },
  feedback: 'Clear',
  totalScore: 8,
  publish: true,
  expectedVersion: 2,
};
function setup({
  submission = true,
  role = 'instructor',
  criteria = [{ id: criterionId, title: 'Logic', maxScore: 10 }],
  rpcResult = { data: { version: 3 }, error: null },
}: {
  submission?: boolean;
  role?: string | null;
  criteria?: unknown;
  rpcResult?: unknown;
} = {}) {
  mocks.submission = submission;
  mocks.courseRole = role;
  mocks.criteria = criteria as typeof mocks.criteria;
  const queryFor = (table: string) => {
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      maybeSingle: vi.fn(async () => {
        if (table === 'submissions')
          return {
            data: mocks.submission ? { assignment_id: 'assignment-1' } : null,
          };
        if (table === 'assignments') return { data: { course_id: courseId } };
        if (table === 'course_memberships')
          return { data: mocks.courseRole ? { role: mocks.courseRole } : null };
        if (table === 'courses')
          return { data: { lifecycle: mocks.lifecycle } };
        if (table === 'course_features')
          return { data: { enabled: mocks.featureEnabled } };
        if (table === 'assignment_rubrics')
          return { data: { criteria: mocks.criteria } };
        return { data: null };
      }),
    };
    return query;
  };
  mocks.from.mockImplementation(queryFor);
  mocks.rpc.mockResolvedValue(rpcResult);
  mocks.getUser.mockResolvedValue({
    user: { id: 'teacher' },
    role: 'student',
    supabase: { from: mocks.from, rpc: mocks.rpc },
  });
}
function request(body: unknown, origin = 'http://localhost') {
  return new NextRequest(`http://localhost/api/grades/${submissionId}`, {
    method: 'PATCH',
    headers: { origin, host: 'localhost', 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}
const call = (
  body: unknown,
  id = submissionId,
  origin?: string,
): Promise<Response> =>
  PATCH(request(body, origin), {
    params: Promise.resolve({ id }),
  }) as Promise<Response>;
beforeEach(() => {
  vi.stubEnv('APP_SITE_URL', '');
  mocks.getUser.mockReset();
  mocks.from.mockReset();
  mocks.rpc.mockReset();
  mocks.featureEnabled = true;
  mocks.lifecycle = 'active';
});

describe('grade PATCH route', () => {
  it('rejects foreign-origin, missing-user, invalid-id and malformed grade requests', async () => {
    expect(
      (await call(grade, submissionId, 'https://attacker.test')).status,
    ).toBe(403);
    mocks.getUser.mockResolvedValue({ user: null, role: null, supabase: null });
    expect((await call(grade)).status).toBe(401);
    setup();
    expect((await call(grade, 'invalid')).status).toBe(404);
    expect((await call({ ...grade, extra: true })).status).toBe(400);
  });

  it('requires an existing submission, instructor membership and matching private rubric', async () => {
    setup({ submission: false });
    expect((await call(grade)).status).toBe(404);
    setup({ role: 'student' });
    expect((await call(grade)).status).toBe(404);
    setup();
    const invalid = await call({ ...grade, totalScore: 9 });
    expect(invalid.status).toBe(400);
    expect((await invalid.json()).error.message).toContain('private rubric');
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('saves the validated grade through the versioned database operation', async () => {
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

  it('denies archived or feature-disabled grade writes', async () => {
    setup();
    mocks.lifecycle = 'archived';
    expect((await call(grade)).status).toBe(404);
    mocks.lifecycle = 'active';
    mocks.featureEnabled = false;
    expect((await call(grade)).status).toBe(404);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('maps version conflicts separately from other persistence failures', async () => {
    setup({ rpcResult: { data: null, error: { code: '40001' } } });
    expect((await call(grade)).status).toBe(409);
    setup({ rpcResult: { data: null, error: { code: 'XX000' } } });
    expect((await call(grade)).status).toBe(400);
  });
});
