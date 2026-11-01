import { expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import { loadSubmissionHistory } from './history.server';
const verifiedStudentId = 'verified-student';

it('sends literal title/language filters before paging with verified ownership and visible-title joins', async () => {
  let requested!: URL;
  const client = createClient('http://127.0.0.1:54321', 'synthetic-test-key', {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: async (input) => {
        requested = new URL(String(input));
        return new Response('[]', {
          headers: { 'content-type': 'application/json' },
        });
      },
    },
  });
  await loadSubmissionHistory(client, verifiedStudentId, 2, {
    q: 'A*%_[x]',
    language: 'java',
  });
  expect(requested.searchParams.get('student_id')).toBe('eq.verified-student');
  expect(requested.searchParams.get('language')).toBe('eq.java');
  expect(requested.searchParams.get('assignments.title')).toBe(
    'imatch.A\\*%_\\[x\\]',
  );
  expect(requested.searchParams.get('select')).toBe(
    'id,assignment_id,language,revision,created_at,is_late,due_at_submission,assignments!inner(title)',
  );
  expect(requested.searchParams.get('offset')).toBe('25');
  expect(requested.searchParams.get('limit')).toBe('26');
});

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
    'id,assignment_id,language,revision,created_at,is_late,due_at_submission,assignments(title)',
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

it('keeps the outer title join for language-only history so hidden assignments remain accessible', async () => {
  const { client, query } = fixture([]);
  await loadSubmissionHistory(
    client as unknown as SupabaseClient,
    verifiedStudentId,
    1,
    { q: '', language: 'python' },
  );
  expect(query.eq).toHaveBeenCalledWith('student_id', verifiedStudentId);
  expect(query.eq).toHaveBeenCalledWith('language', 'python');
  expect(query.select).toHaveBeenCalledWith(
    'id,assignment_id,language,revision,created_at,is_late,due_at_submission,assignments(title)',
  );
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
