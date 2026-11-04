import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({ auth: vi.fn(), rpc: vi.fn() }));
vi.mock('@/lib/auth/verified-user', () => ({
  getVerifiedUserRole: mocks.auth,
}));
import { DELETE } from './route';

const courseId = '00000000-0000-4000-8000-000000000001';
const invitationId = '00000000-0000-4000-8000-000000000002';
const context = { params: Promise.resolve({ courseId, invitationId }) };
function request(origin = 'http://localhost:3000') {
  return new NextRequest(
    `http://localhost:3000/api/courses/${courseId}/invitations/${invitationId}`,
    { method: 'DELETE', headers: { origin } },
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({
    user: { id: '00000000-0000-4000-8000-000000000003' },
    role: 'instructor',
    supabase: { rpc: mocks.rpc },
  });
  mocks.rpc.mockResolvedValue({ error: null });
});

describe('course invitation revocation API', () => {
  it('revokes the requested pending invitation scoped to the course', async () => {
    const response = await DELETE(request(), context);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'revoked' });
    expect(mocks.rpc).toHaveBeenCalledWith('revoke_course_invitation', {
      p_invitation: invitationId,
      p_course: courseId,
    });
  });

  it('rejects cross-origin, malformed and signed-out requests', async () => {
    expect(
      (await DELETE(request('https://outside.test'), context)).status,
    ).toBe(403);
    expect(
      (
        await DELETE(request(), {
          params: Promise.resolve({ courseId, invitationId: 'invalid' }),
        })
      ).status,
    ).toBe(404);
    mocks.auth.mockResolvedValueOnce({
      user: null,
      supabase: null,
      role: null,
    });
    expect((await DELETE(request(), context)).status).toBe(401);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('returns a generic authorization error when revocation is denied', async () => {
    mocks.rpc.mockResolvedValueOnce({
      error: { code: '42501', message: 'private database detail' },
    });
    const response = await DELETE(request(), context);
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(JSON.stringify(body)).not.toContain('private database detail');
    expect(body).toMatchObject({
      error: {
        code: 'invitation_revoke_denied',
        message: 'Invitation could not be revoked.',
      },
    });
  });

  it('handles unexpected database failures with 503', async () => {
    mocks.rpc.mockRejectedValueOnce(new Error('connection failure'));
    const response = await DELETE(request(), context);
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      error: {
        code: 'invitation_revoke_failed',
        message: 'Invitation could not be revoked.',
      },
    });
  });
});
