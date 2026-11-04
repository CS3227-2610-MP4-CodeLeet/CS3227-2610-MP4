import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  rpc: vi.fn(),
  signInWithOtp: vi.fn(),
}));
vi.mock('@/lib/auth/verified-user', () => ({
  getVerifiedUserRole: mocks.auth,
}));
vi.mock('@/lib/supabase/invite-mailer', () => ({
  createInviteAuthClient: () => ({
    auth: { signInWithOtp: mocks.signInWithOtp },
  }),
}));
import { POST } from './route';
const courseId = '00000000-0000-4000-8000-000000000002';
const userId = '00000000-0000-4000-8000-000000000001';
const studentEmail = 'student@example.test';
const invitationId = '00000000-0000-4000-8000-000000000003';
const studentRole = 'student' as const;
const smtpDetail = 'private SMTP detail';
function request(body: unknown, origin = 'http://localhost:3000') {
  return new NextRequest(
    `http://localhost:3000/api/courses/${courseId}/members`,
    {
      method: 'POST',
      headers: { origin, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
}
function post(body: unknown, origin?: string) {
  return POST(request(body, origin), {
    params: Promise.resolve({ courseId }),
  }) as Promise<Response>;
}
beforeEach(() => {
  vi.stubEnv('APP_SITE_URL', 'http://localhost:3000');
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({
    user: { id: userId, email_confirmed_at: '2026-01-01T00:00:00Z' },
    role: 'instructor',
    supabase: { rpc: mocks.rpc },
  });
  mocks.rpc.mockResolvedValue({ data: invitationId, error: null });
  mocks.signInWithOtp.mockResolvedValue({ error: null });
});

describe('course email invitation validation', () => {
  it('rejects cross-origin and invalid requests before sending mail', async () => {
    expect(
      (
        await post(
          { email: studentEmail, role: studentRole },
          'https://attacker.test',
        )
      ).status,
    ).toBe(403);
    expect(
      (await post({ email: 'not-an-email', role: studentRole })).status,
    ).toBe(400);
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.signInWithOtp).not.toHaveBeenCalled();
  });

  it('requires a trusted configured application URL before creating an invitation', async () => {
    vi.stubEnv('APP_SITE_URL', '');
    expect(
      (await post({ email: studentEmail, role: studentRole })).status,
    ).toBe(503);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});

describe('course email invitation delivery', () => {
  it('sends a role-limited, expiring invite using an opaque verified sign-in callback token', async () => {
    const response = await post({
      email: ' Student@Example.Test ',
      role: studentRole,
    });
    expect(response.status).toBe(202);
    const result = await response.json();
    expect(result).toEqual({ status: 'sent' });
    const [rpcName, invite] = mocks.rpc.mock.calls[0]!;
    expect(rpcName).toBe('create_course_invitation');
    expect(invite).toMatchObject({
      p_course: courseId,
      p_email: studentEmail,
      p_role: studentRole,
    });
    expect(invite.p_token).toMatch(/^[A-Za-z0-9_-]{40,128}$/);
    const expiresAt = Date.parse(invite.p_expires_at);
    expect(expiresAt).toBeGreaterThan(Date.now() + 6 * 24 * 60 * 60 * 1000);
    expect(expiresAt).toBeLessThan(Date.now() + 8 * 24 * 60 * 60 * 1000);
    const delivery = mocks.signInWithOtp.mock.calls[0]![0];
    expect(delivery.email).toBe(studentEmail);
    expect(delivery.options.shouldCreateUser).toBe(true);
    const redirect = new URL(delivery.options.emailRedirectTo);
    expect(redirect.pathname).toBe('/auth/course-invite');
    expect(redirect.searchParams.get('course_invite')).toBe(invite.p_token);
    expect(JSON.stringify(result)).not.toContain(invite.p_token);
  });

  it.each(['return', 'throw'])(
    'revokes the invitation when the mail transport %s a failure',
    async (failureMode) => {
      if (failureMode === 'throw')
        mocks.signInWithOtp.mockRejectedValueOnce(new Error(smtpDetail));
      else
        mocks.signInWithOtp.mockResolvedValueOnce({
          error: new Error(smtpDetail),
        });
      const response = await post({ email: studentEmail, role: studentRole });
      expect(response.status).toBe(503);
      expect(await response.text()).not.toContain(smtpDetail);
      expect(mocks.rpc).toHaveBeenLastCalledWith('revoke_course_invitation', {
        p_invitation: invitationId,
      });
    },
  );
});
