import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { loadReplies, loadThread, loadThreads } from './data.server';

function fixture(data: unknown, error: unknown = null) {
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockResolvedValue({ data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
  };
  const client = { from: vi.fn().mockReturnValue(query) };
  return { query, client: client as unknown as SupabaseClient };
}
function rows() {
  return Array.from({ length: 26 }, () => ({
    id: crypto.randomUUID(),
    title: 'Title',
    body: 'Text',
    author_name: 'Forum member',
    author_role: 'student',
    created_at: '2026-10-31T00:00:00+00:00',
  }));
}

describe('forum projected data access', () => {
  it('bounds stable thread pages with lookahead and excludes private columns', async () => {
    const { client, query } = fixture(rows());
    const result = await loadThreads(client, 2);
    expect(result.rows).toHaveLength(25);
    expect(result.hasNext).toBe(true);
    expect(query.range).toHaveBeenCalledWith(25, 50);
    expect(query.order.mock.calls).toEqual([
      ['created_at', { ascending: false }],
      ['id', { ascending: false }],
    ]);
    expect(query.select).toHaveBeenCalledWith(
      'id,body,author_name,author_role,created_at,title',
    );
  });
  it('binds replies to the requested thread and bounds the result', async () => {
    const { client, query } = fixture(rows());
    const id = crypto.randomUUID();
    const result = await loadReplies(client, id, 1);
    expect(result.rows).toHaveLength(25);
    expect(query.eq).toHaveBeenCalledWith('thread_id', id);
    expect(query.select).toHaveBeenCalledWith(
      'id,body,author_name,author_role,created_at',
    );
  });
  it('handles unavailable threads without inventing sample data', async () => {
    const { client } = fixture(null);
    expect(await loadThread(client, crypto.randomUUID())).toBeNull();
  });
  it('sanitizes backend failures', async () => {
    const { client } = fixture(null, { message: 'private backend failure' });
    await expect(loadThreads(client, 1)).rejects.toThrow(
      'Unable to load discussions.',
    );
  });
});
