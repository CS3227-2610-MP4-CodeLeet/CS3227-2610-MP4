/* eslint-disable sonarjs/no-duplicate-string -- repeated role fixtures express course membership cases. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from './route';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  rpc: vi.fn(),
  courseRole: 'instructor' as string | null,
  lifecycle: 'active' as string,
  featureEnabled: true,
  assignments: [{ id: 'assignment-1', publication_status: 'published' }],
}));
vi.mock('@/lib/auth/verified-user', () => ({
  getVerifiedUserRole: mocks.getUser,
}));
const courseId = '00000000-0000-4000-8000-000000000001';
const assignment = {
  courseId,
  title: 'Largest number',
  instructions: 'Read values and print the largest.',
  language: 'python',
  publicationStatus: 'draft',
  rubric: [
    {
      id: '00000000-0000-4000-8000-000000000002',
      title: 'Correctness',
      description: 'Expected output',
      maxScore: 10,
    },
  ],
};
function configureContext(
  role: string | null = 'instructor',
  user: { id: string } | null = { id: 'user-1' },
) {
  mocks.courseRole = role;
  const queryFor = (table: string) => {
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      maybeSingle: vi.fn(async () => {
        if (table === 'course_memberships')
          return { data: role ? { role } : null, error: null };
        if (table === 'courses')
          return { data: { lifecycle: mocks.lifecycle }, error: null };
        if (table === 'course_features')
          return {
            data: { enabled: mocks.featureEnabled },
            error: null,
          };
        return { data: null, error: null };
      }),
      order: vi.fn(async () => ({ data: mocks.assignments, error: null })),
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
function request(body?: unknown, origin = 'http://localhost') {
  return new Request('http://localhost/api/assignments', {
    method: 'POST',
    headers: { origin, host: 'localhost', 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}
function getRequest(course = courseId) {
  return new NextRequest(`http://localhost/api/assignments?courseId=${course}`);
}
async function post(body: unknown, origin = 'http://localhost') {
  return POST(request(body, origin) as never);
}

beforeEach(() => {
  vi.stubEnv('APP_SITE_URL', '');
  mocks.getUser.mockReset();
  mocks.from.mockReset();
  mocks.rpc.mockReset();
  mocks.lifecycle = 'active';
  mocks.featureEnabled = true;
  mocks.assignments = [{ id: 'assignment-1', publication_status: 'published' }];
});

describe('course-scoped assignment collection', () => {
  it('requires a selected course and filters student reads to that course', async () => {
    mocks.getUser.mockResolvedValue(configureContext('student'));
    expect((await GET(getRequest() as never)).status).toBe(200);
    expect(mocks.from).toHaveBeenCalledWith('assignments');
    const query = mocks.from.mock.results.at(-1)?.value;
    expect(query.eq).toHaveBeenCalledWith('course_id', courseId);
    expect(query.eq).toHaveBeenCalledWith('publication_status', 'published');
    expect(
      (await GET(new NextRequest('http://localhost/api/assignments'))).status,
    ).toBe(404);
  });

  it('denies non-members and active courses with assessments disabled', async () => {
    mocks.getUser.mockResolvedValue(configureContext(null));
    expect((await GET(getRequest() as never)).status).toBe(404);
    mocks.getUser.mockResolvedValue(configureContext('instructor'));
    mocks.featureEnabled = false;
    expect((await GET(getRequest() as never)).status).toBe(404);
  });

  it('validates same-origin, course role and assignment data before saving', async () => {
    expect((await post(assignment, 'https://attacker.test')).status).toBe(403);
    mocks.getUser.mockResolvedValue(configureContext(null, null));
    expect((await post(assignment)).status).toBe(401);
    mocks.getUser.mockResolvedValue(configureContext('student'));
    expect((await post(assignment)).status).toBe(404);
    mocks.getUser.mockResolvedValue(configureContext('instructor'));
    expect((await post('invalid')).status).toBe(400);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('saves a validated assignment in the requested course', async () => {
    mocks.getUser.mockResolvedValue(configureContext('instructor'));
    mocks.rpc.mockResolvedValue({ data: { id: 'assignment-1' }, error: null });
    const response = await post(assignment);
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      assignment: { id: 'assignment-1' },
    });
    expect(mocks.rpc).toHaveBeenCalledWith(
      'save_course_assignment',
      expect.objectContaining({
        p_course_id: courseId,
        p_assignment_id: null,
        p_expected_version: 0,
        p_title: assignment.title,
        p_language: 'python',
      }),
    );
  });
});
