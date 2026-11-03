import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  courseRole: 'student' as string | null,
  featureEnabled: true,
  lifecycle: 'active' as string,
  submission: null as unknown,
  error: null as unknown,
}));
vi.mock('@/lib/auth/verified-user', () => ({
  getVerifiedUserRole: mocks.getUser,
}));
const id = '00000000-0000-4000-8000-000000000001';
const courseId = '00000000-0000-4000-8000-000000000010';
const row = {
  id,
  assignment_id: 'assignment-1',
  student_id: 'owner',
  source: 'print(1)',
  assignments: {
    course_id: courseId,
    title: 'Loop',
    instructions: 'Print',
    language: 'python',
  },
};
function setup({
  role = 'student',
  userId = 'owner',
  data = row,
  error = null,
}: {
  role?: string | null;
  userId?: string;
  data?: unknown;
  error?: unknown;
} = {}) {
  mocks.courseRole = role;
  mocks.submission = data;
  mocks.error = error;
  const queryFor = (table: string) => {
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      maybeSingle: vi.fn(async () => {
        if (table === 'submissions')
          return { data: mocks.submission, error: mocks.error };
        if (table === 'course_memberships')
          return {
            data: mocks.courseRole ? { role: mocks.courseRole } : null,
            error: null,
          };
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
  mocks.getUser.mockResolvedValue({
    user: { id: userId },
    role: 'student',
    supabase: { from: mocks.from },
  });
}
const get = (submissionId: string) =>
  GET(new NextRequest('http://localhost'), {
    params: Promise.resolve({ id: submissionId }),
  });
beforeEach(() => {
  mocks.getUser.mockReset();
  mocks.from.mockReset();
  mocks.featureEnabled = true;
  mocks.lifecycle = 'active';
});

describe('submission detail route', () => {
  it('requires a verified identity and hides malformed or missing submissions', async () => {
    mocks.getUser.mockResolvedValue({ user: null, role: null, supabase: null });
    expect((await get(id)).status).toBe(401);
    setup({ data: null });
    expect((await get('invalid')).status).toBe(404);
    expect(mocks.from).not.toHaveBeenCalled();
    expect((await get(id)).status).toBe(404);
  });

  it('keeps non-member students private while allowing own students and course instructors', async () => {
    setup({ role: null, userId: 'other' });
    expect((await get(id)).status).toBe(404);
    setup({ role: 'student', userId: 'owner' });
    expect(await (await get(id)).json()).toEqual({ submission: row });
    setup({ role: 'instructor', userId: 'teacher' });
    expect((await get(id)).status).toBe(200);
  });

  it('maps database errors to the same not-found response', async () => {
    setup({ data: null, error: new Error('private database details') });
    const response = await get(id);
    expect(response.status).toBe(404);
    expect((await response.json()).error.message).toBe('Submission not found.');
  });
});
