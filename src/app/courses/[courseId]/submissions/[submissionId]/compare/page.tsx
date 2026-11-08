import { notFound } from 'next/navigation';
import { requireMember } from '@/lib/auth/verified-user';
import {
  courseIdForStudentSubmission,
  hasStudentAssessmentAccess,
} from '@/features/student-submissions/course-access.server';
import { comparisonSelection } from '@/features/student-submissions/comparison-selection';
import { loadRevisionComparison } from '@/features/student-submissions/revision-comparison.server';
import { RevisionComparisonView } from '@/features/student-submissions/revision-comparison';
import { BreadcrumbSetter } from '@/components/layout/breadcrumb-context';

export default async function CourseCompareRevisionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string; submissionId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ courseId, submissionId }, query] = await Promise.all([
    params,
    searchParams,
  ]);
  const { supabase, user } = await requireMember();
  const actualCourseId = await courseIdForStudentSubmission(
    supabase,
    user.id,
    submissionId,
  );

  if (
    !actualCourseId ||
    actualCourseId !== courseId ||
    !(await hasStudentAssessmentAccess(supabase, user.id, courseId))
  ) {
    notFound();
  }

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

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <BreadcrumbSetter title="Compare Revisions" />
      <RevisionComparisonView comparison={comparison} courseId={courseId} />
    </main>
  );
}
