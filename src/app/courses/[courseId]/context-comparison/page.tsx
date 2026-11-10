import { notFound, redirect } from 'next/navigation';
import { requireMember } from '@/lib/auth/verified-user';
import { readCourseAccess } from '@/lib/courses/access';
import { ContextComparison } from '@/features/codementor/context-comparison';
import { BreadcrumbSetter } from '@/components/layout/breadcrumb-context';
import { IllustratedEmptyState } from '@/components/ui/illustrated-empty-state';

export const dynamic = 'force-dynamic';

export default async function ContextComparisonPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { supabase, user } = await requireMember();
  const { courseId } = await params;
  if (!courseId) redirect('/courses');

  const access = await readCourseAccess(supabase, user.id, courseId, 'ai');
  if (
    !access ||
    access.role !== 'instructor' ||
    access.lifecycle !== 'active' ||
    !access.featureEnabled
  ) {
    notFound();
  }

  const { data: submissions, error } = await supabase
    .from('submissions')
    .select('id,assignment_id,revision,created_at,assignments!inner(title)')
    .eq('assignments.course_id', courseId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw new Error('Submissions could not be loaded');

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-10">
      <BreadcrumbSetter title="Context Comparison" />
      <header className="space-y-2">
        <span className="inline-flex rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-400">
          Context Engineering &amp; Resource-Aware Evaluation
        </span>
        <h1 className="text-3xl font-bold tracking-tight">
          AI Context Strategy Comparison
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Compare how different prompt engineering strategies affect AI feedback
          quality, latency, and token consumption. Condition A (Focused Context)
          optimizes resource usage by providing only the assignment
          instructions, rubric criteria, and student code. Condition B (Broader
          Context) includes ambient metadata (timestamps, publication statuses,
          revision numbers) to demonstrate prompt bloat. AI suggestions are
          exploratory recommendations and never publish or modify official
          student grades.
        </p>
      </header>

      {!submissions?.length ? (
        <IllustratedEmptyState
          title="No submissions to compare yet."
          description="Context comparison becomes available when an owned assignment has a submission."
          illustration="code"
        />
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
