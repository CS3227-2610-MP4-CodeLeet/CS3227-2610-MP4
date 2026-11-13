import { expect, it } from 'vitest';
import { parseHistoryCursor, parseHistoryNavigation } from './history-cursor';

const id = '00000000-0000-4000-8000-000000000025';
const time = '2026-11-12T04:00:00.123456+00:00';
const cursor = `${time}|${id}`;

it('preserves microseconds and validates UUIDs before query interpolation', () => {
  expect(parseHistoryCursor(cursor)).toEqual({ submittedAt: time, id });
});

it.each([
  '',
  'bad',
  `${time}|not-a-uuid`,
  `2026-02-30T00:00:00Z|${id}`,
  `${time}|${id}|extra`,
  `2026-11-12T00:00:00Z),id.gt.0|${id}`,
  [cursor],
  `${'a'.repeat(1000)}|${id}`,
])('rejects malformed cursor %j', (input) => {
  expect(parseHistoryCursor(input)).toBeNull();
});

it('parses both directions and returns legacy page-only URLs to the first page', () => {
  expect(parseHistoryNavigation({ page: '2', after: cursor })).toEqual({
    page: 2,
    cursor: { submittedAt: time, id },
    backwards: false,
    legacy: false,
  });
  expect(parseHistoryNavigation({ before: cursor })).toEqual({
    page: 1,
    cursor: { submittedAt: time, id },
    backwards: true,
    legacy: false,
  });
  expect(parseHistoryNavigation({ page: '10000' })).toEqual({
    page: 1,
    cursor: null,
    backwards: false,
    legacy: true,
  });
});

it.each([
  { page: '0' },
  { page: ['2'] },
  { after: cursor },
  { page: '2', after: cursor, before: cursor },
  { page: '2', after: [cursor, cursor] },
  { before: '' },
])('fails closed for invalid navigation %j', (input) => {
  expect(parseHistoryNavigation(input)).toBeNull();
});
