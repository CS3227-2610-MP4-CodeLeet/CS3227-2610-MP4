import Link from 'next/link';
import { requireRole } from '@/lib/auth/verified-user';

export const dynamic = 'force-dynamic';

export default async function InstructorPage() {
  const { supabase } = await requireRole('instructor');
  const { data: assignments, error } = await supabase
    .from('assignments')
    .select('id,title,publication_status,updated_at,version')
    .order('updated_at', { ascending: false });
  if (error) throw new Error('Assignments could not be loaded');
  return (
    <main className="mx-auto max-w-5xl space-y-8 px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Instructor workspace</p>
          <h1 className="text-3xl font-semibold">Assignments</h1>
        </div>
        <Link
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          href="/instructor/assignments/new"
        >
          New assignment
        </Link>
      </header>
      <section className="space-y-3">
        {!assignments?.length ? (
          <p className="rounded-xl border p-6 text-muted-foreground">
            Create an assignment to get started.
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
                  {assignment.publication_status} · updated{' '}
                  {new Date(assignment.updated_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-4 text-sm">
                <Link
                  className="underline"
                  href={`/instructor/assignments/${assignment.id}/edit`}
                >
                  Edit
                </Link>
                <Link
                  className="underline"
                  href={`/instructor/assignments/${assignment.id}/submissions`}
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
