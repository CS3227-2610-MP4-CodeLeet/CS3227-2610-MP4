'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function signOut() {
    setBusy(true);
    setError('');
    try {
      const result = await createSupabaseBrowserClient().auth.signOut({
        scope: 'local',
      });
      if (result.error) throw result.error;
      router.replace('/sign-in');
      router.refresh();
    } catch {
      setError('Sign-out failed. Try again.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="text-sm">
      <button
        type="button"
        disabled={busy}
        onClick={() => void signOut()}
        className="rounded-md border bg-background px-3 py-2 text-foreground hover:bg-accent disabled:opacity-60"
      >
        {busy ? 'Signing out…' : 'Sign out'}
      </button>
      {error && (
        <p role="alert" className="mt-1 text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
