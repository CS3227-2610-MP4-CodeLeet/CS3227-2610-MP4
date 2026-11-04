import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { StudentGradesList } from './grades-list';

it('renders literal feedback, revision links and filtered pagination without invented totals', () => {
  const html = renderToStaticMarkup(
    <StudentGradesList
      page={2}
      filters={{ q: 'Loops', language: 'java' }}
      courseId="course-a"
      grades={{
        hasNext: true,
        rows: [
          {
            id: 'grade',
            submissionId: 'own-revision',
            title: 'Loops <img src=x>',
            score: null,
            feedback: '<script>unsafe()</script>',
            revision: 3,
            language: 'java',
            publishedAt: '2026-11-01T00:00:00Z',
          },
        ],
      }}
    />,
  );
  expect(html).toContain('&lt;script&gt;unsafe()&lt;/script&gt;');
  expect(html).not.toContain('<script>unsafe()');
  expect(html).toContain(
    'href="/student/submissions/own-revision?courseId=course-a"',
  );
  expect(html).toContain('Score unavailable');
  expect(html).not.toContain('%');
  expect(html).toContain(
    '/student/grades?courseId=course-a&amp;q=Loops&amp;language=java&amp;page=3',
  );
  expect(html).toContain(
    '/student/grades?courseId=course-a&amp;q=Loops&amp;language=java"',
  );
}, 15_000);

it('distinguishes an unpublished empty account from a filtered no-match page', () => {
  const empty = renderToStaticMarkup(
    <StudentGradesList
      grades={{ rows: [], hasNext: false }}
      page={1}
      filters={{ q: '', language: '' }}
      courseId="course-a"
    />,
  );
  expect(empty).toContain('No published grades yet');
  const filtered = renderToStaticMarkup(
    <StudentGradesList
      grades={{ rows: [], hasNext: false }}
      page={1}
      filters={{ q: 'missing', language: '' }}
      courseId="course-a"
    />,
  );
  expect(filtered).toContain('No matching grades');
});
