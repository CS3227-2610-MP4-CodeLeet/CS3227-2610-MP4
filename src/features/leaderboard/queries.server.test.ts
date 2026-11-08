import { expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { loadLeaderboard } from './queries.server';
const courseId = '00000000-0000-4000-8000-000000000003';
it('loads only the bounded trusted projection and fails safely', async () => {
  const rpc = vi.fn().mockResolvedValue({
    data: { page: 1, has_more: false, rows: [], own: null },
    error: null,
  });
  const client = { rpc } as unknown as SupabaseClient;
  expect(await loadLeaderboard(client, courseId, 1)).toEqual({
    page: 1,
    has_more: false,
    rows: [],
    own: null,
  });
  expect(rpc).toHaveBeenCalledWith('get_leaderboard', {
    p_course_id: courseId,
    p_page: 1,
  });
  rpc.mockResolvedValueOnce({ data: { email: 'private' }, error: null });
  expect(await loadLeaderboard(client, courseId, 1)).toBeNull();
  rpc.mockResolvedValueOnce({
    data: null,
    error: { message: 'private service error' },
  });
  expect(await loadLeaderboard(client, courseId, 1)).toBeNull();
});
it('rejects invalid pages before querying', async () => {
  const rpc = vi.fn();
  for (const page of [0, 10001, 1.5, NaN])
    expect(
      await loadLeaderboard(
        { rpc } as unknown as SupabaseClient,
        courseId,
        page,
      ),
    ).toBeNull();
  expect(rpc).not.toHaveBeenCalled();
});
