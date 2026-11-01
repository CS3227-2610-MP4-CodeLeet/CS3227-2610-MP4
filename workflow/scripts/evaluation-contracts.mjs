import { z } from 'zod';

const feedbackSchema = z
  .object({
    summary: z.string().trim().min(1).max(2_000),
    strengths: z.array(z.string().trim().min(1).max(500)).max(8),
    nextSteps: z.array(z.string().trim().min(1).max(500)).max(8),
    questions: z.array(z.string().trim().min(1).max(300)).max(8),
  })
  .strict();

const evaluationSchema = z
  .object({
    criteria: z
      .array(
        z
          .object({
            criterionId: z.uuid(),
            suggestedScore: z.number().min(0).max(100),
            feedback: z.string().trim().min(1).max(1_000),
          })
          .strict(),
      )
      .min(1)
      .max(20),
    overallFeedback: z.string().trim().min(1).max(2_000),
    totalScore: z.number().min(0).max(2_000),
  })
  .strict();

const activeMarkup = /<\s*\/?\s*(script|iframe|object|img)\b/i;

export function validateFeedback(value) {
  const parsed = feedbackSchema.safeParse(value);
  if (!parsed.success) return false;
  return ![
    parsed.data.summary,
    ...parsed.data.strengths,
    ...parsed.data.nextSteps,
    ...parsed.data.questions,
  ].some((text) => activeMarkup.test(text));
}

export function validateEvaluation(value, rubric) {
  const parsed = evaluationSchema.safeParse(value);
  if (!parsed.success || parsed.data.criteria.length !== rubric.length)
    return false;
  const rubricById = new Map(rubric.map((item) => [item.id, item]));
  const seen = new Set();
  for (const criterion of parsed.data.criteria) {
    const expected = rubricById.get(criterion.criterionId);
    if (
      !expected ||
      seen.has(criterion.criterionId) ||
      criterion.suggestedScore > expected.maxScore
    )
      return false;
    seen.add(criterion.criterionId);
  }
  const total = parsed.data.criteria.reduce(
    (sum, criterion) => sum + criterion.suggestedScore,
    0,
  );
  const feedback = [
    parsed.data.overallFeedback,
    ...parsed.data.criteria.map((criterion) => criterion.feedback),
  ];
  return (
    Math.abs(total - parsed.data.totalScore) < 0.01 &&
    !feedback.some((text) => activeMarkup.test(text))
  );
}
