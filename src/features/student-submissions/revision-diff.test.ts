import { expect, it } from 'vitest';
import { compareLines } from './revision-diff';
import { comparisonSelection } from './comparison-selection';

it.each(['0', '-1', '1.5', '01', '1e2', '', '2147483648', ['1'], ['1', '2']])(
  'rejects invalid revision selections %j',
  (value) => expect(comparisonSelection({ before: value }).success).toBe(false),
);

it('accepts optional, equal and reversed bounded revision numbers', () => {
  expect(comparisonSelection({})).toEqual({ success: true, data: {} });
  expect(comparisonSelection({ before: '2147483647', after: '1' })).toEqual({
    success: true,
    data: { before: 2147483647, after: 1 },
  });
});

it('numbers both sides of a replacement without losing indentation', () => {
  expect(compareLines('start\n  old\nend', 'start\n\tnew\nend')).toEqual([
    { kind: 'unchanged', text: 'start', before: 1, after: 1 },
    { kind: 'removed', text: '  old', before: 2, after: null },
    { kind: 'added', text: '\tnew', before: null, after: 2 },
    { kind: 'unchanged', text: 'end', before: 3, after: 3 },
  ]);
});

it('retains a final newline and treats line-ending styles alike', () => {
  expect(compareLines('x', 'x\n').map((row) => row.kind)).toEqual([
    'unchanged',
    'added',
  ]);
  expect(
    compareLines('a\r\nb\r', 'a\nb\n').every((row) => row.kind === 'unchanged'),
  ).toBe(true);
});

it('preserves repeated, blank, Unicode and markup lines as literal text', () => {
  const before = '\nπ\nrepeat\nrepeat\n<img onerror="alert(1)">';
  const after = '\nπ\nrepeat\nnew\nrepeat\n<img onerror="alert(1)">';
  const rows = compareLines(before, after);
  expect(
    rows.filter((row) => row.kind === 'added').map((row) => row.text),
  ).toEqual(['new']);
  expect(
    rows
      .filter((row) => row.kind !== 'added')
      .map((row) => row.text)
      .join('\n'),
  ).toBe(before);
  expect(
    rows
      .filter((row) => row.kind !== 'removed')
      .map((row) => row.text)
      .join('\n'),
  ).toBe(after);
});

it('reconstructs both sides of bounded worst-case inputs', () => {
  const before = 'a\n'.repeat(4000);
  const after = 'b\n'.repeat(4000);
  const rows = compareLines(before, after);
  expect(
    rows
      .filter((row) => row.kind !== 'added')
      .map((row) => row.text)
      .join('\n'),
  ).toBe(before);
  expect(
    rows
      .filter((row) => row.kind !== 'removed')
      .map((row) => row.text)
      .join('\n'),
  ).toBe(after);
  expect(rows.length).toBe(8001);
});

it.each([
  ['', ''],
  ['a\nb', 'a\nb'],
  ['a', ''],
  ['', 'a'],
])(
  'preserves sources for empty, equal and reversed comparisons',
  (before, after) => {
    const rows = compareLines(before, after);
    expect(
      rows
        .filter((row) => row.kind !== 'added')
        .map((row) => row.text)
        .join('\n'),
    ).toBe(before);
    expect(
      rows
        .filter((row) => row.kind !== 'removed')
        .map((row) => row.text)
        .join('\n'),
    ).toBe(after);
  },
);
