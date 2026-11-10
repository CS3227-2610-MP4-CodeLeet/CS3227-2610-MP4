import { expect, it } from 'vitest';
import { legacyCoursePath } from './legacy-routes';

it('builds canonical course paths from valid identifiers and known sections', () => {
  expect(
    legacyCoursePath('00000000-0000-4000-8000-000000000001', 'progress'),
  ).toBe('/courses/00000000-0000-4000-8000-000000000001/progress');
  expect(
    legacyCoursePath('00000000-0000-4000-8000-000000000001', 'grades'),
  ).toBe('/courses/00000000-0000-4000-8000-000000000001/grades');
});

it('returns to course discovery when the legacy course id is malformed', () => {
  expect(legacyCoursePath('//evil.test', 'grades')).toBe('/courses');
});
