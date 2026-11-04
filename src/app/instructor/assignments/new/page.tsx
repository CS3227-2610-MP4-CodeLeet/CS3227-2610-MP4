import { AssignmentForm } from '@/features/codementor/assignment-form';
import { requireMember } from '@/lib/auth/verified-user';
import { readCourseAccess } from '@/lib/courses/access';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export default async function NewAssignmentPage({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string }>;
}) {
  const courseId = z.uuid().safeParse((await searchParams).courseId);
  if (!courseId.success) notFound();
  const { supabase, user } = await requireMember();
  const access = await readCourseAccess(
    supabase,
    user.id,
    courseId.data,
    'assessments',
  );
  if (
    !access ||
    access.role !== 'instructor' ||
    access.lifecycle !== 'active' ||
    !access.featureEnabled
  )
    notFound();
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-10">
      <Link
        className="text-sm underline"
        href={`/instructor?courseId=${courseId.data}`}
      >
        Back to assignments
      </Link>
      <h1 className="text-3xl font-semibold">Create assignment</h1>
      <AssignmentForm courseId={courseId.data} />
    </main>
  );
}
