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
import { GET, POST } from './route';

const userId = '00000000-0000-4000-8000-000000000001';
const courseId = '00000000-0000-4000-8000-000000000002';
function getCourses(): Promise<Response> {
  return GET() as Promise<Response>;
}
function postCourse(req: NextRequest): Promise<Response> {
  return POST(req) as Promise<Response>;
}
function request(body?: unknown, origin = 'http://localhost:3000') {
  return new NextRequest('http://localhost:3000/api/courses', {
    method: 'POST',
    headers: { origin, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}
function setup(role: string | null = 'instructor') {
  const query = {
    select: vi.fn(function (this: unknown) {
      return this;
    }),
    order: vi.fn().mockResolvedValue({ data: [{ id: courseId }], error: null }),
  };
  mocks.from.mockReturnValue(query);
  mocks.auth.mockResolvedValue({
    user: { id: userId },
    role,
    supabase: { from: mocks.from, rpc: mocks.rpc },
  });
  return query;
}

beforeEach(() => {
  vi.stubEnv('APP_SITE_URL', 'http://localhost:3000');
  vi.clearAllMocks();
  setup();
});

describe('course collection API', () => {
  it('lists only courses visible through the caller membership and returns private JSON', async () => {
    const response = await getCourses();
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(await response.json()).toEqual({ courses: [{ id: courseId }] });
    expect(mocks.from).toHaveBeenCalledWith('courses');
  });

  it('requires an authenticated application account', async () => {
    mocks.auth.mockResolvedValueOnce({
      user: null,
      role: null,
      supabase: null,
    });
    expect((await getCourses()).status).toBe(401);
    mocks.auth.mockResolvedValueOnce({
      user: { id: userId },
      role: null,
      supabase: { rpc: mocks.rpc },
    });
    expect((await getCourses()).status).toBe(403);
  });

  it('checks origin, role and bounded validated input before creating a course', async () => {
    expect(
      (await postCourse(request({ title: 'Biology' }, 'https://other.test')))
        .status,
    ).toBe(403);
    mocks.auth.mockResolvedValueOnce({
      user: { id: userId },
      role: null,
      supabase: { rpc: mocks.rpc },
    });
    expect((await postCourse(request({ title: 'Biology' }))).status).toBe(403);
    setup();
    expect(
      (await postCourse(request({ title: ' ', description: '' }))).status,
    ).toBe(400);
    expect((await postCourse(request({ title: 'B'.repeat(121) }))).status).toBe(
      400,
    );
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('creates through the authorization RPC and returns only the new course id', async () => {
    mocks.rpc.mockResolvedValueOnce({ data: courseId, error: null });
    const response = await postCourse(
      request({ title: '  Biology  ', description: 'Year 2' }),
    );
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ courseId });
    expect(mocks.rpc).toHaveBeenCalledWith('create_course', {
      p_title: 'Biology',
      p_description: 'Year 2',
    });
  });
});
