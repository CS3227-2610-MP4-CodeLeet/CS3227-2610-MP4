import { notFound } from 'next/navigation';
import { AssignmentInstructions } from '@/features/student-assignments/components';
import { getPreviewAssignment } from '@/features/student-assignments/preview.server';

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId } = await params;
  const assignment = getPreviewAssignment(assignmentId);
  if (!assignment) notFound();
  return <AssignmentInstructions assignment={assignment} />;
}
