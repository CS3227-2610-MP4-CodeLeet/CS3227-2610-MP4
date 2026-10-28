'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

const supabaseReady = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

function AccountFields({ displayName = false }: { displayName?: boolean }) {
  return (
    <>
      {displayName && (
        <label className="block space-y-2 text-sm">
          Display name
          <input
            name="displayName"
            required
            maxLength={80}
            autoComplete="name"
            className="w-full rounded-md border bg-background px-3 py-2"
          />
        </label>
      )}
      <label className="block space-y-2 text-sm">
        Email
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-md border bg-background px-3 py-2"
        />
      </label>
      <label className="block space-y-2 text-sm">
        Password
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete={displayName ? 'new-password' : 'current-password'}
          className="w-full rounded-md border bg-background px-3 py-2"
        />
      </label>
    </>
  );
}

function SignInForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    if (!supabaseReady) {
      setBusy(false);
      setMessage('Authentication is not configured for this environment.');
      return;
    }
    const form = new FormData(event.currentTarget);
    const { error } =
      await createSupabaseBrowserClient().auth.signInWithPassword({
        email: String(form.get('email') ?? '').trim(),
        password: String(form.get('password') ?? ''),
      });
    setBusy(false);
    if (error) {
      setMessage('Sign-in failed. Check your details and try again.');
      return;
    }
    router.replace('/');
    router.refresh();
  }
  return (
    <AuthCard
      title="Sign in"
      description="Use your CodeMentor account."
      busy={busy}
      message={message}
      onSubmit={submit}
    >
      <AccountFields />
      <p className="text-sm text-muted-foreground">
        New to CodeMentor?{' '}
        <Link className="underline" href="/sign-up">
          Create an account
        </Link>
      </p>
    </AuthCard>
  );
}

function SignUpForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    if (!supabaseReady) {
      setBusy(false);
      setMessage('Authentication is not configured for this environment.');
      return;
    }
    const form = new FormData(event.currentTarget);
    const { data, error } = await createSupabaseBrowserClient().auth.signUp({
      email: String(form.get('email') ?? '').trim(),
      password: String(form.get('password') ?? ''),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { display_name: String(form.get('displayName') ?? '').trim() },
      },
    });
    setBusy(false);
    if (error) {
      setMessage('Account creation failed. Check your details and try again.');
      return;
    }
    if (!data.session) {
      setMessage(
        'Check your email to confirm your account, then sign in. New accounts are students.',
      );
      return;
    }
    router.replace('/');
    router.refresh();
  }
  return (
    <AuthCard
      title="Create student account"
      description="Registration creates a student account."
      busy={busy}
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

function AuthCard({
  title,
  description,
  busy,
  message,
  onSubmit,
  children,
}: {
  title: string;
  description: string;
  busy: boolean;
  message: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
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
      <button
        disabled={busy || !supabaseReady}
        className="w-full rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-60"
      >
        {busy ? 'Please wait…' : title}
      </button>
      {!supabaseReady && (
        <p className="text-sm text-muted-foreground">
          Set the Supabase URL and publishable key to enable sign-in.
        </p>
      )}
    </form>
  );
}

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  return mode === 'sign-in' ? <SignInForm /> : <SignUpForm />;
}

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      className="text-sm underline"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await createSupabaseBrowserClient().auth.signOut();
        router.replace('/sign-in');
        router.refresh();
      }}
    >
      {busy ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
