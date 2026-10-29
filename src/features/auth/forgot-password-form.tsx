'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { AuthCard } from './auth-form';

export function ForgotPasswordForm({
  invalidLink = false,
}: {
  invalidLink?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [retryIn, setRetryIn] = useState(0);
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (retryIn === 0) return;
    const timer = setTimeout(() => setRetryIn(retryIn - 1), 1000);
    return () => clearTimeout(timer);
  }, [retryIn]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || retryIn > 0) return;
    const email = String(
      new FormData(event.currentTarget).get('email') ?? '',
    ).trim();
    setBusy(true);
    setMessage('');
    try {
      const { error } =
        await createSupabaseBrowserClient().auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        });
      if (error?.status === 429) {
        setRetryIn(60);
        setMessage('Too many requests. Please wait before trying again.');
      } else if (error) throw error;
      else {
        setRetryIn(60);
        setMessage(
          'If an account exists for that email, you will receive a password reset link.',
        );
      }
    } catch {
      setMessage('Unable to send a reset link right now. Please try again.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthCard
      title="Forgot password"
      description="Enter your email and we’ll send you a reset link. Open it in this browser."
      busy={busy}
      disabled={retryIn > 0}
      submitLabel={retryIn ? `Send again in ${retryIn}s` : 'Send reset link'}
      message={message}
      onSubmit={submit}
    >
      {invalidLink && (
        <p role="alert" className="text-sm text-destructive">
          That reset link is invalid or has expired. Request a new one.
        </p>
      )}
      <label className="block space-y-2 text-sm">
        Email
        <input
          name="email"
          type="email"
          required
          maxLength={254}
          autoComplete="email"
          className="w-full rounded-md border bg-background px-3 py-2"
        />
      </label>
      <Link href="/sign-in" className="block text-sm underline">
        Back to sign in
      </Link>
    </AuthCard>
  );
}
