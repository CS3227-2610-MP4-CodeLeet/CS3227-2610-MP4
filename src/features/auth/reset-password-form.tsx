'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { AuthCard } from './auth-form';
import { PasswordField } from './password-field';
import { SignOutButton } from './sign-out-button';

async function finishRecovery() {
  try {
    const { error } = await createSupabaseBrowserClient().auth.signOut({
      scope: 'global',
    });
    return !error;
  } catch {
    return false;
  }
}

export function ResetPasswordForm() {
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);
  const [message, setMessage] = useState('');
  const [signedOut, setSignedOut] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') ?? '');
    if (password.length < 8) return setMessage('Use at least 8 characters.');
    if (password !== form.get('confirmPassword'))
      return setMessage('Passwords do not match.');
    setBusy(true);
    setMessage('');
    try {
      const { error } = await createSupabaseBrowserClient().auth.updateUser({
        password,
      });
      if (error) throw error;
      setSignedOut(await finishRecovery());
      setComplete(true);
    } catch {
      setMessage(
        'Unable to update your password. Try again or request a new reset link.',
      );
    } finally {
      setBusy(false);
    }
  }
  if (complete)
    return (
      <section className="w-full max-w-md space-y-5 rounded-xl border bg-card p-6">
        <h1 className="text-2xl font-semibold">Password updated</h1>
        <p role="status" className="text-sm text-muted-foreground">
          {signedOut
            ? 'Sign in with your new password.'
            : 'Your password was updated. Please sign out before signing in again.'}
        </p>
        {!signedOut && <SignOutButton />}
        <Link
          href="/sign-in"
          className="inline-block rounded-md bg-primary px-4 py-2 text-primary-foreground"
        >
          Sign in
        </Link>
      </section>
    );
  return (
    <AuthCard
      title="Set new password"
      description="Choose a new password with at least 8 characters."
      submitLabel="Update password"
      busy={busy}
      message={message}
      onSubmit={submit}
    >
      <PasswordField newPassword />
      <PasswordField confirmation newPassword />
      <Link href="/forgot-password" className="block text-sm underline">
        Request a new link
      </Link>
    </AuthCard>
  );
}
