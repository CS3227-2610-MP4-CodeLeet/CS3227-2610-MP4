import { notFound } from 'next/navigation';
import { requireMember } from '@/lib/auth/verified-user';
import { readCourseAccess } from '@/lib/courses/access';
import { parseHistoryPage } from '@/features/student-submissions/history';
import { loadLeaderboard } from '@/features/leaderboard/queries.server';
import { LeaderboardView } from '@/features/leaderboard/components';
import LeaderboardError from './error';

export default async function CourseLeaderboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user, supabase } = await requireMember();
  const { courseId } = await params;
  const access = await readCourseAccess(
    supabase,
    user.id,
    courseId,
    'leaderboard',
  );

  const urlParams = await searchParams;
  const page = parseHistoryPage(urlParams.page);

  if (
    !access ||
    (access.lifecycle === 'active' && !access.featureEnabled) ||
    !['student', 'instructor'].includes(access.role) ||
    page === null
  ) {
    notFound();
  }

  const data = await loadLeaderboard(supabase, courseId, page);
  return data ? (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <LeaderboardView data={data} courseId={courseId} />
    </main>
  ) : (
    <LeaderboardError />
  );
}
