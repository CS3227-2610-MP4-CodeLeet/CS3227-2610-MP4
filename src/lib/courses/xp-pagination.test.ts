import { expect, it } from 'vitest';
import { parseXpRevision } from './xp-pagination';
import { parseCourseActivityQuery } from './activity-query';

const courseId = 'a1691000-0000-4000-8000-000000000001';
const revision = 'a'.repeat(32);
it('accepts only a single bounded revision and permits a missing first-page hint', () => {
  expect(parseXpRevision(undefined)).toEqual({ revision: undefined });
  expect(parseXpRevision(revision)).toEqual({ revision });
  for (const value of [
    '',
    'bad',
    revision.toUpperCase(),
    [revision],
    [revision, revision],
  ])
    expect(parseXpRevision(value)).toBeNull();
});
it('parses API revisions and rejects duplicate or malformed revision parameters', () => {
  expect(
    parseCourseActivityQuery(
      new URLSearchParams({ courseId, page: '2', revision }),
    ),
  ).toEqual({ courseId, page: 2, revision });
  for (const suffix of [
    'revision=bad',
    `revision=${revision}&revision=${revision}`,
  ])
    expect(
      parseCourseActivityQuery(
        new URLSearchParams(`courseId=${courseId}&${suffix}`),
      ),
    ).toBeNull();
});
