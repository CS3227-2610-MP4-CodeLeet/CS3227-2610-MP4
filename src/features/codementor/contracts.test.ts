import { expect, it } from 'vitest';
import {
  assignmentInputSchema,
  reviewRequestSchema,
  submissionInputSchema,
  estimatePromptTokens,
  validateModelFeedback,
  validateModelEvaluation,
  validateGradeScores,
} from './contracts';

it('rejects assignment fields outside the published contract', () => {
  expect(
    assignmentInputSchema.safeParse({
      title: 'Loops',
      instructions: 'Practice loops',
      rubric: 'secret',
    }).success,
  ).toBe(false);
});

it('accepts Python source through 8,000 characters and rejects larger or NUL input', () => {
  expect(
    submissionInputSchema.safeParse({
      assignmentId: crypto.randomUUID(),
      source: 'a'.repeat(8_000),
      requestId: crypto.randomUUID(),
    }).success,
  ).toBe(true);
  expect(
    submissionInputSchema.safeParse({
      assignmentId: crypto.randomUUID(),
      source: 'a'.repeat(8_001),
      requestId: crypto.randomUUID(),
    }).success,
  ).toBe(false);
  expect(
    submissionInputSchema.safeParse({
      assignmentId: crypto.randomUUID(),
      source: 'print("\0")',
      requestId: crypto.randomUUID(),
    }).success,
  ).toBe(false);
});

it('accepts only a submission identifier for review requests', () => {
  expect(
    reviewRequestSchema.safeParse({ submissionId: crypto.randomUUID() })
      .success,
  ).toBe(true);
  expect(
    reviewRequestSchema.safeParse({
      submissionId: crypto.randomUUID(),
      source: 'forged',
    }).success,
  ).toBe(false);
});

it('estimates prompt budget from UTF-8 bytes conservatively', () => {
  expect(estimatePromptTokens('abc')).toBe(1);
  expect(estimatePromptTokens('🙂')).toBe(2);
});

it('rejects malformed or unsafe feedback and bounds model output', () => {
  expect(
    validateModelFeedback({
      summary: 'Good',
      strengths: ['Clear'],
      nextSteps: ['Test'],
      questions: [],
    }),
  ).not.toBeNull();
  expect(
    validateModelFeedback({
      summary: '<script>alert(1)</script>',
      strengths: [],
      nextSteps: [],
      questions: [],
    }),
  ).toBeNull();
  expect(
    validateModelFeedback({
      summary: 'x'.repeat(2_001),
      strengths: [],
      nextSteps: [],
      questions: [],
    }),
  ).toBeNull();
});

it('accepts evaluation with exact rubric criteria and a reconciled total', () => {
  const rubric = [
    {
      id: crypto.randomUUID(),
      title: 'Correctness',
      description: 'Works',
      maxScore: 10,
    },
  ];
  const evaluation = {
    criteria: [
      { criterionId: rubric[0].id, suggestedScore: 8, feedback: 'Good' },
    ],
    overallFeedback: 'Nice work',
    totalScore: 8,
  };
  expect(validateModelEvaluation(evaluation, rubric)).not.toBeNull();
});

it('rejects incomplete criteria, out-of-range scores, and mismatched totals', () => {
  const rubric = [
    {
      id: crypto.randomUUID(),
      title: 'Correctness',
      description: 'Works',
      maxScore: 10,
    },
  ];
  expect(
    validateModelEvaluation(
      { criteria: [], overallFeedback: 'Nice work', totalScore: 8 },
      rubric,
    ),
  ).toBeNull();
  expect(
    validateModelEvaluation(
      {
        criteria: [
          { criterionId: rubric[0].id, suggestedScore: 11, feedback: 'Good' },
        ],
        overallFeedback: 'Nice work',
        totalScore: 11,
      },
      rubric,
    ),
  ).toBeNull();
  expect(
    validateModelEvaluation(
      {
        criteria: [
          { criterionId: rubric[0].id, suggestedScore: 8, feedback: 'Good' },
        ],
        overallFeedback: 'Nice work',
        totalScore: 9,
      },
      rubric,
    ),
  ).toBeNull();
});

it('rejects markup in model-provided evaluation feedback', () => {
  const rubric = [
    {
      id: crypto.randomUUID(),
      title: 'Correctness',
      description: 'Works',
      maxScore: 10,
    },
  ];
  expect(
    validateModelEvaluation(
      {
        criteria: [
          {
            criterionId: rubric[0].id,
            suggestedScore: 8,
            feedback: '<img src=x>',
          },
        ],
        overallFeedback: 'Nice work',
        totalScore: 8,
      },
      rubric,
    ),
  ).toBeNull();
});

it('validates instructor grade scores against every private criterion', () => {
  const rubric = [
    {
      id: crypto.randomUUID(),
      title: 'Correctness',
      description: 'Works',
      maxScore: 10,
    },
  ];
  expect(validateGradeScores({ [rubric[0].id]: 8 }, rubric, 8)).toBe(true);
  expect(validateGradeScores({}, rubric, 0)).toBe(false);
  expect(validateGradeScores({ [rubric[0].id]: 11 }, rubric, 11)).toBe(false);
  expect(validateGradeScores({ [rubric[0].id]: 8, extra: 1 }, rubric, 9)).toBe(
    false,
  );
});
