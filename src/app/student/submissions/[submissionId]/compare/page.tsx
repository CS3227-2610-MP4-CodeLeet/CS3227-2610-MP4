import { notFound } from 'next/navigation';
import { requireMember } from '@/lib/auth/verified-user';
import {
  courseIdForStudentSubmission,
  hasStudentAssessmentAccess,
} from '@/features/student-submissions/course-access.server';
import { comparisonSelection } from '@/features/student-submissions/comparison-selection';
import { loadRevisionComparison } from '@/features/student-submissions/revision-comparison.server';
import { RevisionComparisonView } from '@/features/student-submissions/revision-comparison';

export default async function CompareRevisionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ submissionId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ submissionId }, query] = await Promise.all([params, searchParams]);
  const { supabase, user } = await requireMember();
  const courseId = await courseIdForStudentSubmission(
    supabase,
    user.id,
    submissionId,
  );
  const requestedCourseId =
    typeof query.courseId === 'string' ? query.courseId : undefined;
  if (
    !courseId ||
    (requestedCourseId && requestedCourseId !== courseId) ||
    !(await hasStudentAssessmentAccess(supabase, user.id, courseId))
  )
    notFound();
  const selection = comparisonSelection({
    before: query.before,
    after: query.after,
  });
  if (!selection.success) notFound();
  const comparison = await loadRevisionComparison(
    supabase,
    user.id,
    submissionId,
    selection.data,
  );
  if (!comparison) notFound();
  return <RevisionComparisonView comparison={comparison} courseId={courseId} />;
}
