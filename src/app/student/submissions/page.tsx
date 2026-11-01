import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth/verified-user';
import { parseHistoryPage } from '@/features/student-submissions/history';
import { loadSubmissionHistory } from '@/features/student-submissions/history.server';
import { SubmissionHistoryList } from '@/features/student-submissions/history-list';
import SubmissionsError from './error';
import { parseListFilters } from '@/features/student-lists/filters';

export default async function MySubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { supabase, user } = await requireRole('student');
  const params = await searchParams;
  const page = parseHistoryPage(params.page);
  const filters = parseListFilters(params);
  if (page === null || !filters) notFound();
  const history = await loadSubmissionHistory(supabase, user.id, page, filters);
  if (!history) return <SubmissionsError />;
  return (
    <SubmissionHistoryList history={history} page={page} filters={filters} />
  );
}
