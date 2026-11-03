import { notFound } from 'next/navigation';
import { requireMember } from '@/lib/auth/verified-user';
import { readCourseAccess } from '@/lib/courses/access';
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
  const { supabase, user } = await requireMember();
  const params = await searchParams;
  const courseId = typeof params.courseId === 'string' ? params.courseId : '';
  if (!courseId) notFound();
  const access = await readCourseAccess(
    supabase,
    user.id,
    courseId,
    'assessments',
  );
  if (
    !access ||
    access.role !== 'student' ||
    (access.lifecycle === 'active' && !access.featureEnabled)
  )
    notFound();
  const page = parseHistoryPage(params.page);
  const filters = parseListFilters(params);
  if (page === null || !filters) notFound();
  const history = await loadSubmissionHistory(supabase, {
    studentId: user.id,
    courseId,
    page,
    filters,
  });
  if (!history) return <SubmissionsError />;
  return (
    <SubmissionHistoryList
      history={history}
      page={page}
      filters={filters}
      courseId={courseId}
    />
  );
}
