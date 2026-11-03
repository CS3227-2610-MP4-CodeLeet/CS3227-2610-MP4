import { notFound } from 'next/navigation';
import { requireMember } from '@/lib/auth/verified-user';
import { readCourseAccess } from '@/lib/courses/access';
import { parseHistoryPage } from '@/features/student-submissions/history';
import { loadLeaderboard } from '@/features/leaderboard/queries.server';
import { LeaderboardView } from '@/features/leaderboard/components';
import LeaderboardError from './error';
export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user, supabase } = await requireMember();
  const params = await searchParams;
  const courseId = typeof params.courseId === 'string' ? params.courseId : '';
  const access = courseId
    ? await readCourseAccess(supabase, user.id, courseId, 'leaderboard')
    : null;
  const page = parseHistoryPage(params.page);
  if (
    !access ||
    (access.lifecycle === 'active' && !access.featureEnabled) ||
    !['student', 'instructor'].includes(access.role) ||
    page === null ||
    Object.keys(params).some((key) => key !== 'page' && key !== 'courseId')
  )
    notFound();
  const data = await loadLeaderboard(supabase, courseId, page);
  return data ? (
    <LeaderboardView data={data} courseId={courseId} />
  ) : (
    <LeaderboardError />
  );
}
