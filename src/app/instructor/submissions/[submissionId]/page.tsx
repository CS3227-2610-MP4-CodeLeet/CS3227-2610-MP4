import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ReviewButton } from '@/features/codementor/review-button';
import { GradeForm } from '@/features/codementor/grade-form';
import { requireRole } from '@/lib/auth/verified-user';
import { assignmentLanguageSchema } from '@/features/codementor/contracts';
import { languageLabels } from '@/features/student-assignments/types';
import { PracticeRunner } from '@/features/student-submissions/practice-runner';
import { resolveBrowserRunnerOrigin } from '@/features/student-submissions/runner-environment';

type Criterion = {
  id: string;
  title: string;
  description: string;
  maxScore: number;
};

function SubmissionCodeRunner({
  runnerOrigin,
  language,
  source,
}: {
  runnerOrigin: string | null;
  language: 'python' | 'java';
  source: string;
}) {
  return runnerOrigin ? (
    <PracticeRunner
      runnerOrigin={runnerOrigin}
      language={language}
      source={source}
      cases={[]}
    />
  ) : (
    <p className="text-sm text-muted-foreground">
      Browser code execution is not configured for this deployment.
    </p>
  );
}

export default async function InstructorSubmissionPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const { submissionId } = await params;
  const { supabase } = await requireRole('instructor');
  const { data: submission } = await supabase
    .from('submissions')
    .select('id,assignment_id,source,language,revision,created_at')
    .eq('id', submissionId)
    .maybeSingle();
  if (!submission) notFound();
  const [{ data: assignment }, { data: rubric }, { data: grade }] =
    await Promise.all([
      supabase
        .from('assignments')
        .select('id,title')
        .eq('id', submission.assignment_id)
        .maybeSingle(),
      supabase
        .from('assignment_rubrics')
        .select('criteria')
        .eq('assignment_id', submission.assignment_id)
        .maybeSingle(),
      supabase
        .from('grades')
        .select('id,scores,feedback,total_score,published_at,version')
        .eq('submission_id', submissionId)
        .maybeSingle(),
    ]);
  if (!assignment || !rubric) notFound();
  const criteria = rubric.criteria as Criterion[];
  const language = assignmentLanguageSchema.parse(submission.language);
  const runnerOrigin = resolveBrowserRunnerOrigin(process.env);
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-10">
      <Link
        className="text-sm underline"
        href={`/instructor/assignments/${assignment.id}/submissions`}
      >
        Back to submissions
      </Link>
      <div>
        <p className="text-sm text-muted-foreground">
          {assignment.title} · revision {submission.revision}
        </p>
        <h1 className="text-3xl font-semibold">Review submission</h1>
        <p className="text-sm text-muted-foreground">
          {languageLabels[language]} source
        </p>
      </div>
      <pre className="overflow-x-auto rounded-xl border bg-card p-5 text-sm">
        <code>{submission.source}</code>
      </pre>
      <SubmissionCodeRunner
        runnerOrigin={runnerOrigin}
        language={language}
        source={submission.source}
      />
      <ReviewButton role="instructor" submissionId={submission.id} />
      <GradeForm
        submissionId={submission.id}
        criteria={criteria}
        grade={
          grade
            ? { ...grade, scores: grade.scores as Record<string, number> }
            : null
        }
      />
    </main>
  );
}
