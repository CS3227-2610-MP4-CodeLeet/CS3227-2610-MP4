import { expect, it } from 'vitest';
import {
  buildListUrl,
  matchesListFilters,
  parseListFilters,
  titleSearchPattern,
} from './filters';

const historyPath = '/student/submissions';

it('normalizes blank filters, bounds title input and ignores identity fields', () => {
  expect(parseListFilters({})).toEqual({ q: '', language: '' });
  expect(
    parseListFilters({ q: '  Loops  ', language: 'java', student_id: 'peer' }),
  ).toEqual({ q: 'Loops', language: 'java' });
  expect(parseListFilters({ q: ' '.repeat(3), language: '' })).toEqual({
    q: '',
    language: '',
  });
  expect(parseListFilters({ q: 'a'.repeat(160) })?.q).toHaveLength(160);
});

it.each([
  { q: ['a', 'b'] },
  { language: ['java'] },
  { q: 'a'.repeat(161) },
  { language: 'javascript' },
  { language: 'JAVA' },
  { q: 'a\0b' },
  { q: 'a\nb' },
  { q: 'a\n' },
])('rejects invalid filters %j', (input) => {
  expect(parseListFilters(input)).toBeNull();
});

it('treats regex and wildcard punctuation as literal title text', () => {
  expect(titleSearchPattern('100% _ * [x] (a|b) \\')).toBe(
    '100% _ \\* \\[x\\] \\(a\\|b\\) \\\\',
  );
  const filters = { q: '[x]', language: 'python' as const };
  expect(
    matchesListFilters({ title: 'Loops [X]', language: 'python' }, filters),
  ).toBe(true);
  expect(
    matchesListFilters({ title: 'Loops x', language: 'python' }, filters),
  ).toBe(false);
  expect(
    matchesListFilters({ title: 'Loops [x]', language: 'java' }, filters),
  ).toBe(false);
});

it('preserves encoded filters across pages and omits page one on apply/reset', () => {
  expect(buildListUrl(historyPath, { q: 'A&B [x]', language: 'java' }, 2)).toBe(
    '/student/submissions?q=A%26B+%5Bx%5D&language=java&page=2',
  );
  expect(buildListUrl(historyPath, { q: '', language: '' }, 1)).toBe(
    historyPath,
  );
  expect(buildListUrl(historyPath, { q: 'Loops', language: '' })).toBe(
    '/student/submissions?q=Loops',
  );
});
