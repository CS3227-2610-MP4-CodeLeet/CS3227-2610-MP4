import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';

vi.mock('@/features/auth/auth-form', () => ({
  AuthForm: () => <div>Sign in form</div>,
}));
vi.mock('@/features/auth/auth-page-shell', () => ({
  AuthPageShell: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

import SignInPage from './page';

it('explains an invalid or expired confirmation link and offers a new signup', async () => {
  const html = renderToStaticMarkup(
    await SignInPage({ searchParams: Promise.resolve({ confirmed: 'error' }) }),
  );
  expect(html).toContain('verification link');
  expect(html).toContain('href="/sign-up"');
  expect(html).not.toContain('provider');
});

it('does not show a confirmation error without the bounded marker', async () => {
  const html = renderToStaticMarkup(
    await SignInPage({
      searchParams: Promise.resolve({ confirmed: 'success' }),
    }),
  );
  expect(html).not.toContain('verification link');
});
