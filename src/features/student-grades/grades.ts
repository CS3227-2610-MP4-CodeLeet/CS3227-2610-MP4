import { z } from 'zod';
import { assignmentLanguageSchema } from '@/features/codementor/contracts';
import { assignmentTitle } from '@/features/student-submissions/history';

export const GRADES_PAGE_SIZE = 25;
const submission = z.object({
  language: assignmentLanguageSchema,
  revision: z.number().int().positive(),
  assignments: z.unknown().optional(),
});
const grade = z.object({
  id: z.uuid(),
  submission_id: z.uuid(),
  total_score: z.number().finite().nonnegative().nullable(),
  feedback: z.string().max(4_000),
  published_at: z.iso.datetime({ offset: true }),
  submissions: z.preprocess(
    (value) => (Array.isArray(value) && value.length === 1 ? value[0] : value),
    submission,
  ),
});

export function parseGradeItems(data: unknown) {
  return z
    .array(grade)
    .parse(data)
    .map((row) => ({
      id: row.id,
      submissionId: row.submission_id,
      score: row.total_score,
      feedback: row.feedback,
      publishedAt: row.published_at,
      language: row.submissions.language,
      revision: row.submissions.revision,
      title: assignmentTitle(row.submissions.assignments),
    }));
}

export type GradeItem = ReturnType<typeof parseGradeItems>[number];
export type GradesPage = { rows: GradeItem[]; hasNext: boolean };
