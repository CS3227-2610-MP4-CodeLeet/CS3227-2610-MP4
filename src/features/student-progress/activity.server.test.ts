import { createClient } from '@supabase/supabase-js';
import { expect, it } from 'vitest';
import { loadRecentGrades, loadRecentSubmissions } from './activity.server';

const studentId = crypto.randomUUID();
const courseId = crypto.randomUUID();
function fixture(data: unknown, status = 200) {
  const requests: URL[] = [];
  const client = createClient('http://localhost:54321', 'synthetic-key', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: async (input) => {
        requests.push(new URL(String(input)));
        return new Response(JSON.stringify(data), {
          status,
          headers: { 'content-type': 'application/json' },
        });
      },
    },
  });
  return { client, requests };
}

it('limits recent revision metadata to five with verified identity and deterministic ordering', async () => {
  const { client, requests } = fixture([]);
  expect(await loadRecentSubmissions(client, studentId, courseId)).toEqual([]);
  const query = requests[0].searchParams;
  expect(query.get('student_id')).toBe(`eq.${studentId}`);
  expect(query.get('course_id')).toBe(`eq.${courseId}`);
  expect(query.get('limit')).toBe('5');
  expect(query.get('order')).toBe('created_at.desc,id.desc');
  expect(query.get('select')).not.toMatch(/source|feedback|rubric|grades/);
});

it('queries only five own published grades without retrieving private scores/rubric/source/feedback', async () => {
  const row = {
    id: crypto.randomUUID(),
    submission_id: crypto.randomUUID(),
    total_score: 8,
    published_at: '2026-11-03T10:00:00Z',
    submissions: { language: 'python', revision: 2, assignments: null },
  };
  const { client, requests } = fixture([row]);
  expect(await loadRecentGrades(client, studentId, courseId)).toEqual([
    {
      id: row.id,
      submissionId: row.submission_id,
      score: 8,
      publishedAt: row.published_at,
      language: 'python',
      revision: 2,
      title: 'Assignment unavailable',
    },
  ]);
  const query = requests[0].searchParams;
  expect(query.get('submissions.student_id')).toBe(`eq.${studentId}`);
  expect(query.get('submissions.course_id')).toBe(`eq.${courseId}`);
  expect(query.get('published_at')).toBe('not.is.null');
  expect(query.get('limit')).toBe('5');
  expect(query.get('order')).toBe('published_at.desc,id.desc');
  expect(query.get('select')).not.toMatch(/source|scores|rubric|feedback/);
});

it.each([null, [{ invalid: true }]])(
  'does not turn malformed activity into empty lists (%j)',
  async (data) => {
    const { client } = fixture(data);
    expect(await loadRecentSubmissions(client, studentId, courseId)).toBeNull();
    expect(await loadRecentGrades(client, studentId, courseId)).toBeNull();
  },
);

it('returns unavailable for backend errors', async () => {
  const { client } = fixture({ message: 'private backend' }, 403);
  expect(await loadRecentSubmissions(client, studentId, courseId)).toBeNull();
  expect(await loadRecentGrades(client, studentId, courseId)).toBeNull();
});
