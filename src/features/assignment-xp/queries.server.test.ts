import { expect, it, vi } from 'vitest';
import { loadOwnXp } from './queries.server';
const value = { total_xp: '80', page: 1, has_more: false, awards: [] };
const courseId = '00000000-0000-4000-8000-000000000003';
it('uses only the authenticated own-total RPC with bounded page and validates its response', async () => {
  const rpc = vi.fn().mockResolvedValue({ data: value, error: null });
  expect(await loadOwnXp({ rpc } as never, courseId, 1)).toEqual(value);
  expect(rpc).toHaveBeenCalledWith('get_my_xp', {
    p_course_id: courseId,
    p_page: 1,
  });
});
it('does not fabricate zero XP on RPC failure, malformed data or invalid page', async () => {
  for (const result of [
    { error: { message: 'private sql' }, data: null },
    { error: null, data: { ...value, source: 'hidden' } },
  ])
    expect(
      await loadOwnXp(
        { rpc: vi.fn().mockResolvedValue(result) } as never,
        courseId,
        1,
      ),
    ).toBeNull();
  const rpc = vi.fn();
  expect(await loadOwnXp({ rpc } as never, courseId, 0)).toBeNull();
  expect(rpc).not.toHaveBeenCalled();
});
