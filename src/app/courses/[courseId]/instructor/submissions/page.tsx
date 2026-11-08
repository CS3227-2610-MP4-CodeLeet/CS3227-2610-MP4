import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireMember } from '@/lib/auth/verified-user';
import { readCourseAccess } from '@/lib/courses/access';
import { SubmissionTiming } from '@/features/assignment-deadlines/components';
import { BreadcrumbSetter } from '@/components/layout/breadcrumb-context';
import { SubmissionFilters } from './submission-filters';

export const dynamic = 'force-dynamic';

type CourseMember = {
  user_id: string;
  email: string;
  display_name: string | null;
  role: string;
};

type AssignmentItem = {
  id: string;
  title: string;
  max_xp: number | null;
};

type GradeRecord = {
  id: string;
  total_score: number | null;
  published_at: string | null;
};

type SubmissionItem = {
  id: string;
  student_id: string;
  assignment_id: string;
  revision: number;
  created_at: string;
  is_late: boolean;
  due_at_submission: string | null;
  grades: GradeRecord[] | GradeRecord | null;
};

export default async function InstructorSubmissionsDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { courseId } = await params;
  const { supabase, user } = await requireMember();

  const access = await readCourseAccess(
    supabase,
    user.id,
    courseId,
    'assessments',
  );
  if (!access || access.role !== 'instructor') notFound();
  if (access.lifecycle === 'active' && !access.featureEnabled) notFound();

  const urlParams = await searchParams;
  const currentAssignmentId =
    typeof urlParams.assignmentId === 'string' ? urlParams.assignmentId : 'all';
  const showAllRevisions = urlParams.viewAll === 'true';

  const [assignmentsResult, membersResult] = await Promise.all([
    supabase
      .from('assignments')
      .select('id,title,max_xp')
      .eq('course_id', courseId)
      .order('title'),
    supabase.rpc('list_course_members', { p_course: courseId }),
  ]);

  const assignments: AssignmentItem[] = assignmentsResult.data ?? [];
  const members: CourseMember[] = membersResult.data ?? [];

  const memberMap = new Map<string, CourseMember>();
  for (const m of members) {
    memberMap.set(m.user_id, m);
  }

  const assignmentMap = new Map<string, AssignmentItem>();
  for (const a of assignments) {
    assignmentMap.set(a.id, a);
  }

  let submissions: SubmissionItem[] = [];
  if (assignments.length > 0) {
    const targetAssignmentIds =
      currentAssignmentId !== 'all'
        ? [currentAssignmentId]
        : assignments.map((a) => a.id);

    const { data, error } = await supabase
      .from('submissions')
      .select(
        'id,student_id,assignment_id,revision,created_at,is_late,due_at_submission,grades(id,total_score,published_at)',
      )
      .in('assignment_id', targetAssignmentIds)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('Submissions could not be loaded');
    }
    submissions = (data as unknown as SubmissionItem[]) ?? [];
  }

  if (!showAllRevisions) {
    const latestMap = new Map<string, SubmissionItem>();
    for (const sub of submissions) {
      const key = `${sub.student_id}:${sub.assignment_id}`;
      if (!latestMap.has(key)) {
        latestMap.set(key, sub);
      }
    }
    submissions = Array.from(latestMap.values());
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-10">
      <BreadcrumbSetter title="Submissions" />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href={`/courses/${courseId}/instructor`}
            className="text-sm text-muted-foreground hover:underline"
          >
            ← Back to assignments
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">Course instructor</p>
          <h1 className="text-3xl font-bold tracking-tight">Submissions</h1>
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          {submissions.length}{' '}
          {submissions.length === 1 ? 'submission' : 'submissions'}
        </p>
      </div>

      <SubmissionFilters
        courseId={courseId}
        assignments={assignments}
        currentAssignmentId={currentAssignmentId}
        showAllRevisions={showAllRevisions}
      />

      <section className="space-y-3">
        {submissions.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
            No submissions found for the selected filter.
          </div>
        ) : (
          submissions.map((sub) => {
            const member = memberMap.get(sub.student_id);
            const studentName =
              member?.display_name ||
              member?.email ||
              `Student ${sub.student_id.slice(0, 8)}`;
            const assignment = assignmentMap.get(sub.assignment_id);
            const assignmentTitle = assignment?.title ?? 'Unknown Assignment';
            const maxXp = assignment?.max_xp;

            const grade = Array.isArray(sub.grades)
              ? sub.grades[0]
              : sub.grades;

            return (
              <article
                key={sub.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-5 transition-shadow hover:shadow-sm"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground">
                      {studentName}
                    </span>
                    <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      Revision {sub.revision}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {assignmentTitle}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm">
                  {grade?.published_at ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      Graded: {grade.total_score}
                      {maxXp != null ? ` / ${maxXp}` : ''}
                    </span>
                  ) : grade?.total_score != null ? (
                    <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                      Draft: {grade.total_score}
                      {maxXp != null ? ` / ${maxXp}` : ''}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      Needs review
                    </span>
                  )}

                  <SubmissionTiming
                    isLate={sub.is_late}
                    dueAt={sub.due_at_submission}
                  />

                  <time
                    dateTime={sub.created_at}
                    className="text-xs text-muted-foreground"
                  >
                    {new Date(sub.created_at).toLocaleString()}
                  </time>

                  <Link
                    href={`/courses/${courseId}/instructor/submissions/${sub.id}`}
                    className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    Review
                  </Link>
                </div>
              </article>
            );
          })
        )}
      </section>
    </main>
  );
}
