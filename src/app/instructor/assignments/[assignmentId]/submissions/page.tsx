import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireMember } from '@/lib/auth/verified-user';
import { readCourseAccess } from '@/lib/courses/access';
import {
  AssignmentDueDate,
  SubmissionTiming,
} from '@/features/assignment-deadlines/components';

// eslint-disable-next-line max-lines-per-function -- page markup stays with its server-side course context.
export default async function InstructorSubmissionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ assignmentId: string }>;
  searchParams: Promise<{ courseId?: string }>;
}) {
  const { assignmentId } = await params;
  const requestedCourseId = (await searchParams).courseId;
  const { supabase, user } = await requireMember();
  const { data: assignment } = await supabase
    .from('assignments')
    .select('id,course_id,title,due_at')
    .eq('id', assignmentId)
    .maybeSingle();
  if (!assignment || assignment.course_id !== requestedCourseId) notFound();
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
  const { data: submissions, error } = await supabase
    .from('submissions')
    .select('id,student_id,revision,created_at,is_late,due_at_submission')
    .eq('assignment_id', assignmentId)
    .order('created_at', { ascending: false });
  if (error) throw new Error('Submissions could not be loaded');
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-10">
      <Link
        className="text-sm underline"
        href={`/instructor?courseId=${assignment.course_id}`}
      >
        Back to assignments
      </Link>
      <div>
        <p className="text-sm text-muted-foreground">Instructor review</p>
        <h1 className="text-3xl font-semibold">{assignment.title}</h1>
        <p className="text-sm text-muted-foreground">
          <AssignmentDueDate dueAt={assignment.due_at} />
        </p>
      </div>
      {!submissions?.length ? (
        <p className="rounded-xl border p-6 text-muted-foreground">
          No submissions yet.
        </p>
      ) : (
        submissions.map((submission) => (
          <article
            key={submission.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-5"
          >
            <div>
              <h2 className="font-medium">Revision {submission.revision}</h2>
              <p className="text-xs text-muted-foreground">
                Student {submission.student_id}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <SubmissionTiming
                isLate={submission.is_late}
                dueAt={submission.due_at_submission}
              />
              <time dateTime={submission.created_at}>
                {new Date(submission.created_at).toLocaleString()}
              </time>
              <Link
                className="underline"
                href={`/instructor/submissions/${submission.id}?courseId=${assignment.course_id}`}
              >
                Review
              </Link>
            </div>
          </article>
        ))
      )}
    </main>
  );
}
