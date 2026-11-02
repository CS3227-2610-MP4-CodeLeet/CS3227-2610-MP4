// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useSubmissionDraft } from './use-submission-draft';
import {
  clearBrowserDrafts,
  draftKey,
  type DraftContext,
} from './draft-storage';

const auth = vi.hoisted(() => ({
  callback:
    vi.fn<(event: string, session: { user: { id: string } } | null) => void>(),
  unsubscribe: vi.fn(),
}));
vi.mock('@/lib/supabase/browser', () => ({
  createSupabaseBrowserClient: () => ({
    auth: {
      onAuthStateChange: (callback: typeof auth.callback) => {
        auth.callback = callback;
        return { data: { subscription: { unsubscribe: auth.unsubscribe } } };
      },
    },
  }),
}));
const context: DraftContext = {
  studentId: crypto.randomUUID(),
  assignmentId: crypto.randomUUID(),
  language: 'java',
  revisionId: null,
};
beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  Object.defineProperty(navigator, 'locks', {
    configurable: true,
    value: {
      request: async (_name: string, work: () => unknown) => work(),
    },
  });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
});

it('binds source to verified context, recovers after remount and stops on sign-out', async () => {
  const first = renderHook(() => useSubmissionDraft('', context));
  act(() => first.result.current.setSource('class Main {}'));
  await act(() => vi.advanceTimersByTimeAsync(500));
  first.unmount();
  const second = renderHook(() => useSubmissionDraft('', context));
  expect(second.result.current.ready).toBe(false);
  expect(second.result.current.browserDraft.status).toBe('recover');
  act(() => second.result.current.browserDraft.resolve('restore'));
  expect(second.result.current.source).toBe('class Main {}');
  act(() => auth.callback('SIGNED_OUT', null));
  expect(second.result.current.ready).toBe(false);
  await act(() => vi.advanceTimersByTimeAsync(1000));
  expect(localStorage.getItem(draftKey(context))).toBeNull();
});

it('stops same-document writers after explicit cleanup and preserves other applications', async () => {
  const hook = renderHook(() => useSubmissionDraft('', context));
  act(() => hook.result.current.setSource('private'));
  localStorage.setItem('theme', 'dark');
  await act(() => clearBrowserDrafts());
  await act(() => vi.advanceTimersByTimeAsync(1000));
  expect(localStorage.getItem(draftKey(context))).toBeNull();
  expect(localStorage.getItem('theme')).toBe('dark');
  expect(hook.result.current.browserDraft.status).toBe('stopped');
});

it('invalidates the old editor on account changes and unsubscribes on unmount', () => {
  const hook = renderHook(() => useSubmissionDraft('', context));
  act(() => auth.callback('SIGNED_IN', { user: { id: crypto.randomUUID() } }));
  expect(hook.result.current.browserDraft.status).toBe('stopped');
  hook.unmount();
  expect(auth.unsubscribe).toHaveBeenCalled();
});

it('still deletes drafts when the browser rejects a cleanup lock request', async () => {
  localStorage.setItem(draftKey(context), 'synthetic private draft');
  Object.defineProperty(navigator, 'locks', {
    configurable: true,
    value: {
      request: async () => {
        throw new Error('lock unavailable');
      },
    },
  });
  await clearBrowserDrafts();
  expect(localStorage.getItem(draftKey(context))).toBeNull();
});
