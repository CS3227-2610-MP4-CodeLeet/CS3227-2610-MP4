import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  from: vi.fn(),
  rpc: vi.fn(),
}));
vi.mock('@/lib/auth/verified-user', () => ({
  getVerifiedUserRole: mocks.auth,
}));
import { DELETE, GET, PATCH } from './route';
const courseId = '00000000-0000-4000-8000-000000000002';
const params = { params: Promise.resolve({ courseId }) };
function makeQuery(result: unknown) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    maybeSingle: vi.fn(async () => result),
    then: (resolve: (value: unknown) => unknown) =>
      Promise.resolve(result).then(resolve),
  };
  return query;
}
function getCourse(course = courseId): Promise<Response> {
  return GET(new NextRequest(`http://localhost:3000/api/courses/${course}`), {
    params: Promise.resolve({ courseId: course }),
  }) as Promise<Response>;
}
function request(method: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost:3000/api/courses/${courseId}`, {
    method,
    headers: {
      origin: 'http://localhost:3000',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}
function updateCourse(body: unknown): Promise<Response> {
  return PATCH(request('PATCH', body), params) as Promise<Response>;
}
function lifecycle(body: unknown): Promise<Response> {
  return DELETE(request('DELETE', body), params) as Promise<Response>;
}
beforeEach(() => {
  vi.stubEnv('APP_SITE_URL', 'http://localhost:3000');
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({
    user: { id: '00000000-0000-4000-8000-000000000001' },
    role: 'instructor',
    supabase: { from: mocks.from, rpc: mocks.rpc },
  });
  mocks.from.mockImplementation((table: string) => {
    const result =
      table === 'courses'
        ? { data: { id: courseId, title: 'Algorithms' }, error: null }
        : table === 'course_memberships'
          ? { data: { role: 'instructor' }, error: null }
          : { data: [{ feature: 'assessments', enabled: true }], error: null };
    return makeQuery(result);
  });
  mocks.rpc.mockResolvedValue({
    data: { id: courseId, title: 'New title' },
    error: null,
  });
});
describe('course settings and lifecycle API', () => {
  it('updates validated fields through the membership-checked RPC', async () => {
    const response = await updateCourse({ title: 'New title' });
    expect(response.status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith('update_course', {
      p_course: courseId,
      p_title: 'New title',
      p_description: null,
    });
    expect((await updateCourse({ owner_id: 'forged' })).status).toBe(400);
  });
  it('requires explicit confirmation for archive and empty-only deletion actions', async () => {
    expect((await lifecycle({ action: 'archive' })).status).toBe(400);
    const archived = await lifecycle({ action: 'archive', confirm: true });
    expect(archived.status).toBe(200);
    expect(mocks.rpc).toHaveBeenLastCalledWith('archive_course', {
      p_course: courseId,
    });
    const deleted = await lifecycle({ action: 'delete-empty', confirm: true });
    expect(deleted.status).toBe(200);
    expect(mocks.rpc).toHaveBeenLastCalledWith('delete_empty_course', {
      p_course: courseId,
      p_confirm: true,
    });
  });
  it('maps empty-course denial without exposing provider detail', async () => {
    mocks.rpc.mockResolvedValueOnce({
      error: { code: '23514', message: 'PRIVATE_DETAIL' },
    });
    const response = await lifecycle({ action: 'delete-empty', confirm: true });
    expect(response.status).toBe(409);
    expect(await response.text()).not.toContain('PRIVATE_DETAIL');
  });

  it('returns course details and features only to a current course member', async () => {
    const response = await getCourse();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      course: { id: courseId, title: 'Algorithms' },
      role: 'instructor',
      features: [{ feature: 'assessments', enabled: true }],
    });
    expect(mocks.from).toHaveBeenCalledWith('course_memberships');
  });

  it('hides missing memberships and fails closed when course data fails', async () => {
    mocks.from.mockImplementation((table: string) => {
      const result =
        table === 'courses'
          ? { data: { id: courseId }, error: null }
          : table === 'course_memberships'
            ? { data: null, error: null }
            : { data: [], error: null };
      return makeQuery(result);
    });
    expect((await getCourse()).status).toBe(404);
    expect((await getCourse('invalid')).status).toBe(404);
    mocks.from.mockImplementation(() => {
      const result = { data: null, error: new Error('private') };
      return makeQuery(result);
    });
    expect((await getCourse()).status).toBe(503);
  });
});
