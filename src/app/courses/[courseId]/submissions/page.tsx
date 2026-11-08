import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireMember } from '@/lib/auth/verified-user';
import { readCourseAccess } from '@/lib/courses/access';
import { parseHistoryPage } from '@/features/student-submissions/history';
import { loadSubmissionHistory } from '@/features/student-submissions/history.server';
import { SubmissionHistoryList } from '@/features/student-submissions/history-list';
import SubmissionsError from './error';
import { parseListFilters } from '@/features/student-lists/filters';
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

type RubricCriterion = {
  maxScore?: number;
  max_score?: number;
};

type AssignmentItem = {
  id: string;
  title: string;
  max_xp: number | null;
  assignment_rubrics?:
    | { criteria?: RubricCriterion[] }
    | { criteria?: RubricCriterion[] }[]
    | null;
  maxRubricScore?: number;
};

type GradeRecord = {
  id: string;
  total_score: number | null;
  published_at: string | null;
  rubric_snapshot?: RubricCriterion[] | null;
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

function parseAssignments(data: unknown[] | null): AssignmentItem[] {
  return (data ?? []).map((item) => {
    const a = item as AssignmentItem;
    const rawRubric = Array.isArray(a.assignment_rubrics)
      ? a.assignment_rubrics[0]
      : a.assignment_rubrics;
    const criteria = (rawRubric?.criteria as RubricCriterion[]) ?? [];
    const maxRubricScore = criteria.reduce(
      (sum: number, c: RubricCriterion) =>
        sum + Number(c.maxScore ?? c.max_score ?? 0),
      0,
    );
    return {
      ...a,
      maxRubricScore: maxRubricScore > 0 ? maxRubricScore : undefined,
    };
  });
}

function filterLatestSubmissions(
  submissions: SubmissionItem[],
): SubmissionItem[] {
  const latestMap = new Map<string, SubmissionItem>();
  for (const sub of submissions) {
    const key = `${sub.student_id}:${sub.assignment_id}`;
    if (!latestMap.has(key)) {
      latestMap.set(key, sub);
    }
  }
  return Array.from(latestMap.values());
}

function computeGradeMaxScore(
  grade: GradeRecord | null | undefined,
  fallbackMaxScore?: number,
): number | undefined {
  if (grade?.published_at && Array.isArray(grade.rubric_snapshot)) {
    const sum = grade.rubric_snapshot.reduce(
      (acc, c) => acc + Number(c.maxScore ?? c.max_score ?? 0),
      0,
    );
    if (sum > 0) return sum;
  }
  return fallbackMaxScore;
}

export default async function CourseSubmissionsPage({
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
  if (!access || (access.lifecycle === 'active' && !access.featureEnabled)) {
    notFound();
  }

  const urlParams = await searchParams;

  if (access.role === 'instructor') {
    return renderInstructorSubmissionsView({
      courseId,
      supabase,
      urlParams,
    });
  }

  // Student view
  const page = parseHistoryPage(urlParams.page);
  const filters = parseListFilters(urlParams);
  if (page === null || !filters) notFound();

  const history = await loadSubmissionHistory(supabase, {
    studentId: user.id,
    courseId,
    page,
    filters,
  });
  if (!history) return <SubmissionsError />;

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <SubmissionHistoryList
        history={history}
        page={page}
        filters={filters}
        courseId={courseId}
      />
    </main>
  );
}

// eslint-disable-next-line max-lines-per-function, max-statements, complexity
async function renderInstructorSubmissionsView({
  courseId,
  supabase,
  urlParams,
}: {
  courseId: string;
  supabase: Awaited<ReturnType<typeof requireMember>>['supabase'];
  urlParams: Record<string, string | string[] | undefined>;
}) {
  const [assignmentsResult, membersResult] = await Promise.all([
    supabase
      .from('assignments')
      .select('id,title,max_xp,assignment_rubrics(criteria)')
      .eq('course_id', courseId)
      .order('title'),
    supabase.rpc('list_course_members', { p_course: courseId }),
  ]);

  if (assignmentsResult.error) {
    throw new Error('Assignments could not be loaded');
  }

  const assignments: AssignmentItem[] = parseAssignments(
    assignmentsResult.data,
  );
  const members: CourseMember[] = membersResult.data ?? [];

  const memberMap = new Map<string, CourseMember>();
  for (const m of members) memberMap.set(m.user_id, m);

  const assignmentMap = new Map<string, AssignmentItem>();
  for (const a of assignments) assignmentMap.set(a.id, a);

  const rawAssignmentId =
    typeof urlParams.assignmentId === 'string' ? urlParams.assignmentId : 'all';
  const isSelectedValid =
    rawAssignmentId !== 'all' && assignmentMap.has(rawAssignmentId);
  const currentAssignmentId = isSelectedValid ? rawAssignmentId : 'all';
  const showAllRevisions = urlParams.viewAll === 'true';

  let submissions: SubmissionItem[] = [];
  if (assignments.length > 0) {
    const targetAssignmentIds = isSelectedValid
      ? [currentAssignmentId]
      : assignments.map((a) => a.id);

    const { data, error } = await supabase
      .from('submissions')
      .select(
        'id,student_id,assignment_id,revision,created_at,is_late,due_at_submission,grades(id,total_score,published_at,rubric_snapshot)',
      )
      .in('assignment_id', targetAssignmentIds)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('Submissions could not be loaded');
    }
    submissions = (data as unknown as SubmissionItem[]) ?? [];
  }

  if (!showAllRevisions) {
    submissions = filterLatestSubmissions(submissions);
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-10">
      <BreadcrumbSetter title="Submissions" />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Course instructor</p>
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
          submissions.map((sub) => (
            <SubmissionCard
              key={sub.id}
              sub={sub}
              courseId={courseId}
              member={memberMap.get(sub.student_id)}
              assignment={assignmentMap.get(sub.assignment_id)}
            />
          ))
        )}
      </section>
    </main>
  );
}

function SubmissionCard({
  sub,
  courseId,
  member,
  assignment,
}: {
  sub: SubmissionItem;
  courseId: string;
  member?: CourseMember;
  assignment?: AssignmentItem;
}) {
  const studentName =
    member?.display_name ||
    member?.email ||
    `Student ${sub.student_id.slice(0, 8)}`;
  const assignmentTitle = assignment?.title ?? 'Unknown Assignment';
  const grade = Array.isArray(sub.grades) ? sub.grades[0] : sub.grades;
  const maxScore = computeGradeMaxScore(grade, assignment?.maxRubricScore);

  return (
    <article className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-5 transition-shadow hover:shadow-sm">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-foreground">{studentName}</span>
          <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            Revision {sub.revision}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{assignmentTitle}</p>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm">
        <GradeBadge grade={grade} maxScore={maxScore} />
        <SubmissionTiming isLate={sub.is_late} dueAt={sub.due_at_submission} />
        <time
          dateTime={sub.created_at}
          className="text-xs text-muted-foreground"
        >
          {new Date(sub.created_at).toLocaleString()}
        </time>
        <Link
          href={`/courses/${courseId}/submissions/${sub.id}`}
          className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Review
        </Link>
      </div>
    </article>
  );
}

function GradeBadge({
  grade,
  maxScore,
}: {
  grade?: GradeRecord | null;
  maxScore?: number | null;
}) {
  if (grade?.published_at) {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
        Graded: {grade.total_score}
        {maxScore != null ? ` / ${maxScore}` : ''}
      </span>
    );
  }
  if (grade?.total_score != null) {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
        Draft: {grade.total_score}
        {maxScore != null ? ` / ${maxScore}` : ''}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
      Needs review
    </span>
  );
}
