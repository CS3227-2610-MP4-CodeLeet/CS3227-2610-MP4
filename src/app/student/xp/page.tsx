import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth/verified-user';
import { parseHistoryPage } from '@/features/student-submissions/history';
import { loadOwnXp } from '@/features/assignment-xp/queries.server';
import { XpOverview } from '@/features/assignment-xp/components';
import XpError from './error';
export default async function XpPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { supabase } = await requireRole('student');
  const params = await searchParams;
  const page = parseHistoryPage(params.page);
  if (page === null || Object.keys(params).some((key) => key !== 'page'))
    notFound();
  const data = await loadOwnXp(supabase, page);
  return data ? <XpOverview data={data} /> : <XpError />;
}
