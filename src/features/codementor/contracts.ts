import { z } from 'zod';
import { assignmentLanguages } from '@/features/student-assignments/types';

export const assignmentLanguageSchema = z.enum(assignmentLanguages);

const uuid = z.uuid();
const cleanText = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .refine((value) => !value.includes('\0'));

export const assignmentInputSchema = z
  .object({
    title: cleanText(160),
    instructions: cleanText(12_000),
    language: assignmentLanguageSchema.default('python'),
    rubric: z
      .array(
        z
          .object({
            id: uuid,
            title: cleanText(120),
            description: cleanText(1_000),
            maxScore: z.number().int().min(1).max(100),
          })
          .strict(),
      )
      .min(1)
      .max(20),
    publicationStatus: z.enum(['draft', 'published']).default('draft'),
  })
  .strict();

export const submissionInputSchema = z
  .object({
    assignmentId: uuid,
    source: z
      .string()
      .min(1)
      .max(8_000)
      .refine((value) => !value.includes('\0')),
    requestId: uuid,
  })
  .strict();

export const reviewRequestSchema = z.object({ submissionId: uuid }).strict();

export const feedbackSchema = z
  .object({
    summary: z.string().trim().min(1).max(2_000),
    strengths: z.array(z.string().trim().min(1).max(500)).max(8),
    nextSteps: z.array(z.string().trim().min(1).max(500)).max(8),
    questions: z.array(z.string().trim().min(1).max(300)).max(8),
  })
  .strict();

export type ModelFeedback = z.infer<typeof feedbackSchema>;

const evaluationSchema = z
  .object({
    criteria: z
      .array(
        z
          .object({
            criterionId: uuid,
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

export type ModelEvaluation = z.infer<typeof evaluationSchema>;

export function estimatePromptTokens(serializedPrompt: string): number {
  return Math.ceil(new TextEncoder().encode(serializedPrompt).byteLength / 3);
}

export function validateModelFeedback(value: unknown): ModelFeedback | null {
  const parsed = feedbackSchema.safeParse(value);
  if (!parsed.success) return null;
  const strings = [
    parsed.data.summary,
    ...parsed.data.strengths,
    ...parsed.data.nextSteps,
    ...parsed.data.questions,
  ];
  if (
    strings.some((text) => /<\s*\/?\s*(script|iframe|object|img)\b/i.test(text))
  )
    return null;
  return parsed.data;
}

export function validateModelEvaluation(
  value: unknown,
  rubric: readonly { id: string; maxScore: number }[],
): ModelEvaluation | null {
  const parsed = evaluationSchema.safeParse(value);
  if (!parsed.success || parsed.data.criteria.length !== rubric.length)
    return null;
  const byId = new Map(rubric.map((criterion) => [criterion.id, criterion]));
  const seen = new Set<string>();
  for (const criterion of parsed.data.criteria) {
    const expected = byId.get(criterion.criterionId);
    if (
      !expected ||
      seen.has(criterion.criterionId) ||
      criterion.suggestedScore > expected.maxScore
    )
      return null;
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
  if (
    feedback.some((text) =>
      /<\s*\/?\s*(script|iframe|object|img)\b/i.test(text),
    )
  )
    return null;
  return Math.abs(total - parsed.data.totalScore) < 0.01 ? parsed.data : null;
}

export function validateGradeScores(
  scores: Record<string, number>,
  rubric: readonly { id: string; maxScore: number }[],
  totalScore: number,
) {
  const keys = Object.keys(scores);
  if (
    keys.length !== rubric.length ||
    rubric.some((criterion) => !Object.hasOwn(scores, criterion.id))
  )
    return false;
  if (
    Object.values(scores).some((score) => !Number.isFinite(score) || score < 0)
  )
    return false;
  if (rubric.some((criterion) => scores[criterion.id] > criterion.maxScore))
    return false;
  const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
  return Math.abs(total - totalScore) < 0.01;
}
