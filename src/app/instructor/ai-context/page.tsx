import { notFound, redirect } from 'next/navigation';
import { requireMember } from '@/lib/auth/verified-user';
import { readCourseAccess } from '@/lib/courses/access';
import { ContextComparison } from '@/features/codementor/context-comparison';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AIContextPage({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string }>;
}) {
  const { supabase, user } = await requireMember();
  const { courseId } = await searchParams;
  if (!courseId) redirect('/courses');
  const access = await readCourseAccess(supabase, user.id, courseId, 'ai');
  if (
    !access ||
    access.role !== 'instructor' ||
    access.lifecycle !== 'active' ||
    !access.featureEnabled
  )
    notFound();
  const { data: submissions, error } = await supabase
    .from('submissions')
    .select('id,assignment_id,revision,created_at,assignments!inner(title)')
    .eq('assignments.course_id', courseId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw new Error('Submissions could not be loaded');
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-10">
      <Link
        href={`/instructor?courseId=${encodeURIComponent(courseId)}`}
        className="text-sm underline"
      >
        Back to assignments
      </Link>
      <header>
        <p className="text-sm text-muted-foreground">Instructor tools</p>
        <h1 className="text-3xl font-semibold">AI context comparison</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Both contexts use only an assignment you own, its private rubric, and
          the selected submission. Results are suggestions, not grades. Input
          token counts are estimates.
        </p>
      </header>
      {!submissions?.length ? (
        <p className="rounded-xl border p-6 text-muted-foreground">
          Context comparison becomes available when an owned assignment has a
          submission.
        </p>
      ) : (
        submissions.map((submission) => {
          const assignment = Array.isArray(submission.assignments)
            ? submission.assignments[0]
            : submission.assignments;
          return (
            <article
              key={submission.id}
              className="space-y-3 rounded-xl border bg-card p-5"
            >
              <h2 className="font-medium">
                {assignment?.title ?? 'Assignment'} · revision{' '}
                {submission.revision}
              </h2>
              <ContextComparison submissionId={submission.id} />
            </article>
          );
        })
      )}
    </main>
  );
}
