import { expect, it } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { loadRevisionComparison } from './revision-comparison.server';

const anchorId = '10000000-0000-4000-8000-000000000010';
const assignmentId = '10000000-0000-4000-8000-000000000011';
const studentId = '10000000-0000-4000-8000-000000000012';
const anchor = {
  id: anchorId,
  assignment_id: assignmentId,
  language: 'python',
  revision: 2,
  assignments: null,
};
const rows = [
  { id: anchorId, revision: 1, source: ' old\n' },
  { id: '10000000-0000-4000-8000-000000000013', revision: 2, source: ' new\n' },
];

function fixture(responses: unknown[]) {
  const requests: URL[] = [];
  const client = createClient('http://127.0.0.1:54321', 'synthetic-test-key', {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: async (input) => {
        requests.push(new URL(String(input)));
        return new Response(JSON.stringify(responses[requests.length - 1]), {
          headers: { 'content-type': 'application/json' },
        });
      },
    },
  });
  return { client, requests };
}

it.each(['python', 'java'])(
  'loads at most two own %s sources with exact scope and projections',
  async (language) => {
    const { client, requests } = fixture([
      { ...anchor, language },
      { revision: 2 },
      rows,
    ]);
    const result = await loadRevisionComparison(
      client,
      studentId,
      anchorId,
      {},
    );
    expect(result?.before?.source).toBe(rows[0].source);
    expect(result?.after?.source).toBe(rows[1].source);
    expect(requests).toHaveLength(3);
    expect(requests[0].searchParams.get('id')).toBe(`eq.${anchorId}`);
    expect(requests[0].searchParams.get('select')).toBe(
      'id,assignment_id,language,revision,assignments(title)',
    );
    for (const request of requests)
      expect(request.searchParams.get('student_id')).toBe(`eq.${studentId}`);
    for (const request of requests.slice(1)) {
      expect(request.searchParams.get('assignment_id')).toBe(
        `eq.${assignmentId}`,
      );
      expect(request.searchParams.get('language')).toBe(`eq.${language}`);
    }
    expect(requests[1].searchParams.get('select')).toBe('revision');
    expect(requests[1].searchParams.get('limit')).toBe('1');
    expect(requests[2].searchParams.get('select')).toBe('id,source,revision');
    expect(requests[2].searchParams.get('revision')).toBe('in.(1,2)');
    expect(requests[2].searchParams.get('limit')).toBe('2');
  },
);

it('defaults revision one to first/latest and retains hidden assignment metadata as null', async () => {
  const { client } = fixture([
    { ...anchor, revision: 1 },
    { revision: 4 },
    [rows[0], { ...rows[1], revision: 4 }],
  ]);
  const result = await loadRevisionComparison(client, studentId, anchorId, {});
  expect(result?.anchor.assignments).toBeNull();
  expect(result?.before?.revision).toBe(1);
  expect(result?.after?.revision).toBe(4);
});

it('allows reversed and equal selections', async () => {
  const reversed = fixture([anchor, { revision: 2 }, rows]);
  const result = await loadRevisionComparison(
    reversed.client,
    studentId,
    anchorId,
    { before: 2, after: 1 },
  );
  expect(result?.before?.revision).toBe(2);
  expect(result?.after?.revision).toBe(1);
  const equal = fixture([anchor, { revision: 2 }, [rows[0]]]);
  const same = await loadRevisionComparison(equal.client, studentId, anchorId, {
    before: 1,
    after: 1,
  });
  expect(same?.before).toEqual(same?.after);
});

it('does not download source when only one revision is available', async () => {
  const { client, requests } = fixture([
    { ...anchor, revision: 1 },
    { revision: 1 },
  ]);
  const result = await loadRevisionComparison(client, studentId, anchorId, {});
  expect(result?.before).toBeNull();
  expect(requests).toHaveLength(2);
});

it.each([null, { ...anchor, language: 'ruby' }])(
  'denies absent or malformed owned anchor %j before source reads',
  async (value) => {
    const { client, requests } = fixture([value]);
    expect(
      await loadRevisionComparison(client, studentId, anchorId, {}),
    ).toBeNull();
    expect(requests).toHaveLength(1);
  },
);

it('rejects malformed anchor IDs without a query', async () => {
  const { client, requests } = fixture([]);
  expect(
    await loadRevisionComparison(client, studentId, 'bad-id', {}),
  ).toBeNull();
  expect(requests).toHaveLength(0);
});

it('rejects selections beyond the latest revision before source reads', async () => {
  const { client, requests } = fixture([anchor, { revision: 2 }]);
  expect(
    await loadRevisionComparison(client, studentId, anchorId, { before: 3 }),
  ).toBeNull();
  expect(requests).toHaveLength(2);
});

it.each(
  [
    [],
    [rows[0]],
    [rows[0], rows[0]],
    [{ ...rows[0], source: 'x'.repeat(8001) }, rows[1]],
    [{ ...rows[0], source: 'x\0' }, rows[1]],
  ].map((selected) => ({ selected })),
)(
  'fails closed on absent or invalid selected sources %j',
  async ({ selected }) => {
    const { client } = fixture([anchor, { revision: 2 }, selected]);
    expect(
      await loadRevisionComparison(client, studentId, anchorId, {}),
    ).toBeNull();
  },
);
