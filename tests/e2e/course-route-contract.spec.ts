import { expect, test } from '@playwright/test';
import { coursePath } from './helpers/history-fixtures';

test('course fixture routes use the canonical workspace and preserve filters', () => {
  const fixture = { courseId: '10000000-0000-4000-8000-000000000001' };
  expect(coursePath(fixture, '/progress')).toBe(
    `/courses/${fixture.courseId}/progress`,
  );
  expect(coursePath(fixture, '/submissions?page=2&language=java')).toBe(
    `/courses/${fixture.courseId}/submissions?page=2&language=java`,
  );
  expect(
    coursePath(fixture, '/assignments/example?fromRevision=revision'),
  ).toBe(
    `/courses/${fixture.courseId}/assignments/example?fromRevision=revision`,
  );
});
