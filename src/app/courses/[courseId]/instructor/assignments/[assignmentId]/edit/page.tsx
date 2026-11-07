import { notFound } from 'next/navigation';
import Link from 'next/link';
import { AssignmentForm } from '@/features/codementor/assignment-form';
import { requireMember } from '@/lib/auth/verified-user';
import { assignmentLanguageSchema } from '@/features/codementor/contracts';
import { readCourseAccess } from '@/lib/courses/access';

function hasInstructorAccess(
  access: Awaited<ReturnType<typeof readCourseAccess>>,
) {
  return Boolean(
    access &&
    access.role === 'instructor' &&
    access.lifecycle === 'active' &&
    access.featureEnabled,
  );
}

async function loadAssignmentData(
  supabase: Parameters<typeof readCourseAccess>[0],
  assignmentId: string,
) {
  const { data: assignment, error } = await supabase
    .from('assignments')
    .select(
      'id,course_id,title,instructions,language,publication_status,version,due_at,max_xp',
    )
    .eq('id', assignmentId)
    .maybeSingle();
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
  return {
    assignment,
    error,
    submissionCount,
    criteria: rubric?.criteria ?? [],
  };
}

export default async function EditAssignmentPage({
  params,
}: {
  params: Promise<{ courseId: string; assignmentId: string }>;
}) {
  const { courseId, assignmentId } = await params;
  const { supabase, user } = await requireMember();
  const { assignment, error, submissionCount, criteria } =
    await loadAssignmentData(supabase, assignmentId);
  if (error || !assignment || assignment.course_id !== courseId) notFound();
  const access = await readCourseAccess(
    supabase,
    user.id,
    assignment.course_id,
    'assessments',
  );
  if (!hasInstructorAccess(access)) notFound();
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-10">
      <Link
        className="text-sm underline"
        href={`/courses/${courseId}/instructor`}
      >
        Back to assignments
      </Link>
      <h1 className="text-3xl font-semibold">Edit assignment</h1>
      <Link
        className="inline-block text-sm underline"
        href={`/courses/${courseId}/instructor/assignments/${assignmentId}/practice-tests`}
      >
        Practice tests
      </Link>
      <AssignmentForm
        courseId={assignment.course_id}
        assignment={{
          ...assignment,
          language: assignmentLanguageSchema.parse(assignment.language),
          languageLocked: Boolean(submissionCount),
          criteria: criteria as Array<{
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
