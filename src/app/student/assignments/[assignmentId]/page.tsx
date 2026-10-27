import { notFound } from 'next/navigation';
import { AssignmentInstructions } from '@/features/student-assignments/components';
import {
  getPreviewAssignment,
  getPreviewPracticeCases,
} from '@/features/student-assignments/preview.server';
import { CodeEntry } from '@/features/student-submissions/code-entry';

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId } = await params;
  const assignment = getPreviewAssignment(assignmentId);
  if (!assignment) notFound();
  return (
    <div className="space-y-8">
      <AssignmentInstructions assignment={assignment} />
      <CodeEntry
        key={assignment.id}
        language={assignment.language}
        practiceCases={getPreviewPracticeCases(assignment.id)}
      />
    </div>
  );
}
