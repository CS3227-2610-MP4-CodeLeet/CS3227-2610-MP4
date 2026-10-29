import { assignmentLanguageSchema } from '@/features/codementor/contracts';
import { AssignmentList } from '@/features/student-assignments/components';
import {
  listPreviewAssignments,
  requireAssignmentPreview,
} from '@/features/student-assignments/preview.server';
import { isAssignmentPreviewEnabled } from '@/features/student-assignments/selectors';
import { requireRole } from '@/lib/auth/verified-user';
import type { AssignmentSummary } from '@/features/student-assignments/types';

export default async function AssignmentListPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const { preview } = await searchParams;
  if (
    isAssignmentPreviewEnabled(
      process.env.NODE_ENV,
      process.env.STUDENT_PREVIEW_ENABLED,
    )
  ) {
    requireAssignmentPreview();
    if (preview === 'error')
      throw new Error('Synthetic assignment preview failure');
    if (preview === 'slow')
      await new Promise((resolve) => setTimeout(resolve, 3000));
    const assignments = listPreviewAssignments();
    return (
      <AssignmentList assignments={preview === 'empty' ? [] : assignments} />
    );
  }
  const { supabase } = await requireRole('student');
  const { data, error } = await supabase
    .from('assignments')
    .select('id,title,language,publication_status')
    .eq('publication_status', 'published')
    .order('created_at', { ascending: false });
  if (error) throw new Error('Published assignments could not be loaded');
  const assignments = (data ?? []).map((item) => ({
    ...item,
    language: assignmentLanguageSchema.parse(item.language),
    publication_status: 'published' as const,
  })) as AssignmentSummary[];
  return (
    <div>
      <AssignmentList assignments={assignments} />
    </div>
  );
}
