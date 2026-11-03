'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { PendingButton } from '@/components/ui/pending-button';
import { usePendingNavigation } from './pending-navigation';
import { SlowRequestNotice } from './slow-request-notice';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { PasswordField } from './password-field';
import { claimableUsername } from '@/features/profile/contracts';
import { synchronizeSession } from './synchronize-session';
export { SignOutButton } from './sign-out-button';

const supabaseReady = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

function AccountFields({ displayName = false }: { displayName?: boolean }) {
  return (
    <>
      {displayName && (
        <label className="block space-y-2 text-sm">
          Username
          <input
            name="username"
            required
            maxLength={80}
            autoComplete="username"
            className="w-full rounded-md border bg-background px-3 py-2"
          />
        </label>
      )}
      <label className="block space-y-2 text-sm">
        {displayName ? 'Email' : 'Email or username'}
        <input
          name={displayName ? 'email' : 'identifier'}
          type={displayName ? 'email' : 'text'}
          required
          maxLength={254}
          autoComplete={displayName ? 'email' : 'username'}
          className="w-full rounded-md border bg-background px-3 py-2"
        />
      </label>
      <PasswordField newPassword={displayName} />
      {displayName && <PasswordField confirmation newPassword />}
    </>
  );
}

function SignInForm() {
  const { navigating, navigate } = usePendingNavigation();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || navigating) return;
    setBusy(true);
    setMessage('');
    if (!supabaseReady) {
      setBusy(false);
      setMessage('Account access is unavailable. Please try again later.');
      return;
    }
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/auth/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: String(form.get('identifier') ?? '').trim(),
          password: String(form.get('password') ?? ''),
        }),
      });
      if (!response.ok) return setMessage(signInFailure(response.status));
      const result = await response.json();
      if (result?.ok !== true) throw new Error('Invalid sign-in response');
      await synchronizeSession();
      navigate('/');
    } catch {
      setMessage('Sign-in is unavailable. Please try again later.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthCard
      title="Sign in"
      description="Use your CodeLeet account."
      busy={busy || navigating}
      pendingLabel="Signing in…"
      message={message}
      onSubmit={submit}
    >
      <AccountFields />
      <p className="text-sm">
        <Link href="/forgot-password" className="underline">
          Forgot password?
        </Link>
      </p>
      <p className="text-sm text-muted-foreground">
        New to CodeLeet?{' '}
        <Link className="underline" href="/sign-up">
          Create an account
        </Link>
      </p>
    </AuthCard>
  );
}

function SignUpForm() {
  const { navigating, navigate } = usePendingNavigation();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || navigating) return;
    const form = new FormData(event.currentTarget);
    const validationError = getSignupError(form);
    if (validationError) return setMessage(validationError);
    setBusy(true);
    setMessage('');
    try {
      const { data, error } = await createSupabaseBrowserClient().auth.signUp({
        email: String(form.get('email') ?? '').trim(),
        password: String(form.get('password') ?? ''),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { display_name: String(form.get('username') ?? '').trim() },
        },
      });
      if (error) throw error;
      if (!data.session) {
        setMessage(
          'Check your email to confirm your account, then sign in. New accounts are students.',
        );
        return;
      }
      navigate('/');
    } catch {
      setMessage(
        'Account creation failed. Try a different username or check your details.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthCard
      title="Create student account"
      description="Registration creates a student account."
      busy={busy || navigating}
      pendingLabel="Creating account…"
      message={message}
      onSubmit={submit}
    >
      <AccountFields displayName />
      <p className="text-sm text-muted-foreground">
        Already registered?{' '}
        <Link className="underline" href="/sign-in">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}

function getSignupError(form: FormData) {
  if (!supabaseReady)
    return 'Account access is unavailable. Please try again later.';
  if (!claimableUsername.safeParse(String(form.get('username') ?? '')).success)
    return 'Enter a username of 1–80 characters without @ or line breaks.';
  return form.get('password') !== form.get('confirmPassword')
    ? 'Passwords do not match.'
    : '';
}

function signInFailure(status: number) {
  if (status === 429)
    return 'Too many attempts. Please wait a minute and try again.';
  if (status >= 500) return 'Sign-in is unavailable. Please try again later.';
  return 'Sign-in failed. Check your details and try again.';
}

export function AuthCard({
  title,
  description,
  busy,
  message,
  onSubmit,
  children,
  submitLabel = title,
  disabled = false,
  pendingLabel = 'Please wait…',
}: {
  title: string;
  description: string;
  busy: boolean;
  message: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
  submitLabel?: string;
  disabled?: boolean;
  pendingLabel?: string;
}) {
  return (
    <form
      className="w-full max-w-md space-y-5 rounded-xl border bg-card p-6"
      onSubmit={onSubmit}
    >
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
      {message && (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      )}
      <PendingButton
        pending={busy}
        pendingLabel={pendingLabel}
        disabled={busy || !supabaseReady || disabled}
        className="w-full rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-60"
      >
        {submitLabel}
      </PendingButton>
      {busy && <SlowRequestNotice />}
      {!supabaseReady && (
        <p className="text-sm text-muted-foreground">
          Account access is unavailable. Please try again later.
        </p>
      )}
    </form>
  );
}

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  return mode === 'sign-in' ? <SignInForm /> : <SignUpForm />;
}
