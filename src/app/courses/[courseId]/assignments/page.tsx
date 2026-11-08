import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { loadPublishedAssignments } from '@/features/assignment-deadlines/assignments.server';
import { AssignmentDueDate } from '@/features/assignment-deadlines/components';
import { AssignmentXp } from '@/features/assignment-xp/components';
import { assignmentLanguageSchema } from '@/features/codementor/contracts';
import { AssignmentList } from '@/features/student-assignments/components';
import { languageLabels } from '@/features/student-assignments/types';
import {
  parseListFilters,
  type ListSearchParams,
} from '@/features/student-lists/filters';
import { ButtonLink } from '@/components/ui/pending-link';
import { requireMember } from '@/lib/auth/verified-user';
import { readCourseAccess } from '@/lib/courses/access';

export const dynamic = 'force-dynamic';

function languageLabel(language: unknown) {
  return languageLabels[assignmentLanguageSchema.parse(language)];
}

export default async function CourseAssignmentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<ListSearchParams>;
}) {
  const { courseId } = await params;
  const { supabase, user } = await requireMember();
  if (!user || !supabase) redirect('/sign-in');

  const access = await readCourseAccess(
    supabase,
    user.id,
    courseId,
    'assessments',
  );

  if (!access) notFound();
  if (access.lifecycle === 'active' && !access.featureEnabled) notFound();

  if (access.role === 'instructor') {
    const { data: assignments, error } = await supabase
      .from('assignments')
      .select(
        'id,course_id,title,language,publication_status,updated_at,version,due_at,max_xp',
      )
      .eq('course_id', courseId)
      .order('updated_at', { ascending: false });

    if (error) throw new Error('Assignments could not be loaded');

    return (
      <main className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Course instructor</p>
            <h1 className="text-3xl font-semibold">Assignments</h1>
          </div>
          {access.lifecycle === 'active' && (
            <ButtonLink
              variant="primary"
              size="lg"
              href={`/courses/${courseId}/assignments/new`}
            >
              New assignment
            </ButtonLink>
          )}
        </header>
        <section className="space-y-3">
          {!assignments?.length ? (
            <p className="rounded-xl border p-6 text-muted-foreground">
              No assignments in this course yet.
            </p>
          ) : (
            assignments.map((assignment) => (
              <article
                key={assignment.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-5"
              >
                <div>
                  <h2 className="font-semibold">{assignment.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {assignment.publication_status} ·{' '}
                    {languageLabel(assignment.language)} · updated{' '}
                    {new Date(assignment.updated_at).toLocaleDateString()}
                  </p>
                  <p className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <AssignmentDueDate dueAt={assignment.due_at} />
                    <AssignmentXp value={assignment.max_xp} />
                  </p>
                </div>
                <div className="flex gap-4 text-sm">
                  <Link
                    className="underline"
                    href={`/courses/${courseId}/assignments/${assignment.id}`}
                  >
                    Preview
                  </Link>
                  {access.lifecycle === 'active' && (
                    <Link
                      className="underline"
                      href={`/courses/${courseId}/assignments/${assignment.id}/edit`}
                    >
                      Edit
                    </Link>
                  )}
                  <Link
                    className="underline"
                    href={`/courses/${courseId}/submissions?assignmentId=${assignment.id}`}
                  >
                    Submissions
                  </Link>
                </div>
              </article>
            ))
          )}
        </section>
      </main>
    );
  }

  // Student view
  const urlParams = await searchParams;
  const filters = parseListFilters(urlParams);
  if (!filters) notFound();

  const assignments = await loadPublishedAssignments(
    supabase,
    user.id,
    courseId,
    filters,
  );
  if (!assignments) {
    throw new Error('Published assignments could not be loaded');
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <AssignmentList
        assignments={assignments}
        filters={filters}
        courseId={courseId}
      />
    </main>
  );
}
