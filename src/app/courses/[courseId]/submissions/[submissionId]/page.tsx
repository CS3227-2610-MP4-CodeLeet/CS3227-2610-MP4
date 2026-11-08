import { notFound } from 'next/navigation';
import { requireMember } from '@/lib/auth/verified-user';
import {
  hasStudentAiReviewAccess,
  hasStudentAssessmentAccess,
} from '@/features/student-submissions/course-access.server';
import Link from 'next/link';
import { ReviewButton } from '@/features/codementor/review-button';
import { assignmentLanguageSchema } from '@/features/codementor/contracts';
import { assignmentTitle } from '@/features/student-submissions/history';
import { languageLabels } from '@/features/student-assignments/types';
import { revisionEditorPath } from '@/features/student-submissions/revision-selection';
import { SubmissionTimingDetails } from '@/features/assignment-deadlines/components';
import { BreadcrumbSetter } from '@/components/layout/breadcrumb-context';
import { ButtonLink } from '@/components/ui/pending-link';

export default async function CourseSubmissionPage({
  params,
}: {
  params: Promise<{ courseId: string; submissionId: string }>;
}) {
  const { courseId, submissionId } = await params;
  const { supabase, user } = await requireMember();
  const submission = await loadOwnedSubmission(supabase, user.id, submissionId);
  if (!submission || submission.course_id !== courseId) notFound();

  const assignment = Array.isArray(submission.assignments)
    ? submission.assignments[0]
    : submission.assignments;

  if (!(await hasStudentAssessmentAccess(supabase, user.id, courseId))) {
    notFound();
  }

  const [grade, canRequestReview] = await Promise.all([
    loadPublishedGrade(supabase, submissionId),
    hasStudentAiReviewAccess(supabase, user.id, courseId),
  ]);

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <BreadcrumbSetter title={`Revision ${submission.revision}`} />
      <SubmissionContent
        submission={submission}
        courseId={courseId}
        assignmentAvailable={Boolean(assignment)}
        grade={grade}
        canRequestReview={canRequestReview}
      />
    </main>
  );
}

async function loadOwnedSubmission(
  supabase: Awaited<ReturnType<typeof requireMember>>['supabase'],
  studentId: string,
  submissionId: string,
) {
  const { data, error } = await supabase
    .from('submissions')
    .select(
      'id,assignment_id,course_id,source,language,revision,created_at,is_late,due_at_submission,assignments(title,publication_status,language)',
    )
    .eq('id', submissionId)
    .eq('student_id', studentId)
    .maybeSingle();
  return error ? null : data;
}

type PublishedGradeCriterion = {
  id: string;
  title: string;
  description: string;
  maxScore: number;
  score: number;
};

type PublishedGrade = {
  id: string;
  total_score: number;
  feedback: string;
  published_at: string;
  criteria?: PublishedGradeCriterion[];
  scores?: Record<string, number>;
};

async function loadPublishedGrade(
  supabase: Awaited<ReturnType<typeof requireMember>>['supabase'],
  submissionId: string,
): Promise<PublishedGrade | null> {
  const { data, error } = await supabase.rpc('get_published_submission_grade', {
    p_submission_id: submissionId,
  });
  if (error || !data) return null;
  return data as PublishedGrade;
}

type SubmissionRecord = NonNullable<
  Awaited<ReturnType<typeof loadOwnedSubmission>>
>;

function SubmissionContent({
  submission,
  courseId,
  assignmentAvailable,
  grade,
  canRequestReview,
}: {
  submission: SubmissionRecord;
  courseId: string;
  assignmentAvailable: boolean;
  grade: PublishedGrade | null;
  canRequestReview: boolean;
}) {
  const languageLabel =
    languageLabels[assignmentLanguageSchema.parse(submission.language)];
  return (
    <section className="space-y-6">
      <SubmissionNavigation
        assignmentId={submission.assignment_id}
        courseId={courseId}
        assignmentAvailable={assignmentAvailable}
      />
      <div>
        <p className="text-sm text-muted-foreground">
          {assignmentTitle(submission.assignments)}
        </p>
        <h1 className="text-2xl font-semibold">
          Revision {submission.revision}
        </h1>
        <p className="text-sm text-muted-foreground">{languageLabel} source</p>
        <SubmissionTimingDetails submission={submission} />
      </div>
      <div className="flex flex-wrap gap-3">
        <ContinueEditing submission={submission} courseId={courseId} />
        <ButtonLink
          href={`/courses/${courseId}/submissions/${submission.id}/compare`}
          prefetch={false}
          size="lg"
        >
          Compare revisions
        </ButtonLink>
      </div>
      <pre className="overflow-x-auto rounded-xl border bg-card p-5 text-sm">
        <code>{submission.source}</code>
      </pre>
      {canRequestReview && (
        <ReviewButton role="student" submissionId={submission.id} />
      )}
      {grade ? (
        <section className="space-y-4 rounded-xl border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Instructor Grade
              </p>
              <h2 className="text-xl font-bold">
                Published grade: {grade.total_score}
              </h2>
            </div>
            {grade.published_at && (
              <span className="text-xs text-muted-foreground">
                Published {new Date(grade.published_at).toLocaleString()}
              </span>
            )}
          </div>
          {grade.feedback && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Feedback</p>
              <p className="whitespace-pre-wrap rounded-lg bg-muted/40 p-3 text-sm">
                {grade.feedback}
              </p>
            </div>
          )}
          {grade.criteria && grade.criteria.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Rubric Criteria Breakdown
              </p>
              <div className="grid gap-2">
                {grade.criteria.map((criterion) => (
                  <div
                    key={criterion.id}
                    className="flex items-center justify-between gap-4 rounded-lg border bg-background/50 p-3"
                  >
                    <div>
                      <p className="font-medium text-sm">{criterion.title}</p>
                      {criterion.description && (
                        <p className="text-xs text-muted-foreground">
                          {criterion.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-sm">
                        {criterion.score} / {criterion.maxScore}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : grade.scores ? (
            <ul className="text-sm">
              {Object.entries(grade.scores).map(([key, score]) => (
                <li key={key}>
                  {key}: {String(score)}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : (
        <p className="text-sm text-muted-foreground">
          No grade has been published for this revision.
        </p>
      )}
    </section>
  );
}

function ContinueEditing({
  submission,
  courseId,
}: {
  submission: {
    id: string;
    assignment_id: string;
    language: string;
    assignments:
      | { publication_status: string; language: string }[]
      | { publication_status: string; language: string }
      | null;
  };
  courseId: string;
}) {
  const assignment = Array.isArray(submission.assignments)
    ? submission.assignments[0]
    : submission.assignments;
  if (
    assignment?.publication_status !== 'published' ||
    assignment.language !== submission.language
  )
    return null;
  return (
    <Link
      href={revisionEditorPath(
        submission.assignment_id,
        submission.id,
        courseId,
      )}
      className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
    >
      Continue editing
    </Link>
  );
}

function SubmissionNavigation({
  assignmentId,
  courseId,
  assignmentAvailable,
}: {
  assignmentId: string;
  courseId: string;
  assignmentAvailable: boolean;
}) {
  return (
    <nav
      aria-label="Submission navigation"
      className="flex flex-wrap gap-4 text-sm"
    >
      <Link href={`/courses/${courseId}/submissions`} className="underline">
        All submissions
      </Link>
      {assignmentAvailable && (
        <Link
          href={`/courses/${courseId}/assignments/${assignmentId}`}
          className="underline"
        >
          Back to assignment
        </Link>
      )}
    </nav>
  );
}
