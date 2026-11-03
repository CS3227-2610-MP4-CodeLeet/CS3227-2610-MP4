'use client';

import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import {
  DRAFT_EPOCH,
  DRAFT_INVALIDATED,
  DRAFT_LOCK,
} from '@/features/student-submissions/draft-storage';

function notifyTabs() {
  window.dispatchEvent(new Event(DRAFT_INVALIDATED));
  try {
    const channel = new window.BroadcastChannel(DRAFT_INVALIDATED);
    channel.postMessage('signed-in');
    channel.close();
  } catch {
    /* Storage epoch and the normal Auth event remain available. */
  }
}

async function invalidateWriters() {
  notifyTabs();
  const mark = () =>
    window.localStorage.setItem(DRAFT_EPOCH, crypto.randomUUID());
  try {
    if (navigator.locks) await navigator.locks.request(DRAFT_LOCK, mark);
    else mark();
  } catch {
    try {
      mark();
    } catch {
      /* Fully denied browser storage cannot persist an epoch. */
    }
  }
}

export async function synchronizeSession() {
  // Notify writers before any provider call; preserve drafts even if refresh fails.
  await invalidateWriters();
  // Synchronize the server-issued session; server authorization still verifies getUser.
  const { error } = await createSupabaseBrowserClient().auth.refreshSession();
  if (error) throw new Error('Sign-in session could not be refreshed');
}
