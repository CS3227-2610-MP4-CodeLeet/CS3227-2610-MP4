import { notFound } from 'next/navigation';
import { requireMember } from '@/lib/auth/verified-user';
import { parseHistoryPage } from '@/features/student-submissions/history';
import { loadOwnXp } from '@/features/assignment-xp/queries.server';
import { XpOverview } from '@/features/assignment-xp/components';
import XpError from '@/app/student/xp/error';
import { readCourseAccess } from '@/lib/courses/access';

export default async function CourseXpPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { courseId } = await params;
  const { user, supabase } = await requireMember();
  const access = await readCourseAccess(supabase, user.id, courseId, 'xp');

  const urlParams = await searchParams;
  const page = parseHistoryPage(urlParams.page);

  if (
    !access ||
    access.role !== 'student' ||
    (access.lifecycle === 'active' && !access.featureEnabled) ||
    page === null
  ) {
    notFound();
  }

  const data = await loadOwnXp(supabase, courseId, page);
  return data ? (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <XpOverview data={data} courseId={courseId} />
    </div>
  ) : (
    <XpError />
  );
}
