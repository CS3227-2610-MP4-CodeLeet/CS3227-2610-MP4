import { expect, it } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { parseForumSearch, forumSearchUrl } from './search';
import { loadThreads } from './data.server';

it.each([
  [undefined, ''],
  ['  loops  ', 'loops'],
  ['   ', ''],
  ['a'.repeat(160), 'a'.repeat(160)],
])('normalizes a bounded term', (input, expected) => {
  expect(parseForumSearch(input)).toBe(expected);
});
it.each([[['a', 'b']], ['\nloops'], ['a\0b'], ['x'.repeat(161)]])(
  'rejects duplicate, control and oversized terms',
  (input) => {
    expect(parseForumSearch(input)).toBeNull();
  },
);

it('preserves reserved URL text and existing reply pagination', () => {
  expect(forumSearchUrl('/forums', 2, 'a & b')).toBe(
    '/forums?q=a+%26+b&page=2',
  );
  expect(forumSearchUrl('/forums/thread', 1)).toBe('/forums/thread?page=1');
});

it.each([
  ['a,b', '(title.imatch."a,b",body.imatch."a,b")'],
  [
    'a",b\\c.*',
    String.raw`(title.imatch."a\",b\\\\c\\.\\*",body.imatch."a\",b\\\\c\\.\\*")`,
  ],
])(
  'sends a safely quoted projected OR search before stable pagination',
  async (term, expected) => {
    let requested!: URL;
    const client = createClient('http://127.0.0.1:54321', 'synthetic-key', {
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
    await loadThreads(client, 'f0300000-0000-4000-8000-000000000020', 2, term);
    expect(requested.searchParams.get('or')).toBe(expected);
    expect(requested.searchParams.get('select')).toBe(
      'id,body,author_name,author_role,created_at,title',
    );
    expect(requested.searchParams.get('course_id')).toBe(
      'eq.f0300000-0000-4000-8000-000000000020',
    );
    expect(requested.searchParams.get('order')).toBe('created_at.desc,id.desc');
    expect(requested.searchParams.get('offset')).toBe('25');
    expect(requested.searchParams.get('limit')).toBe('26');
  },
);
