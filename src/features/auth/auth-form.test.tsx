/* eslint-disable sonarjs/no-duplicate-string -- repeated expected text documents the user-facing contract. */
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));
import { AuthForm } from './auth-form';
import { PasswordField } from './password-field';
import { ResetPasswordForm } from './reset-password-form';

afterEach(() => cleanup());

describe('account form behavior', () => {
  it('shows the mode-specific account fields and navigation', () => {
    const { rerender } = render(<AuthForm mode="sign-in" />);
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeTruthy();
    expect(screen.getByLabelText('Email or username')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Forgot password?' })).toBeTruthy();
    expect(screen.queryByLabelText('Username')).toBeNull();

    rerender(<AuthForm mode="sign-up" />);
    expect(
      screen.getByRole('heading', { name: 'Create student account' }),
    ).toBeTruthy();
    expect(screen.getByLabelText('Username')).toBeTruthy();
    expect(screen.getByLabelText('Confirm password')).toBeTruthy();
    expect(
      screen.getByText('Registration creates a student account.'),
    ).toBeTruthy();
  });

  it('toggles each password field without changing its accessible control', () => {
    render(
      <>
        <PasswordField />
        <PasswordField confirmation newPassword />
      </>,
    );
    const password = screen.getByLabelText('Password') as HTMLInputElement;
    expect(password.type).toBe('password');
    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(password.type).toBe('text');
    expect(
      screen
        .getByRole('button', { name: 'Hide password' })
        .getAttribute('aria-pressed'),
    ).toBe('true');

    const confirmation = screen.getByLabelText(
      'Confirm password',
    ) as HTMLInputElement;
    fireEvent.click(
      screen.getByRole('button', { name: 'Show confirm password' }),
    );
    expect(confirmation.type).toBe('text');
  });

  it('validates short recovery passwords before calling the account service', async () => {
    render(<ResetPasswordForm />);
    const form = screen
      .getByRole('heading', { name: 'Set new password' })
      .closest('form')!;
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'short' },
    });
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'short' },
    });
    fireEvent.submit(form);
    expect(await screen.findByRole('status')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe(
      'Use at least 8 characters.',
    );
  });
});
