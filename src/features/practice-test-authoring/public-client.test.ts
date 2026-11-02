import { expect, it, vi } from 'vitest';
import { fetchPublicCases } from './public-client';
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
