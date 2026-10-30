import { expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { loadSubmissionHistory } from './history.server';

function fixture(data: unknown, error: unknown = null) {
  const range = vi.fn().mockResolvedValue({ data, error });
  const query = { select: vi.fn(), eq: vi.fn(), order: vi.fn(), range };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.order.mockReturnValue(query);
  return { query, client: { from: vi.fn().mockReturnValue(query) } };
}

it('filters verified identity, selects no code/grades and uses deterministic bounded paging', async () => {
  const { client, query } = fixture([]);
  const user = crypto.randomUUID();
  expect(
    await loadSubmissionHistory(client as unknown as SupabaseClient, user, 2),
  ).toEqual({ rows: [], hasNext: false });
  expect(client.from).toHaveBeenCalledWith('submissions');
  expect(query.eq).toHaveBeenCalledWith('student_id', user);
  expect(query.select).toHaveBeenCalledWith(
    'id,assignment_id,language,revision,created_at,assignments(title)',
  );
  expect(query.order.mock.calls).toEqual([
    ['created_at', { ascending: false }],
    ['id', { ascending: false }],
  ]);
  expect(query.range).toHaveBeenCalledWith(25, 50);
});

it('fetches one lookahead but renders only 25 revisions', async () => {
  const rows = Array.from({ length: 26 }, (_, index) => ({
    id: crypto.randomUUID(),
    assignment_id: crypto.randomUUID(),
    language: 'python',
    revision: index + 1,
    created_at: '2026-10-30T04:00:00Z',
    assignments: null,
  }));
  const { client } = fixture(rows);
  const result = await loadSubmissionHistory(
    client as unknown as SupabaseClient,
    crypto.randomUUID(),
    1,
  );
  expect(result?.rows).toHaveLength(25);
  expect(result?.hasNext).toBe(true);
});

it.each([
  [null, { message: 'private backend detail' }],
  [[{ invalid: true }], null],
])('fails closed for backend/invalid data errors', async (data, error) => {
  const { client } = fixture(data, error);
  expect(
    await loadSubmissionHistory(
      client as unknown as SupabaseClient,
      crypto.randomUUID(),
      1,
    ),
  ).toBeNull();
});

it('handles a thrown network failure without exposing its message', async () => {
  const { client, query } = fixture([]);
  query.range.mockRejectedValue(new Error('private network detail'));
  expect(
    await loadSubmissionHistory(
      client as unknown as SupabaseClient,
      crypto.randomUUID(),
      1,
    ),
  ).toBeNull();
});
