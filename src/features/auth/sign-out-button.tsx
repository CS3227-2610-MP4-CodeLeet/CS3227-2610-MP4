'use client';

import { useState } from 'react';
import { PendingButton } from '@/components/ui/pending-button';
import { usePendingNavigation } from './pending-navigation';
import { SlowRequestNotice } from './slow-request-notice';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { confirmUnsavedNavigation } from '@/features/student-submissions/unsaved-code-guard';
import { clearBrowserDrafts } from '@/features/student-submissions/draft-storage';

export function SignOutButton() {
  const { navigating, navigate } = usePendingNavigation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function signOut() {
    if (busy || navigating) return;
    if (!confirmUnsavedNavigation()) return;
    setBusy(true);
    setError('');
    try {
      const result = await createSupabaseBrowserClient().auth.signOut({
        scope: 'local',
      });
      if (result.error) throw result.error;
      await clearBrowserDrafts();
      navigate('/sign-in');
    } catch {
      setError('Sign-out failed. Try again.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="text-sm">
      <PendingButton
        pending={busy || navigating}
        pendingLabel="Signing out…"
        type="button"
        disabled={busy}
        onClick={() => void signOut()}
        className="rounded-md border bg-background px-3 py-2 text-foreground hover:bg-accent disabled:opacity-60"
      >
        Sign out
      </PendingButton>
      {(busy || navigating) && <SlowRequestNotice />}
      {error && (
        <p role="alert" className="mt-1 text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
