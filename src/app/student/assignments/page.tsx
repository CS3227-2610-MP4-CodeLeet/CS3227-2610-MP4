import { loadPublishedAssignments } from '@/features/assignment-deadlines/assignments.server';
import { AssignmentList } from '@/features/student-assignments/components';
import {
  listPreviewAssignments,
  requireAssignmentPreview,
} from '@/features/student-assignments/preview.server';
import { isAssignmentPreviewEnabled } from '@/features/student-assignments/selectors';
import { requireRole } from '@/lib/auth/verified-user';
import { notFound } from 'next/navigation';
import {
  matchesListFilters,
  parseListFilters,
  type ListSearchParams,
} from '@/features/student-lists/filters';

export default async function AssignmentListPage({
  searchParams,
}: {
  searchParams: Promise<ListSearchParams>;
}) {
  const params = await searchParams;
  const { preview } = params;
  const filters = parseListFilters(params);
  if (!filters) notFound();
  if (
    isAssignmentPreviewEnabled(
      process.env.NODE_ENV,
      process.env.PLAYWRIGHT_ASSIGNMENT_FIXTURES,
    )
  ) {
    requireAssignmentPreview();
    if (preview === 'error')
      throw new Error('Synthetic assignment preview failure');
    if (preview === 'slow')
      await new Promise((resolve) => setTimeout(resolve, 3000));
    const assignments = listPreviewAssignments();
    return (
      <AssignmentList
        filters={filters}
        assignments={
          preview === 'empty'
            ? []
            : assignments.filter((item) => matchesListFilters(item, filters))
        }
      />
    );
  }
  const { supabase, user } = await requireRole('student');
  const assignments = await loadPublishedAssignments(
    supabase,
    user.id,
    filters,
  );
  if (!assignments)
    throw new Error('Published assignments could not be loaded');
  return (
    <div>
      <AssignmentList assignments={assignments} filters={filters} />
    </div>
  );
}
