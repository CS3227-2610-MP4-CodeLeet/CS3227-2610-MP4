import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getVerifiedUserRole } from '@/lib/auth/verified-user';
import { readCourseAccess } from '@/lib/courses/access';
import { assignmentLanguageSchema } from '@/features/codementor/contracts';
import { languageLabels } from '@/features/student-assignments/types';
import { AssignmentDueDate } from '@/features/assignment-deadlines/components';
import { AssignmentXp } from '@/features/assignment-xp/components';
import { redirect } from 'next/navigation';
import { ButtonLink } from '@/components/ui/pending-link';

export const dynamic = 'force-dynamic';
function languageLabel(language: unknown) {
  return languageLabels[assignmentLanguageSchema.parse(language)];
}

// eslint-disable-next-line max-lines-per-function, complexity -- page-level guards keep the course context visible before rendering.
export default async function CourseInstructorPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { supabase, user } = await getVerifiedUserRole();
  if (!user || !supabase) redirect('/sign-in');
  const { courseId } = await params;
  const access = await readCourseAccess(
    supabase,
    user.id,
    courseId,
    'assessments',
  );
  if (!access || access.role !== 'instructor') notFound();
  if (access.lifecycle === 'active' && !access.featureEnabled) notFound();
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
      <Link href={`/courses/${courseId}`} className="text-sm underline">
        ← Course workspace
      </Link>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Course instructor</p>
          <h1 className="text-3xl font-semibold">Assignments</h1>
        </div>
        {access.lifecycle === 'active' && (
          <ButtonLink
            variant="primary"
            size="lg"
            href={`/courses/${courseId}/instructor/assignments/new`}
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
                {access.lifecycle === 'active' && (
                  <Link
                    className="underline"
                    href={`/courses/${courseId}/instructor/assignments/${assignment.id}/edit`}
                  >
                    Edit
                  </Link>
                )}
                <Link
                  className="underline"
                  href={`/courses/${courseId}/instructor/submissions?assignmentId=${assignment.id}`}
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
