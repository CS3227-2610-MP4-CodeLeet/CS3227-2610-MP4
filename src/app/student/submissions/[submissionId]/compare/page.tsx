import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth/verified-user';
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
  const { supabase, user } = await requireRole('student');
  const [{ submissionId }, query] = await Promise.all([params, searchParams]);
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
  return <RevisionComparisonView comparison={comparison} />;
}
