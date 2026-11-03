// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { synchronizeSession } from './synchronize-session';
import {
  DRAFT_EPOCH,
  DRAFT_INVALIDATED,
  DRAFT_PREFIX,
} from '@/features/student-submissions/draft-storage';
const refresh = vi.hoisted(() => vi.fn());
vi.mock('@/lib/supabase/browser', () => ({
  createSupabaseBrowserClient: () => ({ auth: { refreshSession: refresh } }),
}));
beforeEach(() => {
  localStorage.clear();
  refresh.mockResolvedValue({ error: null });
});
afterEach(() => vi.clearAllMocks());
it('invalidates old writers while preserving local source and refreshes browser auth', async () => {
  const listener = vi.fn();
  window.addEventListener(DRAFT_INVALIDATED, listener);
  localStorage.setItem(DRAFT_PREFIX + 'synthetic', 'unfinished source');
  await synchronizeSession();
  expect(listener).toHaveBeenCalledOnce();
  expect(localStorage.getItem(DRAFT_EPOCH)).not.toBeNull();
  expect(localStorage.getItem(DRAFT_PREFIX + 'synthetic')).toBe(
    'unfinished source',
  );
  expect(refresh).toHaveBeenCalledOnce();
  window.removeEventListener(DRAFT_INVALIDATED, listener);
});
it('still invalidates writers when the provider refresh fails and hides its diagnostic', async () => {
  refresh.mockResolvedValue({ error: { message: 'private details' } });
  await expect(synchronizeSession()).rejects.toThrow(
    'Sign-in session could not be refreshed',
  );
  expect(localStorage.getItem(DRAFT_EPOCH)).not.toBeNull();
});
