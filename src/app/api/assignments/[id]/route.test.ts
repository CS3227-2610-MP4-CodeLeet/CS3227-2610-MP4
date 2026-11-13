import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { PATCH } from './route';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  rpc: vi.fn(),
  courseRole: 'instructor' as string | null,
  lifecycle: 'active' as string,
  featureEnabled: true,
  assignmentCourseId: '00000000-0000-4000-8000-000000000001',
}));
vi.mock('@/lib/auth/verified-user', () => ({
  getVerifiedUserRole: mocks.getUser,
}));
const courseId = '00000000-0000-4000-8000-000000000001';
const assignmentId = '00000000-0000-4000-8000-000000000010';
const input = {
  courseId,
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
function configureContext(
  role: string | null,
  user: { id: string } | null = { id: 'teacher' },
) {
  mocks.courseRole = role;
  const queryFor = (table: string) => {
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      maybeSingle: vi.fn(async () => {
        if (table === 'assignments')
          return { data: { course_id: mocks.assignmentCourseId }, error: null };
        if (table === 'course_memberships')
          return { data: role ? { role } : null, error: null };
        if (table === 'courses')
          return { data: { lifecycle: mocks.lifecycle }, error: null };
        if (table === 'course_features')
          return { data: { enabled: mocks.featureEnabled }, error: null };
        return { data: null, error: null };
      }),
    };
    return query;
  };
  mocks.from.mockImplementation(queryFor);
  return {
    user,
    role: 'student',
    supabase: { from: mocks.from, rpc: mocks.rpc },
  };
}
function req(body: unknown, origin = 'http://localhost') {
  return new NextRequest('http://localhost/api/assignments/' + assignmentId, {
    method: 'PATCH',
    headers: { origin, host: 'localhost', 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}
function call(body: unknown, origin?: string) {
  return PATCH(req(body, origin), {
    params: Promise.resolve({ id: assignmentId }),
  });
}
beforeEach(() => {
  vi.stubEnv('APP_SITE_URL', '');
  mocks.getUser.mockReset();
  mocks.from.mockReset();
  mocks.rpc.mockReset();
  mocks.courseRole = 'instructor';
  mocks.assignmentCourseId = courseId;
  mocks.lifecycle = 'active';
  mocks.featureEnabled = true;
});

describe('assignment PATCH route', () => {
  it('saves 25 maximum-size cases through the sole case-editing path', async () => {
    mocks.getUser.mockResolvedValue(configureContext('instructor'));
    mocks.rpc.mockResolvedValue({
      data: { id: assignmentId, version: 4 },
      error: null,
    });
    const cases = Array.from({ length: 25 }, () => ({
      id: crypto.randomUUID(),
      name: 'Case',
      stdin: '\u0001'.repeat(4096),
      expected_stdout: '\u0001'.repeat(8192),
      is_public: false,
    }));
    expect((await call({ ...input, cases })).status).toBe(200);
  });
  it('rejects foreign origin, invalid identity and invalid request data', async () => {
    expect((await call(input, 'https://attacker.test')).status).toBe(403);
    mocks.getUser.mockResolvedValue(configureContext(null, null));
    expect((await call(input)).status).toBe(401);
    mocks.getUser.mockResolvedValue(configureContext('student'));
    expect((await call({ ...input, extra: true })).status).toBe(400);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('requires a course instructor membership for the assignment course', async () => {
    mocks.getUser.mockResolvedValue(configureContext(null));
    expect((await call(input)).status).toBe(404);
    mocks.getUser.mockResolvedValue(configureContext('instructor'));
    mocks.assignmentCourseId = '00000000-0000-4000-8000-000000000099';
    expect((await call(input)).status).toBe(404);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('updates with the expected version through the course RPC', async () => {
    mocks.getUser.mockResolvedValue(configureContext('instructor'));
    mocks.rpc.mockResolvedValueOnce({
      data: { id: assignmentId, version: 4 },
      error: null,
    });
    const response = await call(input);
    expect(response.status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith(
      'save_course_assignment',
      expect.objectContaining({
        p_course_id: courseId,
        p_assignment_id: assignmentId,
        p_expected_version: 3,
        p_update_due_at: false,
      }),
    );
    mocks.rpc.mockResolvedValueOnce({
      data: null,
      error: { code: '40001', message: 'assignment_language_locked' },
    });
    expect((await call(input)).status).toBe(409);
  });
});
