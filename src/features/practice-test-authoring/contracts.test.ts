import { expect, it } from 'vitest';
import { caseSetSchema, ownerSetSchema, publicSetSchema } from './contracts';

const item = {
  id: 'b1000000-0000-4000-8000-000000000001',
  name: 'Example',
  stdin: ' 2 3\r\n',
  expected_stdout: '5\n',
  is_public: true,
};
it('uses Unicode code-point name limits and rejects nonstandard UUID bits or whitespace-only names', () => {
  expect(
    caseSetSchema.safeParse([{ ...item, name: '😀'.repeat(120) }]).success,
  ).toBe(true);
  for (const entry of [
    { ...item, name: '😀'.repeat(121) },
    { ...item, name: '\u2003' },
    { ...item, id: 'b3000000-0000-0000-0000-000000000001' },
  ])
    expect(caseSetSchema.safeParse([entry]).success).toBe(false);
});

it('preserves literal whitespace and permits empty stdin/output', () => {
  expect(caseSetSchema.parse([item])[0]).toEqual(item);
  expect(
    caseSetSchema.parse([{ ...item, stdin: '', expected_stdout: '' }]),
  ).toHaveLength(1);
});
it('accepts exact UTF-8 bounds and rejects one byte over', () => {
  expect(
    caseSetSchema.safeParse([
      {
        ...item,
        stdin: 'é'.repeat(2048),
        expected_stdout: '😀'.repeat(2048),
      },
    ]).success,
  ).toBe(true);
  expect(
    caseSetSchema.safeParse([{ ...item, stdin: 'é'.repeat(2048) + 'a' }])
      .success,
  ).toBe(false);
  expect(
    caseSetSchema.safeParse([
      { ...item, expected_stdout: '😀'.repeat(2048) + 'a' },
    ]).success,
  ).toBe(false);
});
it('rejects duplicate IDs, unknown fields, blank names, NUL and lone surrogates', () => {
  for (const cases of [
    [item, item],
    [{ ...item, secret: true }],
    [{ ...item, name: ' ' }],
    [{ ...item, stdin: '\0' }],
    [{ ...item, expected_stdout: '\ud800' }],
  ])
    expect(caseSetSchema.safeParse(cases).success).toBe(false);
});
it('bounds count, name and IDs', () => {
  const makeCases = (count: number) =>
    Array.from({ length: count }, (_, i) => ({
      ...item,
      id: `b1000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
    }));
  expect(caseSetSchema.safeParse(makeCases(25)).success).toBe(true);
  expect(caseSetSchema.safeParse(makeCases(26)).success).toBe(false);
  expect(
    caseSetSchema.safeParse([{ ...item, name: 'a'.repeat(121) }]).success,
  ).toBe(false);
  expect(caseSetSchema.safeParse([{ ...item, id: 'fake' }]).success).toBe(
    false,
  );
});
it('supports is_public flag defaulting to true', () => {
  const parsed = caseSetSchema.parse([
    { ...item, is_public: false },
    { ...item, id: 'b1000000-0000-4000-8000-000000000002' },
  ]);
  expect(parsed[0].is_public).toBe(false);
  expect(parsed[1].is_public).toBe(true);
});
it('validates the public projection without leaking draft fields', () => {
  const data = {
    assignment_id: item.id,
    assignment_revision: 1,
    test_set_revision: 0,
    cases: [],
  };
  expect(publicSetSchema.parse(data)).toEqual(data);
  expect(
    publicSetSchema.safeParse({ ...data, draft_cases: [item] }).success,
  ).toBe(false);
});

it('validates the owner test set contract with version and publication timestamps', () => {
  const ownerData = {
    assignment_id: item.id,
    title: 'Assignment Title',
    language: 'python',
    version: 2,
    cases: [item],
    published_revision: 1,
    published_at: '2026-11-08T12:00:00Z',
  };
  expect(ownerSetSchema.parse(ownerData)).toEqual(ownerData);
  expect(
    ownerSetSchema.safeParse({ ...ownerData, unexpected_field: true }).success,
  ).toBe(false);
});
