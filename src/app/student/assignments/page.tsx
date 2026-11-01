import { assignmentLanguageSchema } from '@/features/codementor/contracts';
import { AssignmentList } from '@/features/student-assignments/components';
import {
  listPreviewAssignments,
  requireAssignmentPreview,
} from '@/features/student-assignments/preview.server';
import { isAssignmentPreviewEnabled } from '@/features/student-assignments/selectors';
import { requireRole } from '@/lib/auth/verified-user';
import type { AssignmentSummary } from '@/features/student-assignments/types';
import { notFound } from 'next/navigation';
import {
  matchesListFilters,
  parseListFilters,
  titleSearchPattern,
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
  const { supabase } = await requireRole('student');
  let query = supabase
    .from('assignments')
    .select('id,title,language,publication_status')
    .eq('publication_status', 'published');
  if (filters.language) query = query.eq('language', filters.language);
  if (filters.q)
    query = query.filter('title', 'imatch', titleSearchPattern(filters.q));
  const { data, error } = await query
    .order('created_at', { ascending: false })
    .order('id', { ascending: false });
  if (error) throw new Error('Published assignments could not be loaded');
  const assignments = (data ?? []).map((item) => ({
    ...item,
    language: assignmentLanguageSchema.parse(item.language),
    publication_status: 'published' as const,
  })) as AssignmentSummary[];
  return (
    <div>
      <AssignmentList assignments={assignments} filters={filters} />
    </div>
  );
}
