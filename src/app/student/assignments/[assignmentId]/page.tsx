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
import { requireMember } from '@/lib/auth/verified-user';
import { readCourseAccess } from '@/lib/courses/access';
import { SubmissionForm } from '@/features/codementor/submission-form';
import { getAssignmentTestExamples } from '@/features/student-submissions/assignment-practice.server';
import Link from 'next/link';
import { submissionStatus } from '@/features/assignment-deadlines/deadlines';
import { SubmissionTiming } from '@/features/assignment-deadlines/components';
import { loadRevisionDraft } from '@/features/student-submissions/revision-draft.server';
import {
  revisionSelection,
  revisionEditorPath,
} from '@/features/student-submissions/revision-selection';

type SubmissionSummary = {
  id: string;
  revision: number;
  created_at: string;
  is_late: boolean;
  due_at_submission: string | null;
};

function SubmissionHistory({
  submissions,
  assignmentId,
  courseId,
}: {
  submissions: SubmissionSummary[];
  assignmentId: string;
  courseId: string;
}) {
  const courseQuery = `?courseId=${encodeURIComponent(courseId)}`;
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
                href={`/student/submissions/${submission.id}${courseQuery}`}
              >
                Revision {submission.revision}
              </Link>
              <Link
                className="underline"
                aria-label={`Continue editing revision ${submission.revision}`}
                href={revisionEditorPath(assignmentId, submission.id, courseId)}
              >
                Continue editing
              </Link>
              <time dateTime={submission.created_at}>
                {new Date(submission.created_at).toLocaleString()}
              </time>
              <SubmissionTiming
                isLate={submission.is_late}
                dueAt={submission.due_at_submission}
              />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

// eslint-disable-next-line complexity -- preview and verified course paths have distinct safe rendering behavior.
export default async function AssignmentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ assignmentId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { assignmentId } = await params;
  const query = await searchParams;
  const requestedCourseId =
    typeof query.courseId === 'string' ? query.courseId : undefined;
  const selection = revisionSelection(query.fromRevision);
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
  const { detail, courseId, draft, submissions, studentId, archived } =
    await loadWorkspace(assignmentId, selection.data, requestedCourseId);
  return (
    <div className="space-y-8">
      <AssignmentInstructions assignment={detail} courseId={courseId} />
      {archived ? (
        <p className="rounded-md border p-4 text-sm">
          This course is archived. Assignment history is read-only.
        </p>
      ) : (
        <SubmissionForm
          assignmentId={assignmentId}
          language={detail.language}
          key={`${studentId}:${assignmentId}:${detail.language}:${draft?.id ?? 'blank'}`}
          draftContext={{
            studentId,
            assignmentId,
            language: detail.language,
            revisionId: draft?.id ?? null,
          }}
          initialSource={draft?.source}
          editingRevision={draft?.revision}
          testExamples={getAssignmentTestExamples(
            process.env.NODE_ENV,
            process.env.STUDENT_TEST_CASE_FIXTURES_ENABLED,
          )}
          browserRunnerOrigin={resolveBrowserRunnerOrigin(process.env)}
        />
      )}
      <SubmissionHistory
        assignmentId={assignmentId}
        courseId={courseId}
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

// eslint-disable-next-line complexity -- explicit checks preserve private 404s for invalid course and assignment access.
async function loadWorkspace(
  assignmentId: string,
  revisionId?: string,
  requestedCourseId?: string,
) {
  const { supabase, user } = await requireMember();
  const { data: assignment, error } = await supabase
    .from('assignments')
    .select(
      'id,course_id,title,instructions,language,publication_status,due_at,max_xp',
    )
    .eq('id', assignmentId)
    .eq('publication_status', 'published')
    .maybeSingle();
  if (error || !assignment) notFound();
  if (requestedCourseId && requestedCourseId !== assignment.course_id)
    notFound();
  const access = await readCourseAccess(
    supabase,
    user.id,
    assignment.course_id,
    'assessments',
  );
  if (
    !access ||
    access.role !== 'student' ||
    (access.lifecycle === 'active' && !access.featureEnabled)
  )
    notFound();
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
  const { data: submissions, error: historyError } = await supabase
    .from('submissions')
    .select('id,revision,created_at,is_late,due_at_submission')
    .eq('assignment_id', assignmentId)
    .eq('student_id', user.id)
    .order('revision', { ascending: false });
  if (historyError) throw new Error('Submission history could not be loaded.');
  const detail = {
    ...assignment,
    language,
    submission_status: submissionStatus(
      assignment.due_at,
      submissions?.[0] ?? null,
    ),
    publication_status: 'published' as const,
  };
  return {
    detail,
    courseId: assignment.course_id,
    draft,
    submissions,
    studentId: user.id,
    archived: access.lifecycle === 'archived',
  };
}
