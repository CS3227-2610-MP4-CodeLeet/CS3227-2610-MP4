// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  getSession: vi.fn(),
  createClient: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));
vi.mock('@/lib/supabase/invite-browser', () => ({
  createInviteBrowserClient: mocks.createClient,
}));
import { CourseInviteCallback } from './callback';

const inviteToken = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN';
const courseId = '00000000-0000-4000-8000-000000000002';
const session = {
  user: { email_confirmed_at: '2026-01-01T00:00:00Z' },
  access_token: 'synthetic-access-token-value-123456789',
  refresh_token: 'synthetic-refresh-token-value-123456789',
};

beforeEach(() => {
  vi.clearAllMocks();
  history.replaceState(
    {},
    '',
    `/auth/course-invite?course_invite=${inviteToken}`,
  );
  mocks.createClient.mockReturnValue({
    auth: { getSession: mocks.getSession },
  });
  mocks.getSession.mockResolvedValue({ data: { session }, error: null });
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({ courseId }) }),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('course invitation browser callback', () => {
  it('posts the verified ephemeral session to the same-origin acceptance API and navigates to the course', async () => {
    render(<CourseInviteCallback />);
    await waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledWith(`/courses/${courseId}`),
    );
    expect(fetch).toHaveBeenCalledWith(
      '/api/courses/invitations/accept',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          token: inviteToken,
          accessToken: session.access_token,
          refreshToken: session.refresh_token,
        }),
      }),
    );
    expect(screen.getByText(/verifying your email/i)).toBeTruthy();
  });

  it('does not initialize Auth for malformed tokens and gives a generic recovery message', async () => {
    history.replaceState({}, '', '/auth/course-invite?course_invite=bad');
    render(<CourseInviteCallback />);
    expect(
      await screen.findByText(/ask the instructor for a new invitation/i),
    ).toBeTruthy();
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('does not send an unverified or missing session to the acceptance API', async () => {
    mocks.getSession.mockResolvedValue({
      data: { session: { ...session, user: {} } },
      error: null,
    });
    render(<CourseInviteCallback />);
    expect(
      await screen.findByText(/ask the instructor for a new invitation/i),
    ).toBeTruthy();
    expect(fetch).not.toHaveBeenCalled();
  });
});
