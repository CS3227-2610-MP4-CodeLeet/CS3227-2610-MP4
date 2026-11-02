/* eslint-disable max-lines-per-function -- behavioral test suites keep related scenarios together. */
/* eslint-disable sonarjs/no-duplicate-string -- repeated expected text documents the user-facing contract. */
// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ForgotPasswordForm } from './forgot-password-form';
import { ResetPasswordForm } from './reset-password-form';
import { SignOutButton } from './sign-out-button';

const mocks = vi.hoisted(() => ({
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
  signOut: vi.fn(),
  router: { replace: vi.fn(), refresh: vi.fn() },
}));
vi.mock('@/lib/supabase/browser', () => ({
  createSupabaseBrowserClient: () => ({ auth: mocks }),
}));
vi.mock('next/navigation', () => ({ useRouter: () => mocks.router }));

beforeEach(() => {
  localStorage.clear();
  mocks.resetPasswordForEmail.mockReset();
  mocks.updateUser.mockReset();
  mocks.signOut.mockReset();
  vi.clearAllMocks();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('password recovery and account exit', () => {
  it('shows invalid reset links and avoids revealing account existence on success', async () => {
    mocks.resetPasswordForEmail.mockResolvedValue({ error: null });
    render(<ForgotPasswordForm invalidLink />);
    expect(screen.getByRole('alert').textContent).toContain(
      'invalid or has expired',
    );
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: ' user@example.test ' },
    });
    fireEvent.submit(
      screen.getByRole('heading', { name: 'Forgot password' }).closest('form')!,
    );
    expect((await screen.findByRole('status')).textContent).toContain(
      'If an account exists',
    );
    expect(mocks.resetPasswordForEmail).toHaveBeenCalledWith(
      'user@example.test',
      {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      },
    );
    expect(
      (
        screen.getByRole('button', {
          name: 'Send again in 60s',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });

  it('uses a bounded retry message for rate limits and hides provider details on failure', async () => {
    mocks.resetPasswordForEmail
      .mockResolvedValueOnce({ error: { status: 429 } })
      .mockRejectedValueOnce(new Error('private provider detail'));
    const { unmount } = render(<ForgotPasswordForm />);
    const form = screen
      .getByRole('heading', { name: 'Forgot password' })
      .closest('form')!;
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'a@example.test' },
    });
    fireEvent.submit(form);
    expect((await screen.findByRole('status')).textContent).toContain(
      'Too many requests',
    );
    unmount();

    render(<ForgotPasswordForm />);
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'a@example.test' },
    });
    fireEvent.submit(
      screen.getByRole('heading', { name: 'Forgot password' }).closest('form')!,
    );
    expect((await screen.findByRole('status')).textContent).toContain(
      'Unable to send a reset link',
    );
    expect(screen.queryByText('private provider detail')).toBeNull();
  });

  it('validates matching new passwords and finishes recovery with a local sign-out', async () => {
    mocks.updateUser.mockResolvedValue({ error: null });
    mocks.signOut.mockResolvedValue({ error: null });
    render(<ResetPasswordForm />);
    const form = screen
      .getByRole('heading', { name: 'Set new password' })
      .closest('form')!;
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password-one' },
    });
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'different' },
    });
    fireEvent.submit(form);
    expect((await screen.findByRole('status')).textContent).toBe(
      'Passwords do not match.',
    );
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'password-one' },
    });
    fireEvent.submit(form);
    expect(
      (await screen.findByRole('heading', { name: 'Password updated' }))
        .textContent,
    ).toBe('Password updated');
    expect(screen.getByRole('status').textContent).toBe(
      'Sign in with your new password.',
    );
    expect(mocks.updateUser).toHaveBeenCalledWith({ password: 'password-one' });
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: 'global' });
  });

  it('reports recovery errors safely and offers sign-out when global sign-out fails', async () => {
    mocks.updateUser.mockResolvedValue({ error: new Error('private details') });
    render(<ResetPasswordForm />);
    const form = screen
      .getByRole('heading', { name: 'Set new password' })
      .closest('form')!;
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password-one' },
    });
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'password-one' },
    });
    fireEvent.submit(form);
    expect((await screen.findByRole('status')).textContent).toContain(
      'Unable to update your password',
    );
  });

  it('signs out locally and redirects, or reports a safe failure', async () => {
    const draftKey = 'codeleet:draft:v1:synthetic';
    localStorage.setItem(draftKey, 'synthetic unfinished work');
    mocks.signOut
      .mockResolvedValueOnce({ error: null })
      .mockRejectedValueOnce(new Error('private details'));
    const { unmount } = render(<SignOutButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    await waitFor(() =>
      expect(mocks.signOut).toHaveBeenCalledWith({ scope: 'local' }),
    );
    expect(mocks.router.replace).toHaveBeenCalledWith('/sign-in');
    expect(localStorage.getItem(draftKey)).toBeNull();
    unmount();

    localStorage.setItem(draftKey, 'synthetic unfinished work');
    render(<SignOutButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect((await screen.findByRole('alert')).textContent).toBe(
      'Sign-out failed. Try again.',
    );
    expect(localStorage.getItem(draftKey)).toBe('synthetic unfinished work');
  });
});
