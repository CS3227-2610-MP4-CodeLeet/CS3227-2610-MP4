export function validateFeedback(value: unknown): boolean;
export function validateEvaluation(
  value: unknown,
  rubric: Array<{ id: string; maxScore: number }>,
): boolean;
