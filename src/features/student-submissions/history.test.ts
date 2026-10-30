import { expect, it } from 'vitest';
import {
  assignmentTitle,
  parseHistoryPage,
  parseHistoryItems,
} from './history';

it.each([
  [undefined, 1],
  ['2', 2],
  ['10000', 10000],
  ['0', null],
  ['-1', null],
  ['1.5', null],
  ['10001', null],
  ['abc', null],
  [['2'], null],
])('validates history page %j', (input, expected) => {
  expect(parseHistoryPage(input as string | string[] | undefined)).toBe(
    expected,
  );
});

it('accepts object/array title joins and keeps hidden metadata neutral', () => {
  expect(assignmentTitle({ title: 'Java loops' })).toBe('Java loops');
  expect(assignmentTitle([{ title: 'Python loops' }])).toBe('Python loops');
  for (const value of [null, undefined, [], { title: '' }])
    expect(assignmentTitle(value)).toBe('Assignment unavailable');
});

it('projects validated metadata without source or grading fields', () => {
  const rows = parseHistoryItems([
    {
      id: crypto.randomUUID(),
      assignment_id: crypto.randomUUID(),
      language: 'java',
      revision: 2,
      created_at: '2026-10-30T04:00:00+00:00',
      assignments: { title: '<img src=x>' },
      source: 'private code',
      grades: 'private grade',
    },
  ]);
  expect(rows[0]).toMatchObject({
    language: 'java',
    revision: 2,
    title: '<img src=x>',
  });
  expect(rows[0]).not.toHaveProperty('source');
  expect(rows[0]).not.toHaveProperty('grades');
  expect(() => parseHistoryItems([{ language: 'javascript' }])).toThrow();
});
