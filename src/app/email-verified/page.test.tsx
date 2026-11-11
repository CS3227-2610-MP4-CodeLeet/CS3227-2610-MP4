import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  verified: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));
vi.mock('@/lib/auth/verified-user', () => ({
  getVerifiedUserRole: mocks.verified,
}));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));

import EmailVerifiedPage from './page';

const confirmedAt = '2026-11-10T00:00:00Z';
const userId = 'synthetic-id';
beforeEach(() => {
  vi.clearAllMocks();
  mocks.verified.mockResolvedValue({
    user: { id: userId, email_confirmed_at: confirmedAt },
    role: 'student',
  });
});

it('shows verified status and a course link to a confirmed member', async () => {
  const html = renderToStaticMarkup(await EmailVerifiedPage());
  expect(html).toContain('Email verified');
  expect(html).toContain('href="/courses"');
  expect(html).not.toContain(userId);
});

it('explains when an email is verified but the account role needs help', async () => {
  mocks.verified.mockResolvedValue({
    user: { id: userId, email_confirmed_at: confirmedAt },
    role: null,
  });
  const html = renderToStaticMarkup(await EmailVerifiedPage());
  expect(html).toContain('Email verified');
  expect(html).toContain('administrator');
  expect(html).not.toContain('href="/courses"');
});

it.each([
  { user: null, role: null },
  { user: { id: userId, email_confirmed_at: null }, role: 'student' },
])(
  'does not show success without a confirmed server identity',
  async (state) => {
    mocks.verified.mockResolvedValue(state);
    await expect(EmailVerifiedPage()).rejects.toThrow('NEXT_REDIRECT:/sign-in');
  },
);
