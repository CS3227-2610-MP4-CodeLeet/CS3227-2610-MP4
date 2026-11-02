import { createClient } from '@supabase/supabase-js';
import { expect, it } from 'vitest';
import { loadPublicCases, loadOwnerCases } from './queries.server';
const id = 'b2000000-0000-4000-8000-000000000001';
function fixture(records: Record<string, unknown>) {
  const requests: URL[] = [];
  const client = createClient('http://127.0.0.1:54321', 'synthetic-key', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: async (input) => {
        const url = new URL(String(input));
        requests.push(url);
        const table = url.pathname.split('/').at(-1)!;
        const value = records[table];
        return new Response(
          JSON.stringify(value === undefined ? [] : [value]),
          { headers: { 'content-type': 'application/json' } },
        );
      },
    },
  });
  return { client, requests };
}
it('projects only public cases for a published assignment and distinguishes absent set', async () => {
  const { client, requests } = fixture({ assignments: { id, version: 3 } });
  expect(await loadPublicCases(client, id)).toEqual({
    assignment_id: id,
    assignment_revision: 3,
    test_set_revision: 0,
    cases: [],
  });
  expect(requests[0].searchParams.get('publication_status')).toBe(
    'eq.published',
  );
  expect(
    requests.every(
      (url) => !url.search.includes('rubric') && !url.search.includes('source'),
    ),
  ).toBe(true);
  expect(requests).toHaveLength(1);
  expect(requests[0].searchParams.get('select')).toBe(
    'id,version,assignment_practice_sets(published_revision,cases)',
  );
});
it('does not query cases for an unavailable assignment', async () => {
  const { client, requests } = fixture({});
  expect(await loadPublicCases(client, id)).toBeNull();
  expect(requests).toHaveLength(1);
});
it('fails closed on malformed snapshots instead of providing fixtures', async () => {
  const { client } = fixture({
    assignments: {
      id,
      version: 1,
      assignment_practice_sets: {
        published_revision: 1,
        cases: [{ secret: true }],
      },
    },
  });
  await expect(loadPublicCases(client, id)).rejects.toThrow();
});
it('loads separate owner draft/public metadata without exposing source or rubrics', async () => {
  const { client, requests } = fixture({
    assignments: {
      id,
      title: 'Sum',
      language: 'java',
      assignment_practice_drafts: { version: 2, cases: [] },
      assignment_practice_sets: {
        published_revision: 1,
        published_at: '2026-11-02T00:00:00Z',
      },
    },
  });
  expect(await loadOwnerCases(client, id)).toMatchObject({
    version: 2,
    published_revision: 1,
    cases: [],
    language: 'java',
  });
  expect(requests.map((url) => url.searchParams.get('select'))).toEqual([
    'id,title,language,assignment_practice_drafts(version,cases),assignment_practice_sets(published_revision,published_at)',
  ]);
});
