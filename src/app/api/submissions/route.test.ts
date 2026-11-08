import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  rpc: vi.fn(),
  courseRole: 'student' as string | null,
  featureEnabled: true,
  lifecycle: 'active' as string,
}));
vi.mock('@/lib/auth/verified-user', () => ({
  getVerifiedUserRole: mocks.getUser,
}));
const assignment = {
  assignmentId: '00000000-0000-4000-8000-000000000001',
  source: 'print(1)',
  requestId: '00000000-0000-4000-8000-000000000002',
};
const courseId = '00000000-0000-4000-8000-000000000010';
function context(
  role: string | null,
  user: { id: string } | null = { id: 'student' },
) {
  mocks.courseRole = role;
  const queryFor = (table: string) => {
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      maybeSingle: vi.fn(async () => {
        if (table === 'assignments')
          return { data: { course_id: courseId }, error: null };
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
    supabase: { from: mocks.from, rpc: mocks.rpc },
    user,
    role: 'instructor',
  };
}
function request(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/submissions', {
    method: 'POST',
    headers: {
      origin: 'http://localhost',
      host: 'localhost',
      'content-type': 'application/json',
      ...headers,
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}
function post(body: unknown, headers: Record<string, string> = {}) {
  return POST(request(body, headers));
}
beforeEach(() => {
  vi.stubEnv('APP_SITE_URL', '');
  mocks.rpc.mockReset();
  mocks.from.mockReset();
  mocks.getUser.mockReset();
  mocks.featureEnabled = true;
  mocks.lifecycle = 'active';
});

describe('submission POST route', () => {
  it('rejects cross-origin writes before authentication or persistence', async () => {
    const response = await post(assignment, {
      origin: 'https://attacker.test',
    });
    expect(response.status).toBe(403);
    expect(mocks.getUser).not.toHaveBeenCalled();
  });

  it('requires sign-in, bounded source and active student course membership', async () => {
    mocks.getUser.mockResolvedValueOnce(context('student', null));
    expect((await post(assignment)).status).toBe(401);
    mocks.getUser.mockResolvedValueOnce(context('instructor'));
    expect((await post(assignment)).status).toBe(404);
    mocks.getUser.mockResolvedValueOnce(context('student'));
    expect((await post('not json')).status).toBe(400);
    mocks.getUser.mockResolvedValueOnce(context('student'));
    expect((await post({ ...assignment, source: '' })).status).toBe(400);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('passes validated source to the course-checked database RPC', async () => {
    mocks.getUser.mockResolvedValue(context('student'));
    mocks.rpc.mockResolvedValue({
      data: { id: 'revision-1', revision: 1 },
      error: null,
    });
    const response = await post(assignment);
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      submission: { id: 'revision-1', revision: 1 },
    });
    expect(mocks.rpc).toHaveBeenCalledWith('submit_code', {
      p_assignment_id: assignment.assignmentId,
      p_source: assignment.source,
      p_request_id: assignment.requestId,
    });
  });

  it('blocks archived and disabled assessment workspaces', async () => {
    mocks.getUser.mockResolvedValue(context('student'));
    mocks.lifecycle = 'archived';
    expect((await post(assignment)).status).toBe(404);
    mocks.lifecycle = 'active';
    mocks.featureEnabled = false;
    expect((await post(assignment)).status).toBe(404);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it.each([
    ['42501', 403, 'Submission is not allowed.'],
    ['P0002', 404, 'Assignment is unavailable.'],
    ['23505', 409, 'Submission retry conflicts with an earlier request.'],
    ['XX000', 400, 'Submission could not be saved.'],
  ])(
    'maps database code %s to a privacy-safe response',
    async (code, status, message) => {
      mocks.getUser.mockResolvedValue(context('student'));
      mocks.rpc.mockResolvedValue({ data: null, error: { code } });
      const response = await post(assignment);
      expect(response.status).toBe(status);
      expect((await response.json()).error.message).toBe(message);
    },
  );
});
