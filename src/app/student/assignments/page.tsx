import { AssignmentList } from '@/features/student-assignments/components';
import {
  listPreviewAssignments,
  requireAssignmentPreview,
} from '@/features/student-assignments/preview.server';
import { isAssignmentPreviewEnabled } from '@/features/student-assignments/selectors';
import { requireMember } from '@/lib/auth/verified-user';
import { notFound, redirect } from 'next/navigation';
import {
  matchesListFilters,
  parseListFilters,
  type ListSearchParams,
} from '@/features/student-lists/filters';

// eslint-disable-next-line complexity -- preview mode and authenticated course mode intentionally remain separate.
export default async function AssignmentListPage({
  searchParams,
}: {
  searchParams: Promise<ListSearchParams>;
}) {
  const params = await searchParams;
  const courseId = typeof params.courseId === 'string' ? params.courseId : '';
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
  await requireMember();
  if (!courseId) redirect('/courses');

  // Redirect legacy query-string course routes to canonical path
  const search = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (key !== 'courseId' && typeof val === 'string') {
      search.set(key, val);
    }
  }
  const queryStr = search.toString();
  redirect(
    `/courses/${encodeURIComponent(courseId)}/assignments${queryStr ? `?${queryStr}` : ''}`,
  );
}
