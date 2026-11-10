import { expect, it } from 'vitest';
import { comparisonPath, comparisonSelection } from './comparison-selection';

it('accepts bounded revision selections', () => {
  expect(comparisonSelection({ before: '1', after: '2' })).toEqual({
    success: true,
    data: { before: 1, after: 2 },
  });
});

it('builds a canonical comparison route only when course context is known', () => {
  expect(comparisonPath('submission-a')).toBe('/courses');
  expect(comparisonPath('submission-a', 'course-a')).toBe(
    '/courses/course-a/submissions/submission-a/compare',
  );
});
