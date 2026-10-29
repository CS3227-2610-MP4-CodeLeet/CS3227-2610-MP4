import { notFound } from 'next/navigation';
import Link from 'next/link';
import { AssignmentForm } from '@/features/codementor/assignment-form';
import { requireRole } from '@/lib/auth/verified-user';
import { assignmentLanguageSchema } from '@/features/codementor/contracts';

export default async function EditAssignmentPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId } = await params;
  const { supabase } = await requireRole('instructor');
  const { data: assignment, error } = await supabase
    .from('assignments')
    .select('id,title,instructions,language,publication_status,version')
    .eq('id', assignmentId)
    .maybeSingle();
  if (error || !assignment) notFound();
  const { count: submissionCount, error: submissionError } = await supabase
    .from('submissions')
    .select('id', { count: 'exact', head: true })
    .eq('assignment_id', assignmentId);
  if (submissionError)
    throw new Error('Assignment history could not be checked.');
  const { data: rubric } = await supabase
    .from('assignment_rubrics')
    .select('criteria')
    .eq('assignment_id', assignmentId)
    .maybeSingle();
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-10">
      <Link className="text-sm underline" href="/instructor">
        Back to assignments
      </Link>
      <h1 className="text-3xl font-semibold">Edit assignment</h1>
      <AssignmentForm
        assignment={{
          ...assignment,
          language: assignmentLanguageSchema.parse(assignment.language),
          languageLocked: Boolean(submissionCount),
          criteria: (rubric?.criteria ?? []) as Array<{
            id: string;
            title: string;
            description: string;
            maxScore: number;
          }>,
        }}
      />
    </main>
  );
}
