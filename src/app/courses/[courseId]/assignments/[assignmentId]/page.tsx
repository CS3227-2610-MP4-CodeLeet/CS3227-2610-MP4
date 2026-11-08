import { resolveBrowserRunnerOrigin } from '@/features/student-submissions/runner-environment';
import { assignmentLanguageSchema } from '@/features/codementor/contracts';
import { notFound } from 'next/navigation';
import { AssignmentInstructions } from '@/features/student-assignments/components';
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
import { BreadcrumbSetter } from '@/components/layout/breadcrumb-context';

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
                href={`/courses/${courseId}/submissions/${submission.id}`}
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

export default async function CourseAssignmentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string; assignmentId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { courseId, assignmentId } = await params;
  const query = await searchParams;
  const selection = revisionSelection(query.fromRevision);
  if (!selection.success) notFound();

  const { detail, draft, submissions, studentId, archived, isPreview } =
    await loadWorkspace(assignmentId, courseId, selection.data);

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-8">
      <BreadcrumbSetter title={detail.title} />
      {isPreview && (
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-400">
          <p className="font-semibold">Preview Mode (Instructor)</p>
          <p className="mt-1 text-xs text-muted-foreground">
            You are viewing this assignment from the student&apos;s perspective.
            Code execution in the browser runner is active for testing.
            Submissions are disabled in preview mode.
          </p>
        </div>
      )}
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
          draftContext={
            isPreview
              ? undefined
              : {
                  studentId,
                  assignmentId,
                  language: detail.language,
                  revisionId: draft?.id ?? null,
                }
          }
          previewMode={isPreview}
          initialSource={draft?.source}
          editingRevision={draft?.revision}
          testExamples={getAssignmentTestExamples(
            process.env.NODE_ENV,
            process.env.STUDENT_TEST_CASE_FIXTURES_ENABLED,
          )}
          browserRunnerOrigin={resolveBrowserRunnerOrigin(process.env)}
        />
      )}
      {!isPreview && (
        <SubmissionHistory
          assignmentId={assignmentId}
          courseId={courseId}
          submissions={submissions ?? []}
        />
      )}
    </main>
  );
}

async function loadOptionalRevisionDraft(options: {
  supabase: Parameters<typeof loadRevisionDraft>[0];
  studentId: string;
  assignmentId: string;
  language: ReturnType<typeof assignmentLanguageSchema.parse>;
  revisionId?: string;
}) {
  if (!options.revisionId) return null;
  const draft = await loadRevisionDraft(options.supabase, {
    studentId: options.studentId,
    assignmentId: options.assignmentId,
    language: options.language,
    revisionId: options.revisionId,
  });
  if (!draft) notFound();
  return draft;
}

async function loadWorkspace(
  assignmentId: string,
  courseId: string,
  revisionId?: string,
) {
  const { supabase, user } = await requireMember();
  const access = await readCourseAccess(
    supabase,
    user.id,
    courseId,
    'assessments',
  );

  if (!access || (access.lifecycle === 'active' && !access.featureEnabled)) {
    notFound();
  }

  const isPreview = access.role === 'instructor';

  const assignmentQuery = supabase
    .from('assignments')
    .select(
      'id,course_id,title,instructions,language,publication_status,due_at,max_xp',
    )
    .eq('id', assignmentId)
    .eq('course_id', courseId);

  if (!isPreview) {
    assignmentQuery.eq('publication_status', 'published');
  }

  const { data: assignment, error } = await assignmentQuery.maybeSingle();

  if (error || !assignment) notFound();

  const language = assignmentLanguageSchema.parse(assignment.language);
  const draft = isPreview
    ? null
    : await loadOptionalRevisionDraft({
        supabase,
        studentId: user.id,
        assignmentId,
        language,
        revisionId,
      });

  let submissions: SubmissionSummary[] = [];
  if (!isPreview) {
    const { data: userSubmissions, error: historyError } = await supabase
      .from('submissions')
      .select('id,revision,created_at,is_late,due_at_submission')
      .eq('assignment_id', assignmentId)
      .eq('student_id', user.id)
      .order('revision', { ascending: false });

    if (historyError) throw new Error('Submission history could not be loaded.');
    submissions = (userSubmissions ?? []) as SubmissionSummary[];
  }

  const detail = {
    ...assignment,
    language,
    submission_status: submissionStatus(
      assignment.due_at,
      submissions?.[0] ?? null,
    ),
    publication_status: assignment.publication_status,
  };

  return {
    detail,
    draft,
    submissions,
    studentId: user.id,
    archived: access.lifecycle === 'archived',
    isPreview,
  };
}
