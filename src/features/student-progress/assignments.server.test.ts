import { createClient } from '@supabase/supabase-js';
import { expect, it } from 'vitest';
import {
  loadAssignmentProgress,
  loadUpcomingAssignments,
} from './assignments.server';

const studentId = crypto.randomUUID();
const courseId = crypto.randomUUID();
const now = '2026-11-03T10:00:00.000Z';
function fixture(
  counts: Array<number | null> = [1203, 1201, 3],
  data: unknown = [],
) {
  const requests: Array<{ url: URL; init?: RequestInit }> = [];
  const client = createClient('http://localhost:54321', 'synthetic-key', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: async (input, init) => {
        requests.push({ url: new URL(String(input)), init });
        const count = counts[requests.length - 1];
        return new Response(
          init?.method === 'HEAD' ? null : JSON.stringify(data),
          {
            headers: {
              'content-type': 'application/json',
              ...(count === null ? {} : { 'content-range': `*/${count ?? 0}` }),
            },
          },
        );
      },
    },
  });
  return { client, requests };
}

it('counts all published assignments exactly without fetching revisions or truncating at a REST page', async () => {
  const { client, requests } = fixture();
  expect(
    await loadAssignmentProgress(client, studentId, courseId, now),
  ).toEqual({
    total: 1203,
    submitted: 2,
    outstanding: 1201,
    overdue: 3,
  });
  expect(requests).toHaveLength(3);
  for (const { url, init } of requests) {
    expect(init?.method).toBe('HEAD');
    expect(new Headers(init?.headers).get('prefer')).toContain('count=exact');
    expect(url.searchParams.get('publication_status')).toBe('eq.published');
    expect(url.searchParams.get('course_id')).toBe(`eq.${courseId}`);
    expect(url.searchParams.get('select')).not.toMatch(/source|grades|rubric/);
  }
  for (const { url } of requests.slice(1)) {
    expect(url.searchParams.get('submissions.student_id')).toBe(
      `eq.${studentId}`,
    );
    expect(url.searchParams.get('submissions')).toBe('is.null');
  }
  expect(requests[2].url.searchParams.get('due_at')).toBe(`lt.${now}`);
});

it('filters counts and deadlines to the selected course', async () => {
  const { client, requests } = fixture();
  await loadAssignmentProgress(client, studentId, courseId, now);
  await loadUpcomingAssignments(client, studentId, courseId, now);
  expect(requests.map(({ url }) => url.searchParams.get('course_id'))).toEqual([
    `eq.${courseId}`,
    `eq.${courseId}`,
    `eq.${courseId}`,
    `eq.${courseId}`,
  ]);
});

it.each([
  [0, 0, 0],
  [4, 0, 0],
])(
  'handles empty and entirely submitted collections (%j)',
  async (total, outstanding, overdue) => {
    const { client } = fixture([total, outstanding, overdue]);
    expect(
      await loadAssignmentProgress(client, studentId, courseId, now),
    ).toEqual({
      total,
      outstanding,
      overdue,
      submitted: total - outstanding,
    });
  },
);

it.each([
  [2, 3, 0],
  [2, 1, 2],
  [null, 0, 0],
  [-1, 0, 0],
])(
  'does not fabricate counts on missing or inconsistent responses (%j)',
  async (total, outstanding, overdue) => {
    expect(
      await loadAssignmentProgress(
        fixture([total, outstanding, overdue]).client,
        studentId,
        courseId,
        now,
      ),
    ).toBeNull();
  },
);

it('fetches only the five earliest own-outstanding deadlines, including the exact boundary', async () => {
  const rows = [
    {
      id: crypto.randomUUID(),
      title: '<img onerror=alert(1)>',
      language: 'java',
      due_at: now,
    },
  ];
  const { client, requests } = fixture([], rows);
  expect(
    await loadUpcomingAssignments(client, studentId, courseId, now),
  ).toEqual(rows);
  const query = requests[0].url.searchParams;
  expect(query.get('submissions.student_id')).toBe(`eq.${studentId}`);
  expect(query.get('submissions')).toBe('is.null');
  expect(query.get('course_id')).toBe(`eq.${courseId}`);
  expect(query.get('due_at')).toBe(`gte.${now}`);
  expect(query.get('limit')).toBe('5');
  expect(query.get('order')).toBe('due_at.asc,id.asc');
  expect(query.get('select')).toBe('id,title,language,due_at,submissions()');
});

it('rejects invalid upcoming metadata instead of inventing an empty result', async () => {
  expect(
    await loadUpcomingAssignments(
      fixture([], [{ title: 'invalid' }]).client,
      studentId,
      courseId,
      now,
    ),
  ).toBeNull();
});

it('keeps network/backend diagnostics private', async () => {
  const client = {
    from: () => {
      throw new Error('private backend');
    },
  } as never;
  expect(
    await loadAssignmentProgress(client, studentId, courseId, now),
  ).toBeNull();
  expect(
    await loadUpcomingAssignments(client, studentId, courseId, now),
  ).toBeNull();
});
