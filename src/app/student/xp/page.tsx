import { notFound } from 'next/navigation';
import { requireMember } from '@/lib/auth/verified-user';
import { parseHistoryPage } from '@/features/student-submissions/history';
import { loadOwnXp } from '@/features/assignment-xp/queries.server';
import { XpOverview } from '@/features/assignment-xp/components';
import XpError from './error';
import { readCourseAccess } from '@/lib/courses/access';
export default async function XpPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user, supabase } = await requireMember();
  const params = await searchParams;
  const courseId = typeof params.courseId === 'string' ? params.courseId : '';
  const access = courseId
    ? await readCourseAccess(supabase, user.id, courseId, 'xp')
    : null;
  const page = parseHistoryPage(params.page);
  if (
    !access ||
    access.role !== 'student' ||
    (access.lifecycle === 'active' && !access.featureEnabled) ||
    page === null ||
    Object.keys(params).some((key) => key !== 'page' && key !== 'courseId')
  )
    notFound();
  const data = await loadOwnXp(supabase, courseId, page);
  return data ? <XpOverview data={data} courseId={courseId} /> : <XpError />;
}
