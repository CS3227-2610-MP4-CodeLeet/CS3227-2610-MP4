import { resolveBrowserRunnerOrigin } from '@/features/student-submissions/runner-environment';
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
import { loadRevisionDraft } from '@/features/student-submissions/revision-draft.server';
import {
  revisionSelection,
  revisionEditorPath,
} from '@/features/student-submissions/revision-selection';

type SubmissionSummary = { id: string; revision: number; created_at: string };

function SubmissionHistory({
  submissions,
  assignmentId,
}: {
  submissions: SubmissionSummary[];
  assignmentId: string;
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
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm"
            >
              <Link
                className="underline"
                href={`/student/submissions/${submission.id}`}
              >
                Revision {submission.revision}
              </Link>
              <Link
                className="underline"
                aria-label={`Continue editing revision ${submission.revision}`}
                href={revisionEditorPath(assignmentId, submission.id)}
              >
                Continue editing
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
  searchParams,
}: {
  params: Promise<{ assignmentId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { assignmentId } = await params;
  const selection = revisionSelection((await searchParams).fromRevision);
  if (!selection.success) notFound();
  if (
    isAssignmentPreviewEnabled(
      process.env.NODE_ENV,
      process.env.PLAYWRIGHT_ASSIGNMENT_FIXTURES,
    )
  ) {
    return (
      <PreviewAssignment
        assignmentId={assignmentId}
        revisionId={selection.data}
      />
    );
  }
  const { detail, draft, submissions } = await loadWorkspace(
    assignmentId,
    selection.data,
  );
  return (
    <div className="space-y-8">
      <AssignmentInstructions assignment={detail} />
      <SubmissionForm
        assignmentId={assignmentId}
        language={detail.language}
        key={`${assignmentId}:${draft?.id ?? 'blank'}`}
        initialSource={draft?.source}
        editingRevision={draft?.revision}
        testExamples={getAssignmentTestExamples(
          process.env.NODE_ENV,
          process.env.STUDENT_TEST_CASE_FIXTURES_ENABLED,
        )}
        browserRunnerOrigin={resolveBrowserRunnerOrigin(process.env)}
      />
      <SubmissionHistory
        assignmentId={assignmentId}
        submissions={submissions ?? []}
      />
    </div>
  );
}

function PreviewAssignment({
  assignmentId,
  revisionId,
}: {
  assignmentId: string;
  revisionId?: string;
}) {
  if (revisionId) notFound();
  const assignment = getPreviewAssignment(assignmentId);
  if (!assignment) notFound();
  return (
    <div className="space-y-8">
      <AssignmentInstructions assignment={assignment} />
      <CodeEntry
        key={assignment.id}
        language={assignment.language}
        practiceCases={getPreviewPracticeCases(assignment.id)}
        runnerOrigin={resolveBrowserRunnerOrigin(process.env)}
      />
    </div>
  );
}

async function loadWorkspace(assignmentId: string, revisionId?: string) {
  const { supabase, user } = await requireRole('student');
  const { data: assignment, error } = await supabase
    .from('assignments')
    .select('id,title,instructions,language,publication_status')
    .eq('id', assignmentId)
    .eq('publication_status', 'published')
    .maybeSingle();
  if (error || !assignment) notFound();
  const language = assignmentLanguageSchema.parse(assignment.language);
  const draft = revisionId
    ? await loadRevisionDraft(supabase, {
        studentId: user.id,
        assignmentId,
        language,
        revisionId,
      })
    : null;
  if (revisionId && !draft) notFound();
  const { data: submissions } = await supabase
    .from('submissions')
    .select('id,revision,created_at')
    .eq('assignment_id', assignmentId)
    .eq('student_id', user.id)
    .order('revision', { ascending: false });
  const detail = {
    ...assignment,
    language,
    publication_status: 'published' as const,
  };
  return { detail, draft, submissions };
}
