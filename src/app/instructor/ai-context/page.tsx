import { requireRole } from '@/lib/auth/verified-user';
import { ContextComparison } from '@/features/codementor/context-comparison';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AIContextPage() {
  const { supabase } = await requireRole('instructor');
  const { data: submissions, error } = await supabase
    .from('submissions')
    .select('id,assignment_id,revision,created_at,assignments(title)')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw new Error('Submissions could not be loaded');
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-10">
      <Link href="/instructor" className="text-sm underline">
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
        submissions.map((submission) => (
          <article
            key={submission.id}
            className="space-y-3 rounded-xl border bg-card p-5"
          >
            <h2 className="font-medium">
              {submission.assignments?.[0]?.title} · revision{' '}
              {submission.revision}
            </h2>
            <ContextComparison submissionId={submission.id} />
          </article>
        ))
      )}
    </main>
  );
}
