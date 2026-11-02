import { expect, it, vi } from 'vitest';
import { loadOwnXp } from './queries.server';
const value = { total_xp: '80', page: 1, has_more: false, awards: [] };
it('uses only the authenticated own-total RPC with bounded page and validates its response', async () => {
  const rpc = vi.fn().mockResolvedValue({ data: value, error: null });
  expect(await loadOwnXp({ rpc } as never, 1)).toEqual(value);
  expect(rpc).toHaveBeenCalledWith('get_my_xp', { p_page: 1 });
});
it('does not fabricate zero XP on RPC failure, malformed data or invalid page', async () => {
  for (const result of [
    { error: { message: 'private sql' }, data: null },
    { error: null, data: { ...value, source: 'hidden' } },
  ])
    expect(
      await loadOwnXp({ rpc: vi.fn().mockResolvedValue(result) } as never, 1),
    ).toBeNull();
  const rpc = vi.fn();
  expect(await loadOwnXp({ rpc } as never, 0)).toBeNull();
  expect(rpc).not.toHaveBeenCalled();
});
