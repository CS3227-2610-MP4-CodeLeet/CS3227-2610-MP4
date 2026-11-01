import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from './route';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  rpc: vi.fn(),
}));
vi.mock('@/lib/auth/verified-user', () => ({
  getVerifiedUserRole: mocks.getUser,
}));
const assignment = {
  title: 'Largest number',
  instructions: 'Read values and print the largest.',
  language: 'python',
  publicationStatus: 'draft',
  rubric: [
    {
      id: '00000000-0000-4000-8000-000000000001',
      title: 'Correctness',
      description: 'Expected output',
      maxScore: 10,
    },
  ],
};
function context(
  role: string | null,
  user: { id: string } | null = { id: 'user-1' },
  data: unknown = [],
  error: unknown = null,
) {
  const query = {
    select: vi.fn(function (this: unknown) {
      return this;
    }),
    eq: vi.fn(function (this: unknown) {
      return this;
    }),
    order: vi.fn().mockResolvedValue({ data, error }),
  };
  mocks.from.mockReturnValue(query);
  return { user, role, supabase: { from: mocks.from, rpc: mocks.rpc } };
}
function request(body?: unknown, origin = 'http://localhost') {
  return new Request('http://localhost/api/assignments', {
    method: 'POST',
    headers: { origin, host: 'localhost', 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}
function post(body: unknown, origin = 'http://localhost'): Promise<Response> {
  return POST(request(body, origin) as never) as Promise<Response>;
}

beforeEach(() => {
  vi.stubEnv('APP_SITE_URL', '');
  mocks.getUser.mockReset();
  mocks.from.mockReset();
  mocks.rpc.mockReset();
});

describe('assignment collection route', () => {
  it('requires an authenticated role and restricts student reads to published assignments', async () => {
    mocks.getUser.mockResolvedValueOnce(context(null, null));
    expect((await GET()).status).toBe(401);
    const student = context('student', { id: 'student' }, [
      { id: 'published' },
    ]);
    mocks.getUser.mockResolvedValueOnce(student);
    expect(await (await GET()).json()).toEqual({
      assignments: [{ id: 'published' }],
    });
    expect(mocks.from().eq).toHaveBeenCalledWith(
      'publication_status',
      'published',
    );
  });

  it('returns a safe read failure and leaves instructor visibility unrestricted', async () => {
    mocks.getUser.mockResolvedValueOnce(
      context('instructor', { id: 'teacher' }, null, { message: 'private' }),
    );
    expect((await GET()).status).toBe(500);
    mocks.getUser.mockResolvedValueOnce(
      context('instructor', { id: 'teacher' }, [
        { publication_status: 'draft' },
      ]),
    );
    expect(await (await GET()).json()).toEqual({
      assignments: [{ publication_status: 'draft' }],
    });
  });

  it('rejects origin, role, body, and assignment validation failures before persistence', async () => {
    expect((await post(assignment, 'https://attacker.test')).status).toBe(403);
    mocks.getUser.mockResolvedValueOnce(context(null, null));
    expect((await post(assignment)).status).toBe(401);
    mocks.getUser.mockResolvedValueOnce(context('student', { id: 'student' }));
    expect((await post(assignment)).status).toBe(403);
    mocks.getUser.mockResolvedValueOnce(context('instructor'));
    expect((await post('invalid')).status).toBe(400);
    mocks.getUser.mockResolvedValueOnce(context('instructor'));
    expect((await post({ ...assignment, title: '' })).status).toBe(400);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('saves a validated assignment and maps private persistence failures', async () => {
    mocks.getUser.mockResolvedValue(context('admin'));
    mocks.rpc.mockResolvedValueOnce({
      data: { id: 'assignment-1' },
      error: null,
    });
    const response = await post(assignment);
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      assignment: { id: 'assignment-1' },
    });
    expect(mocks.rpc).toHaveBeenCalledWith(
      'save_assignment',
      expect.objectContaining({
        p_assignment_id: null,
        p_expected_version: 0,
        p_title: assignment.title,
        p_language: 'python',
      }),
    );
    mocks.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'private' },
    });
    expect((await post(assignment)).status).toBe(400);
  });
});
