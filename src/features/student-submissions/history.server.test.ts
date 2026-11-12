import { expect, it } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { loadSubmissionHistory } from './history.server';

const studentId = 'verified-student';
const courseId = 'course-a';
const cursor = {
  submittedAt: '2026-11-12T04:00:00.123456+00:00',
  id: '00000000-0000-4000-8000-000000000025',
};
const projection =
  'id,assignment_id,course_id,language,revision,created_at,is_late,due_at_submission,assignments(title)';

function fixture(data: unknown, status = 200) {
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
        return new Response(JSON.stringify(data), {
          status,
          headers: { 'content-type': 'application/json' },
        });
      },
    },
  });
  return { client, request: () => requested };
}

function row(revision: number) {
  return {
    id: `00000000-0000-4000-8000-${String(revision).padStart(12, '0')}`,
    assignment_id: '00000000-0000-4000-8000-000000000001',
    language: 'python',
    revision,
    created_at: cursor.submittedAt,
    assignments: null,
  };
}

it('seeks beyond the exact timestamp and ID, retains ownership and literal filters, and sends no offset', async () => {
  const { client, request } = fixture([]);
  await loadSubmissionHistory(client, {
    studentId,
    courseId,
    page: 2,
    cursor,
    filters: { q: 'A*%_[x]', language: 'java' },
  });
  const query = request().searchParams;
  expect(query.get('student_id')).toBe('eq.verified-student');
  expect(query.get('course_id')).toBe('eq.course-a');
  expect(query.get('language')).toBe('eq.java');
  expect(query.get('assignments.title')).toBe('imatch.A\\*%_\\[x\\]');
  expect(query.get('select')).toBe(
    projection.replace('assignments(title)', 'assignments!inner(title)'),
  );
  expect(query.get('or')).toBe(
    `(created_at.lt.${cursor.submittedAt},and(created_at.eq.${cursor.submittedAt},id.lt.${cursor.id}))`,
  );
  expect(query.get('order')).toBe('created_at.desc,id.desc');
  expect(query.has('offset')).toBe(false);
  expect(query.get('limit')).toBe('26');
});

it('takes the nearest newer 25 rows before reversing backward results', async () => {
  const { client, request } = fixture(
    Array.from({ length: 26 }, (_, i) => row(i + 1)),
  );
  const result = await loadSubmissionHistory(client, {
    studentId,
    courseId,
    page: 1,
    cursor,
    backwards: true,
  });
  expect(result?.rows.map((item) => item.revision)).toEqual(
    Array.from({ length: 25 }, (_, i) => 25 - i),
  );
  expect(result?.hasNext).toBe(true);
  expect(request().searchParams.get('order')).toBe('created_at.asc,id.asc');
  expect(request().searchParams.get('or')).toBe(
    `(created_at.gt.${cursor.submittedAt},and(created_at.eq.${cursor.submittedAt},id.gt.${cursor.id}))`,
  );
});

it('fetches one lookahead, renders at most 25 own metadata rows, and keeps hidden titles neutral', async () => {
  const { client, request } = fixture(
    Array.from({ length: 26 }, (_, i) => row(i + 1)),
  );
  const result = await loadSubmissionHistory(client, {
    studentId,
    courseId,
    page: 1,
  });
  expect(result?.rows).toHaveLength(25);
  expect(result?.rows[0].title).toBe('Assignment unavailable');
  expect(result?.hasNext).toBe(true);
  expect(request().searchParams.get('select')).toBe(projection);
});

it('does not enable offset fallback or interpolate malformed cursors', async () => {
  const { client, request } = fixture([]);
  expect(
    await loadSubmissionHistory(client, { studentId, courseId, page: 2 }),
  ).toBeNull();
  expect(
    await loadSubmissionHistory(client, {
      studentId,
      courseId,
      page: 2,
      cursor: { ...cursor, id: 'bad),id.gt.0' },
    }),
  ).toBeNull();
  expect(request()).toBeUndefined();
});

it.each([
  [{ message: 'private backend detail' }, 400],
  [[{ invalid: true }], 200],
])('fails closed for backend/invalid data', async (data, status) => {
  const { client } = fixture(data, status as number);
  expect(
    await loadSubmissionHistory(client, { studentId, courseId, page: 1 }),
  ).toBeNull();
});
