import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth/verified-user';
import Link from 'next/link';
import { ReviewButton } from '@/features/codementor/review-button';
import { SignOutButton } from '@/features/auth/auth-form';
import { AccountThemeButton } from '@/features/auth/app-theme';

export default async function SubmissionPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const { submissionId } = await params;
  const { supabase, user } = await requireRole('student');
  const { data: submission, error } = await supabase
    .from('submissions')
    .select('id,assignment_id,source,revision,created_at,assignments(title)')
    .eq('id', submissionId)
    .eq('student_id', user.id)
    .maybeSingle();
  if (error || !submission) notFound();
  const { data: grade } = await supabase
    .from('grades')
    .select('scores,feedback,total_score,published_at')
    .eq('submission_id', submissionId)
    .not('published_at', 'is', null)
    .maybeSingle();
  return (
    <div>
      <header className="flex items-center justify-between border-b px-6 py-4">
        <Link href="/student/assignments" className="font-semibold">
          CodeMentor · Student
        </Link>
        <div className="flex items-center gap-2">
          <SignOutButton />
          <AccountThemeButton />
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-6 px-6 py-10">
        <Link
          className="text-sm underline"
          href={`/student/assignments/${submission.assignment_id}`}
        >
          Back to assignment
        </Link>
        <div>
          <p className="text-sm text-muted-foreground">
            {submission.assignments?.[0]?.title}
          </p>
          <h1 className="text-2xl font-semibold">
            Revision {submission.revision}
          </h1>
        </div>
        <pre className="overflow-x-auto rounded-xl border bg-card p-5 text-sm">
          <code>{submission.source}</code>
        </pre>
        <ReviewButton role="student" submissionId={submission.id} />
        {grade ? (
          <section className="space-y-3 rounded-xl border bg-card p-5">
            <h2 className="font-semibold">
              Published grade: {grade.total_score}
            </h2>
            <p className="whitespace-pre-wrap">{grade.feedback}</p>
            <ul>
              {Object.entries(grade.scores as Record<string, unknown>).map(
                ([key, score]) => (
                  <li key={key}>
                    {key}: {String(score)}
                  </li>
                ),
              )}
            </ul>
          </section>
        ) : (
          <p className="text-sm text-muted-foreground">
            No grade has been published for this revision.
          </p>
        )}
      </main>
    </div>
  );
}
