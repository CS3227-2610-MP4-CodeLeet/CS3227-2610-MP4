import { notFound } from 'next/navigation';
import { requireMember } from '@/lib/auth/verified-user';
import { parseHistoryPage } from '@/features/student-submissions/history';
import { loadLeaderboard } from '@/features/leaderboard/queries.server';
import { LeaderboardView } from '@/features/leaderboard/components';
import LeaderboardError from './error';
export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { supabase } = await requireMember();
  const params = await searchParams;
  const page = parseHistoryPage(params.page);
  if (page === null || Object.keys(params).some((key) => key !== 'page'))
    notFound();
  const data = await loadLeaderboard(supabase, page);
  return data ? <LeaderboardView data={data} /> : <LeaderboardError />;
}
