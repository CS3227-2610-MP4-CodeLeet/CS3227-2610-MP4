import { isLocalBrowserRunnerEnabled } from '@/features/student-submissions/runner-environment';
import { assignmentLanguageSchema } from '@/features/codementor/contracts';
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
import { getAssignmentTestExamples } from '@/features/student-submissions/assignment-practice.server';
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
      process.env.PLAYWRIGHT_ASSIGNMENT_FIXTURES,
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
    language: assignmentLanguageSchema.parse(assignment.language),
    publication_status: 'published' as const,
  };
  return (
    <div className="space-y-8">
      <AssignmentInstructions assignment={detail} />
      <SubmissionForm
        assignmentId={assignmentId}
        language={detail.language}
        key={assignmentId}
        testExamples={getAssignmentTestExamples(
          process.env.NODE_ENV,
          process.env.STUDENT_TEST_CASE_FIXTURES_ENABLED,
        )}
        browserRunEnabled={isLocalBrowserRunnerEnabled(process.env.NODE_ENV)}
      />
      <SubmissionHistory submissions={submissions ?? []} />
    </div>
  );
}
