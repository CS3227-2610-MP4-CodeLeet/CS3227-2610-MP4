import { z } from 'zod';
import { assignmentLanguageSchema } from '@/features/codementor/contracts';
import { assignmentTitle } from '@/features/student-submissions/history';

export const PROGRESS_LIST_LIMIT = 5;
export type AssignmentProgress = {
  total: number;
  submitted: number;
  outstanding: number;
  overdue: number;
};
export const upcomingAssignmentsSchema = z
  .array(
    z.object({
      id: z.uuid(),
      title: z.string().min(1),
      language: assignmentLanguageSchema,
      due_at: z.iso.datetime({ offset: true }),
    }),
  )
  .max(PROGRESS_LIST_LIMIT);
export type UpcomingAssignment = z.infer<
  typeof upcomingAssignmentsSchema
>[number];

const recentGradeSchema = z.object({
  id: z.uuid(),
  submission_id: z.uuid(),
  total_score: z.number().finite().nonnegative().nullable(),
  published_at: z.iso.datetime({ offset: true }),
  submissions: z.object({
    language: assignmentLanguageSchema,
    revision: z.number().int().positive(),
    assignments: z.unknown(),
  }),
});
export const recentGradesSchema = z
  .array(recentGradeSchema)
  .max(PROGRESS_LIST_LIMIT)
  .transform((rows) =>
    rows.map((row) => ({
      id: row.id,
      submissionId: row.submission_id,
      score: row.total_score,
      publishedAt: row.published_at,
      language: row.submissions.language,
      revision: row.submissions.revision,
      title: assignmentTitle(row.submissions.assignments),
    })),
  );
export type RecentGrade = z.infer<typeof recentGradesSchema>[number];
