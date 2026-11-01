import { expect, it } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { loadStudentGrades } from './grades.server';

const gradeId = '10000000-0000-4000-8000-000000000001';
const submissionId = '10000000-0000-4000-8000-000000000002';
const studentId = 'verified-student';
const row = {
  id: gradeId,
  submission_id: submissionId,
  total_score: 8.5,
  feedback: '<script>untrusted()</script>',
  published_at: '2026-11-01T00:00:00Z',
  submissions: {
    language: 'python',
    revision: 2,
    assignments: { title: 'Loops' },
  },
};

function fixture(data: unknown, status = 200) {
  let requested!: URL;
  const client = createClient(
    'http://127.0.0.1:54321',
    'synthetic-public-key',
    {
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
    },
  );
  return { client, request: () => requested };
}

it('filters ownership/publication/language/literal title before bounded deterministic paging', async () => {
  const data = fixture([]);
  await loadStudentGrades(data.client, studentId, 2, {
    q: 'A*%_[x]',
    language: 'java',
  });
  const query = data.request().searchParams;
  expect(data.request().pathname).toBe('/rest/v1/grades');
  expect(query.get('select')).toBe(
    'id,submission_id,total_score,feedback,published_at,submissions!inner(language,revision,assignments!inner(title))',
  );
  expect(query.get('submissions.student_id')).toBe('eq.verified-student');
  expect(query.get('published_at')).toBe('not.is.null');
  expect(query.get('submissions.language')).toBe('eq.java');
  expect(query.get('submissions.assignments.title')).toBe(
    'imatch.A\\*%_\\[x\\]',
  );
  expect(query.get('order')).toBe('published_at.desc,id.desc');
  expect(query.get('offset')).toBe('25');
  expect(query.get('limit')).toBe('26');
});

it('keeps hidden-assignment grades, projects only safe DTO fields and accepts null scores', async () => {
  const data = fixture([
    {
      ...row,
      total_score: null,
      submissions: { ...row.submissions, assignments: null },
      source: 'private-extra',
    },
  ]);
  expect(await loadStudentGrades(data.client, studentId, 1)).toEqual({
    rows: [
      {
        id: gradeId,
        submissionId,
        score: null,
        feedback: row.feedback,
        publishedAt: row.published_at,
        language: 'python',
        revision: 2,
        title: 'Assignment unavailable',
      },
    ],
    hasNext: false,
  });
  expect(data.request().searchParams.get('select')).toBe(
    'id,submission_id,total_score,feedback,published_at,submissions!inner(language,revision,assignments(title))',
  );
});

it('renders 25 entries with one lookahead and no extra page beyond the bound', async () => {
  const data = fixture(Array.from({ length: 26 }, () => row));
  expect(
    (await loadStudentGrades(data.client, studentId, 1))?.rows,
  ).toHaveLength(25);
  expect((await loadStudentGrades(data.client, studentId, 1))?.hasNext).toBe(
    true,
  );
  expect(
    (await loadStudentGrades(data.client, studentId, 10000))?.hasNext,
  ).toBe(false);
});

it.each([
  [{ ...row, published_at: null }],
  [{ ...row, total_score: -1 }],
  [{ ...row, submissions: null }],
  [{ ...row, feedback: 'x'.repeat(4001) }],
  [{ ...row, submissions: { ...row.submissions, language: 'ruby' } }],
])('fails closed for invalid projected data', async (value) => {
  expect(
    await loadStudentGrades(fixture(value).client, studentId, 1),
  ).toBeNull();
});

it('returns a safe failure result for a backend error', async () => {
  const data = fixture({ message: 'private backend detail' }, 500);
  expect(await loadStudentGrades(data.client, studentId, 1)).toBeNull();
});
