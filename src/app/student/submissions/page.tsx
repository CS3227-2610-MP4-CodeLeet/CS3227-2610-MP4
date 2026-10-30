import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth/verified-user';
import { parseHistoryPage } from '@/features/student-submissions/history';
import { loadSubmissionHistory } from '@/features/student-submissions/history.server';
import { SubmissionHistoryList } from '@/features/student-submissions/history-list';
import SubmissionsError from './error';

export default async function MySubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { supabase, user } = await requireRole('student');
  const page = parseHistoryPage((await searchParams).page);
  if (page === null) notFound();
  const history = await loadSubmissionHistory(supabase, user.id, page);
  if (!history) return <SubmissionsError />;
  return <SubmissionHistoryList history={history} page={page} />;
}
