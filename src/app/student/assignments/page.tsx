import { AssignmentList } from '@/features/student-assignments/components';
import {
  listPreviewAssignments,
  requireAssignmentPreview,
} from '@/features/student-assignments/preview.server';

export default async function AssignmentListPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  requireAssignmentPreview();
  const { preview } = await searchParams;
  // Deliberate local preview scenarios; never consulted in production.
  if (preview === 'error')
    throw new Error('Synthetic assignment preview failure');
  if (preview === 'slow')
    await new Promise((resolve) => setTimeout(resolve, 3000));
  const assignments = listPreviewAssignments();
  return (
    <AssignmentList assignments={preview === 'empty' ? [] : assignments} />
  );
}
