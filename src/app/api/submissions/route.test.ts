import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), rpc: vi.fn() }));
vi.mock('@/lib/auth/verified-user', () => ({
  getVerifiedUserRole: mocks.getUser,
}));

const submission = {
  assignmentId: '00000000-0000-4000-8000-000000000001',
  source: 'print(1)',
  requestId: '00000000-0000-4000-8000-000000000002',
};
function request(body: unknown, headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/submissions', {
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
function context(
  role: string | null,
  user: { id: string } | null = { id: 'student' },
) {
  return { supabase: { rpc: mocks.rpc }, user, role };
}
function post(
  body: unknown,
  headers: Record<string, string> = {},
): Promise<Response> {
  return POST(request(body, headers) as never) as Promise<Response>;
}

beforeEach(() => {
  vi.stubEnv('APP_SITE_URL', '');
  mocks.rpc.mockReset();
  mocks.getUser.mockReset();
});

describe('submission POST route', () => {
  it('rejects cross-origin writes before authentication or persistence', async () => {
    const response = await post(submission, {
      origin: 'https://attacker.test',
    });
    expect(response.status).toBe(403);
    expect(mocks.getUser).not.toHaveBeenCalled();
  });

  it('requires a verified student and bounded valid JSON', async () => {
    mocks.getUser.mockResolvedValueOnce(context(null, null));
    expect((await post(submission)).status).toBe(401);
    mocks.getUser.mockResolvedValueOnce(context('instructor'));
    expect((await post(submission)).status).toBe(403);
    mocks.getUser.mockResolvedValueOnce(context('student'));
    expect((await post('not json')).status).toBe(400);
    mocks.getUser.mockResolvedValueOnce(context('student'));
    const invalid = await post({ ...submission, source: '' });
    expect(invalid.status).toBe(400);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('passes only validated fields to the database and returns the saved revision', async () => {
    mocks.getUser.mockResolvedValue(context('student'));
    mocks.rpc.mockResolvedValue({
      data: { id: 'revision-1', revision: 1 },
      error: null,
    });
    const response = await post(submission);
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      submission: { id: 'revision-1', revision: 1 },
    });
    expect(mocks.rpc).toHaveBeenCalledWith('submit_code', {
      p_assignment_id: submission.assignmentId,
      p_source: submission.source,
      p_request_id: submission.requestId,
    });
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
      const response = await post(submission);
      expect(response.status).toBe(status);
      expect((await response.json()).error.message).toBe(message);
    },
  );
});
