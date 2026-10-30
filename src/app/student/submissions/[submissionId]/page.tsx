import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth/verified-user';
import Link from 'next/link';
import { ReviewButton } from '@/features/codementor/review-button';
import { assignmentLanguageSchema } from '@/features/codementor/contracts';
import { assignmentTitle } from '@/features/student-submissions/history';
import { languageLabels } from '@/features/student-assignments/types';

export default async function SubmissionPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const { submissionId } = await params;
  const { supabase, user } = await requireRole('student');
  const { data: submission, error } = await supabase
    .from('submissions')
    .select(
      'id,assignment_id,source,language,revision,created_at,assignments(title)',
    )
    .eq('id', submissionId)
    .eq('student_id', user.id)
    .maybeSingle();
  if (error || !submission) notFound();
  const languageLabel =
    languageLabels[assignmentLanguageSchema.parse(submission.language)];
  const { data: grade } = await supabase
    .from('grades')
    .select('scores,feedback,total_score,published_at')
    .eq('submission_id', submissionId)
    .not('published_at', 'is', null)
    .maybeSingle();
  return (
    <section className="space-y-6">
      <SubmissionNavigation assignmentId={submission.assignment_id} />
      <div>
        <p className="text-sm text-muted-foreground">
          {assignmentTitle(submission.assignments)}
        </p>
        <h1 className="text-2xl font-semibold">
          Revision {submission.revision}
        </h1>
        <p className="text-sm text-muted-foreground">{languageLabel} source</p>
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
    </section>
  );
}

function SubmissionNavigation({ assignmentId }: { assignmentId: string }) {
  return (
    <nav
      aria-label="Submission navigation"
      className="flex flex-wrap gap-4 text-sm"
    >
      <Link href="/student/submissions" className="underline">
        All submissions
      </Link>
      <Link href={`/student/assignments/${assignmentId}`} className="underline">
        Back to assignment
      </Link>
    </nav>
  );
}
