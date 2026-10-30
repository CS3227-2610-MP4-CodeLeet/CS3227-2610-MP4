import { describe, expect, it } from 'vitest';
import { getAssignmentTestExamples } from './assignment-practice.server';
import { validateCases } from './practice-tests';

describe('real assignment development examples', () => {
  it.each([
    ['production', 'true'],
    ['test', 'true'],
    [undefined, 'true'],
    ['development', undefined],
    ['development', 'false'],
    ['development', '1'],
  ])('denies mode=%s fixture=%s', (mode, fixtures) => {
    expect(getAssignmentTestExamples(mode, fixtures)).toBeNull();
  });

  it('provides bounded standalone examples only with all development gates', () => {
    const cases = getAssignmentTestExamples('development', 'true');
    expect(cases).toHaveLength(3);
    expect(() => validateCases(cases!)).not.toThrow();
    expect(cases?.map((item) => item.expected_stdout)).toEqual([
      '5\n',
      '0\n',
      '-7\n',
    ]);
    expect(cases?.every((item) => item.id.startsWith('example-sum-'))).toBe(
      true,
    );
  });

  it('returns fresh records so one caller cannot change later examples', () => {
    const first = getAssignmentTestExamples('development', 'true')!;
    first[0].expected_stdout = 'changed';
    expect(
      getAssignmentTestExamples('development', 'true')![0].expected_stdout,
    ).toBe('5\n');
  });
});
