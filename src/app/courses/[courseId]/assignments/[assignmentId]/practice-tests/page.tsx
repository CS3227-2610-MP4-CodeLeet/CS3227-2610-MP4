import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BreadcrumbSetter } from '@/components/layout/breadcrumb-context';
import { PracticeTestEditor } from '@/features/practice-test-authoring/editor';
import { loadOwnerCases } from '@/features/practice-test-authoring/queries.server';
import { requireMember } from '@/lib/auth/verified-user';
import { readCourseAccess } from '@/lib/courses/access';

export default async function PracticeTestsPage({
  params,
}: {
  params: Promise<{ courseId: string; assignmentId: string }>;
}) {
  const { courseId, assignmentId } = await params;
  const { supabase, user } = await requireMember();
  const { data: assignment, error } = await supabase
    .from('assignments')
    .select('id,course_id,title')
    .eq('id', assignmentId)
    .maybeSingle();

  if (error || !assignment || assignment.course_id !== courseId) notFound();

  const access = await readCourseAccess(
    supabase,
    user.id,
    courseId,
    'assessments',
  );
  if (
    !access ||
    access.role !== 'instructor' ||
    access.lifecycle !== 'active' ||
    !access.featureEnabled
  ) {
    notFound();
  }

  const initial = await loadOwnerCases(supabase, assignmentId);
  if (!initial) notFound();

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-10">
      <BreadcrumbSetter title={`Practice tests: ${assignment.title}`} />
      <Link
        className="text-sm underline"
        href={`/courses/${courseId}/assignments/${assignmentId}/edit`}
      >
        Back to assignment
      </Link>
      <h1 className="text-3xl font-semibold">Practice tests</h1>
      <PracticeTestEditor initial={initial} />
    </main>
  );
}
