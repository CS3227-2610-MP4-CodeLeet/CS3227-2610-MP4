import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { requireMember } from '@/lib/auth/verified-user';
import { readCourseAccess } from '@/lib/courses/access';
import { loadOwnerCases } from '@/features/practice-test-authoring/queries.server';
import { PracticeTestEditor } from '@/features/practice-test-authoring/editor';

export default async function PracticeTestsPage({
  params,
}: {
  params: Promise<{ courseId: string; assignmentId: string }>;
}) {
  const { courseId, assignmentId } = await params;
  if (!z.uuid().safeParse(assignmentId).success) notFound();
  const { supabase, user } = await requireMember();
  const { data: assignment } = await supabase
    .from('assignments')
    .select('course_id')
    .eq('id', assignmentId)
    .maybeSingle();
  if (!assignment || assignment.course_id !== courseId) notFound();
  const access = await readCourseAccess(
    supabase,
    user.id,
    assignment.course_id,
    'assessments',
  );
  if (
    !access ||
    access.role !== 'instructor' ||
    (access.lifecycle === 'active' && !access.featureEnabled)
  )
    notFound();
  const data = await loadOwnerCases(supabase, assignmentId);
  if (!data) notFound();
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-6 py-10">
      <Link
        className="text-sm underline"
        href={`/courses/${courseId}/instructor`}
      >
        Back to assignments
      </Link>
      <h1 className="text-2xl font-semibold">Practice tests</h1>
      <p>{data.title}</p>
      {access.lifecycle === 'active' ? (
        <PracticeTestEditor initial={data} />
      ) : (
        <p className="rounded-md border p-4 text-sm">
          Archived courses are read-only.
        </p>
      )}
    </main>
  );
}
