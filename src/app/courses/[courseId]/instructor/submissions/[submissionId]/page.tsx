import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ReviewButton } from '@/features/codementor/review-button';
import { hasInstructorAiReviewAccess } from '@/features/student-submissions/course-access.server';
import { GradeForm } from '@/features/codementor/grade-form';
import { requireMember } from '@/lib/auth/verified-user';
import { readCourseAccess } from '@/lib/courses/access';
import { assignmentLanguageSchema } from '@/features/codementor/contracts';
import { languageLabels } from '@/features/student-assignments/types';
import { PracticeRunner } from '@/features/student-submissions/practice-runner';
import { resolveBrowserRunnerOrigin } from '@/features/student-submissions/runner-environment';
import { SubmissionTimingDetails } from '@/features/assignment-deadlines/components';
import { BreadcrumbSetter } from '@/components/layout/breadcrumb-context';

type Criterion = {
  id: string;
  title: string;
  description: string;
  maxScore: number;
};

type SavedGrade = {
  scores: Record<string, unknown>;
  feedback: string;
  total_score: number | null;
  published_at: string | null;
};

function SubmissionCodeRunner({
  runnerOrigin,
  language,
  source,
}: {
  runnerOrigin: string | null;
  language: 'python' | 'java';
  source: string;
}) {
  return runnerOrigin ? (
    <PracticeRunner
      runnerOrigin={runnerOrigin}
      language={language}
      source={source}
      cases={[]}
    />
  ) : (
    <p className="text-sm text-muted-foreground">Code runner is unavailable.</p>
  );
}

// eslint-disable-next-line max-lines-per-function, complexity -- load, authorize, and render this one course-scoped review page together.
export default async function CourseInstructorSubmissionPage({
  params,
}: {
  params: Promise<{ courseId: string; submissionId: string }>;
}) {
  const { courseId, submissionId } = await params;
  const { supabase, user } = await requireMember();
  const { data: submission } = await supabase
    .from('submissions')
    .select(
      'id,assignment_id,source,language,revision,created_at,is_late,due_at_submission',
    )
    .eq('id', submissionId)
    .maybeSingle();
  if (!submission) notFound();
  const [{ data: assignment }, { data: rubric }, { data: grade }] =
    await Promise.all([
      supabase
        .from('assignments')
        .select('id,course_id,title')
        .eq('id', submission.assignment_id)
        .maybeSingle(),
      supabase
        .from('assignment_rubrics')
        .select('criteria')
        .eq('assignment_id', submission.assignment_id)
        .maybeSingle(),
      supabase
        .from('grades')
        .select('id,scores,feedback,total_score,published_at,version')
        .eq('submission_id', submissionId)
        .maybeSingle(),
    ]);
  if (!assignment || !rubric || assignment.course_id !== courseId) notFound();
  const access = await readCourseAccess(
    supabase,
    user.id,
    assignment.course_id,
    'assessments',
  );
  if (
    !access ||
    access.role !== 'instructor' ||
    (access.lifecycle === 'active' && !access.featureEnabled)
  )
    notFound();
  const canRequestReview = await hasInstructorAiReviewAccess(
    supabase,
    user.id,
    assignment.course_id,
  );
  const criteria = rubric.criteria as Criterion[];
  const language = assignmentLanguageSchema.parse(submission.language);
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-10">
      <BreadcrumbSetter
        title={`Review: ${assignment.title} (r${submission.revision})`}
      />
      <Link
        className="text-sm underline"
        href={`/courses/${courseId}/instructor/assignments/${assignment.id}/submissions`}
      >
        Back to submissions
      </Link>
      <div>
        <p className="text-sm text-muted-foreground">
          {assignment.title} · revision {submission.revision}
        </p>
        <h1 className="text-3xl font-semibold">Review submission</h1>
        <SubmissionTimingDetails submission={submission} />
        <p className="text-sm text-muted-foreground">
          {languageLabels[language]} source
        </p>
      </div>
      <pre className="overflow-x-auto rounded-xl border bg-card p-5 text-sm">
        <code>{submission.source}</code>
      </pre>
      <SubmissionCodeRunner
        runnerOrigin={resolveBrowserRunnerOrigin(process.env)}
        language={language}
        source={submission.source}
      />
      {access.lifecycle === 'active' ? (
        <>
          {canRequestReview && (
            <ReviewButton role="instructor" submissionId={submission.id} />
          )}
          <GradeForm
            submissionId={submission.id}
            criteria={criteria}
            grade={
              grade
                ? { ...grade, scores: grade.scores as Record<string, number> }
                : null
            }
          />
        </>
      ) : (
        <>
          <p className="rounded-md border p-4 text-sm">
            Archived courses are read-only.
          </p>
          {grade ? (
            <ReadOnlyGrade
              criteria={criteria}
              grade={{
                ...grade,
                scores: grade.scores as Record<string, unknown>,
              }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              No saved grade is available for this submission.
            </p>
          )}
        </>
      )}
    </main>
  );
}

function ReadOnlyGrade({
  criteria,
  grade,
}: {
  criteria: Criterion[];
  grade: SavedGrade;
}) {
  return (
    <section
      aria-label="Saved grade"
      className="space-y-3 rounded-xl border bg-card p-5"
    >
      <h2 className="font-semibold">Saved grade · read-only</h2>
      <p className="text-sm">{grade.published_at ? 'Published' : 'Draft'}</p>
      <dl className="space-y-2">
        {criteria.map((criterion) => (
          <div
            key={criterion.id}
            className="flex items-center justify-between gap-4 text-sm"
          >
            <dt>
              {criterion.title} (/{criterion.maxScore})
            </dt>
            <dd>{String(grade.scores[criterion.id] ?? '—')}</dd>
          </div>
        ))}
      </dl>
      <p className="text-sm font-medium">Total: {grade.total_score ?? '—'}</p>
      <div>
        <h3 className="text-sm font-medium">Feedback</h3>
        <p className="whitespace-pre-wrap text-sm">{grade.feedback}</p>
      </div>
    </section>
  );
}
