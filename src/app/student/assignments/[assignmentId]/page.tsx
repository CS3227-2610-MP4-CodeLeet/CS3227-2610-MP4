import { notFound } from 'next/navigation';
import { AssignmentInstructions } from '@/features/student-assignments/components';
import {
  getPreviewAssignment,
  getPreviewPracticeCases,
} from '@/features/student-assignments/preview.server';
import { CodeEntry } from '@/features/student-submissions/code-entry';
import { isAssignmentPreviewEnabled } from '@/features/student-assignments/selectors';
import { requireRole } from '@/lib/auth/verified-user';
import { SubmissionForm } from '@/features/codementor/submission-form';
import Link from 'next/link';

type SubmissionSummary = { id: string; revision: number; created_at: string };

function SubmissionHistory({
  submissions,
}: {
  submissions: SubmissionSummary[];
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Your revisions</h2>
      {!submissions.length ? (
        <p className="text-sm text-muted-foreground">No submissions yet.</p>
      ) : (
        <ol className="space-y-2">
          {submissions.map((submission) => (
            <li
              key={submission.id}
              className="flex justify-between rounded-lg border p-3 text-sm"
            >
              <Link
                className="underline"
                href={`/student/submissions/${submission.id}`}
              >
                Revision {submission.revision}
              </Link>
              <time dateTime={submission.created_at}>
                {new Date(submission.created_at).toLocaleString()}
              </time>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId } = await params;
  if (
    isAssignmentPreviewEnabled(
      process.env.NODE_ENV,
      process.env.STUDENT_PREVIEW_ENABLED,
    )
  ) {
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
  const { supabase, user } = await requireRole('student');
  const { data: assignment, error } = await supabase
    .from('assignments')
    .select('id,title,instructions,language,publication_status')
    .eq('id', assignmentId)
    .eq('publication_status', 'published')
    .maybeSingle();
  if (error || !assignment) notFound();
  const { data: submissions } = await supabase
    .from('submissions')
    .select('id,revision,created_at')
    .eq('assignment_id', assignmentId)
    .eq('student_id', user.id)
    .order('revision', { ascending: false });
  const detail = {
    ...assignment,
    language: 'python' as const,
    publication_status: 'published' as const,
  };
  return (
    <main className="mx-auto max-w-5xl space-y-8 px-6 py-10">
      <AssignmentInstructions assignment={detail} />
      <SubmissionForm assignmentId={assignmentId} />
      <SubmissionHistory submissions={submissions ?? []} />
    </main>
  );
}
