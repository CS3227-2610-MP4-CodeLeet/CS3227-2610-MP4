import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import GradesNotFound from './not-found';

it('returns to course selection from a course-scoped grades not-found page', () => {
  const html = renderToStaticMarkup(<GradesNotFound />);
  expect(html).toContain('href="/courses"');
  expect(html).toContain('Choose a course');
  expect(html).not.toContain('href="/student/grades"');
});
