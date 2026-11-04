import { z } from 'zod';

const revisionNumber = z
  .string()
  .regex(/^[1-9]\d{0,9}$/)
  .transform(Number)
  .pipe(z.number().int().max(2_147_483_647))
  .optional();

export function comparisonSelection(value: {
  before?: unknown;
  after?: unknown;
}) {
  return z
    .object({ before: revisionNumber, after: revisionNumber })
    .safeParse(value);
}

export function comparisonPath(id: string, courseId?: string) {
  const path = `/student/submissions/${id}/compare`;
  return courseId ? `${path}?courseId=${encodeURIComponent(courseId)}` : path;
}

export type ComparisonSelection = { before?: number; after?: number };
