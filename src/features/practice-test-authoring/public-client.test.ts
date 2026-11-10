import { expect, it, vi } from 'vitest';
import { fetchInstructorPreviewCases, fetchPublicCases } from './public-client';
const id = 'b2000000-0000-4000-8000-000000000001';
it('loads a bounded public snapshot privately without source or results', async () => {
  const data = {
    assignment_id: id,
    assignment_revision: 2,
    test_set_revision: 3,
    cases: [],
  };
  const fetch = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify({ data })));
  expect(await fetchPublicCases(id, undefined, fetch)).toEqual(data);
  expect(fetch).toHaveBeenCalledWith(
    `/api/student/assignments/${id}/test-cases`,
    { cache: 'no-store', signal: undefined },
  );
});
it('rejects errors, invalid snapshots and mismatched assignment IDs without fixture fallback', async () => {
  for (const response of [
    new Response('{}', { status: 503 }),
    new Response(JSON.stringify({ data: { cases: [{ secret: 1 }] } })),
    new Response(
      JSON.stringify({
        data: {
          assignment_id: crypto.randomUUID(),
          assignment_revision: 1,
          test_set_revision: 1,
          cases: [],
        },
      }),
    ),
  ])
    await expect(
      fetchPublicCases(id, undefined, vi.fn().mockResolvedValue(response)),
    ).rejects.toThrow();
});

it('loads instructor preview cases via practice-tests endpoint and filters private cases', async () => {
  const ownerData = {
    assignment_id: id,
    title: 'Preview Assignment',
    language: 'python',
    version: 2,
    published_revision: 1,
    published_at: '2026-11-08T00:00:00Z',
    cases: [
      {
        id: 'c1000000-0000-4000-8000-000000000001',
        name: 'Public Case 1',
        stdin: '1\n',
        expected_stdout: '1\n',
        is_public: true,
      },
      {
        id: 'c1000000-0000-4000-8000-000000000002',
        name: 'Hidden Private Case',
        stdin: '2\n',
        expected_stdout: '2\n',
        is_public: false,
      },
      {
        id: 'c1000000-0000-4000-8000-000000000003',
        name: 'Default Public Case',
        stdin: '3\n',
        expected_stdout: '3\n',
      },
    ],
  };
  const fetch = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify({ data: ownerData })));
  const result = await fetchInstructorPreviewCases(id, undefined, fetch);
  expect(fetch).toHaveBeenCalledWith(`/api/assignments/${id}/practice-tests`, {
    cache: 'no-store',
    signal: undefined,
  });
  expect(result.cases).toHaveLength(2);
  expect(result.cases.map((c) => c.name)).toEqual([
    'Public Case 1',
    'Default Public Case',
  ]);
  expect(result.assignment_id).toBe(id);
});

it('rejects instructor preview fetches with status failure or mismatched id', async () => {
  const fetch404 = vi
    .fn()
    .mockResolvedValue(new Response('{}', { status: 404 }));
  await expect(
    fetchInstructorPreviewCases(id, undefined, fetch404),
  ).rejects.toThrow('Published tests could not be loaded. Try again.');

  const fetchMismatch = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        data: {
          assignment_id: crypto.randomUUID(),
          title: 'Mismatch',
          language: 'python',
          version: 1,
          published_revision: 0,
          published_at: null,
          cases: [],
        },
      }),
    ),
  );
  await expect(
    fetchInstructorPreviewCases(id, undefined, fetchMismatch),
  ).rejects.toThrow('Published tests do not match this assignment.');
});
