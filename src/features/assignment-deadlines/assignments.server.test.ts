import { createClient } from '@supabase/supabase-js';
import { expect, it } from 'vitest';
import { loadPublishedAssignments } from './assignments.server';

const studentId = '10000000-0000-4000-8000-000000000001';
const id = '10000000-0000-4000-8000-000000000002';
const courseId = '10000000-0000-4000-8000-000000000003';

it('embeds only the latest own timing metadata without dropping unsubmitted assignments', async () => {
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
        return new Response(
          JSON.stringify([
            {
              id,
              title: 'Late work',
              language: 'python',
              publication_status: 'published',
              due_at: null,
              submissions: [{ revision: 2, is_late: true }],
            },
            {
              id: studentId,
              title: 'Open work',
              language: 'java',
              publication_status: 'published',
              due_at: null,
              submissions: [],
            },
          ]),
          { headers: { 'content-type': 'application/json' } },
        );
      },
    },
  });
  const assignments = await loadPublishedAssignments(
    client,
    studentId,
    courseId,
    {
      q: 'Loops',
      language: 'python',
    },
  );
  expect(
    assignments?.map((assignment) => assignment.submission_status),
  ).toEqual(['Submitted late', 'Not submitted']);
  expect(requested.searchParams.get('select')).toBe(
    'id,title,language,publication_status,due_at,submissions(revision,is_late)',
  );
  expect(requested.searchParams.get('publication_status')).toBe('eq.published');
  expect(requested.searchParams.get('course_id')).toBe(`eq.${courseId}`);
  expect(requested.searchParams.get('submissions.student_id')).toBe(
    `eq.${studentId}`,
  );
  expect(requested.searchParams.get('submissions.limit')).toBe('1');
  expect(requested.searchParams.get('submissions.order')).toBe('revision.desc');
  expect(requested.searchParams.get('language')).toBe('eq.python');
  expect(requested.searchParams.get('title')).toBe('imatch.Loops');
});
