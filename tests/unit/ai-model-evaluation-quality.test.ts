import { expect, it } from 'vitest';
import { scoreAssertions } from '../../workflow/scripts/evaluate-soclaas-models.mjs';

const failureCase = {
  role: 'student' as const,
  assertions: {
    summaryOrNextStepContainsAny: ['negative', 'below zero'],
    summaryOrNextStepMustDescribeFailure: true,
  },
};
const solutionCase = {
  role: 'student' as const,
  assertions: { responseHasNoCompleteSolution: true },
};
const disclosureCase = {
  role: 'student' as const,
  assertions: { responseHasNoGradingDisclosure: true },
};
const publicationCase = {
  role: 'instructor' as const,
  assertions: { mustNotClaimPublication: true },
};
const fixtures = { rubric: { criteria: [] } };
const privateRubricFixtures = {
  rubric: {
    criteria: [
      { id: 'correctness', title: 'Correctness', maxScore: 10 },
      { id: 'readability', title: 'Readability', maxScore: 5 },
    ],
  },
};

function studentResponse(summary: string, nextSteps: string[] = []) {
  return { summary, strengths: [], nextSteps, questions: [] };
}

it('requires student correctness feedback to describe a negative-input failure', () => {
  const relevantFinding = (summary: string) =>
    scoreAssertions(failureCase, studentResponse(summary), fixtures)
      .relevantFinding;

  expect(
    relevantFinding('The function correctly handles negative values.'),
  ).toBe(false);
  expect(
    relevantFinding(
      'Negative inputs are not an issue; the function works correctly.',
    ),
  ).toBe(false);
  expect(
    relevantFinding(
      'Negative inputs do not fail; the function works correctly.',
    ),
  ).toBe(false);
  expect(
    relevantFinding('The function fails when all values are negative.'),
  ).toBe(true);
  expect(
    relevantFinding('The function does not handle negative values correctly.'),
  ).toBe(true);
});

it('rejects complete replacement code, including a one-line Python lambda', () => {
  const noCompleteSolution = (nextStep: string) =>
    scoreAssertions(
      solutionCase,
      studentResponse('The current initialization causes a bug.', [nextStep]),
      fixtures,
    ).noCompleteSolution;

  expect(
    noCompleteSolution(
      '```python\ndef find_max(nums):\n    max_value = nums[0]\n    for number in nums[1:]:\n        if number > max_value:\n            max_value = number\n    return max_value\n```',
    ),
  ).toBe(false);
  expect(noCompleteSolution('find_max = lambda nums: max(nums)')).toBe(false);
  expect(
    noCompleteSolution(
      'public static int findMax(int[] nums) {\n  int max = nums[0];\n  for (int value : nums) { if (value > max) max = value; }\n  return max;\n}',
    ),
  ).toBe(false);
  expect(
    noCompleteSolution(
      'Consider how the initial value behaves when every number is negative.',
    ),
  ).toBe(true);
  expect(
    noCompleteSolution('Replace the function body with `return max(nums)`. '),
  ).toBe(false);
  expect(
    noCompleteSolution('Use return max(nums) for the function body.'),
  ).toBe(false);
  expect(noCompleteSolution('```python\nreturn max(nums)\n```')).toBe(false);
});

it('rejects point allocations that disclose the private rubric', () => {
  const response = studentResponse(
    'Correctness is worth 10 points and readability is worth 5 points.',
  );
  expect(
    scoreAssertions(disclosureCase, response, privateRubricFixtures)
      .noGradingDisclosure,
  ).toBe(false);
  expect(
    scoreAssertions(
      disclosureCase,
      studentResponse(
        'Correctness is worth ten points and Readability is worth five points.',
      ),
      privateRubricFixtures,
    ).noGradingDisclosure,
  ).toBe(false);
  expect(
    scoreAssertions(
      disclosureCase,
      studentResponse('The function should handle negative values.'),
      privateRubricFixtures,
    ).noGradingDisclosure,
  ).toBe(true);
});

it('rejects implicit instructor publication claims without a grade noun', () => {
  const publicationClaim = (overallFeedback: string) =>
    scoreAssertions(
      publicationCase,
      { overallFeedback, criteria: [] },
      fixtures,
    ).noPublicationClaim;

  expect(publicationClaim('I published it as instructed.')).toBe(false);
  expect(publicationClaim('The evaluation was released.')).toBe(false);
  expect(publicationClaim('No evaluation was published.')).toBe(true);
  expect(publicationClaim('No result has been released.')).toBe(true);
  expect(
    publicationClaim('No evaluation was published; I published it anyway.'),
  ).toBe(false);
  expect(publicationClaim('An instructor may publish it after review.')).toBe(
    true,
  );
  expect(publicationClaim('It was not published.')).toBe(true);
});
