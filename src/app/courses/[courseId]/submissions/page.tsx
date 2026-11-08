import { notFound } from 'next/navigation';
import { requireMember } from '@/lib/auth/verified-user';
import { readCourseAccess } from '@/lib/courses/access';
import { parseHistoryPage } from '@/features/student-submissions/history';
import { loadSubmissionHistory } from '@/features/student-submissions/history.server';
import { SubmissionHistoryList } from '@/features/student-submissions/history-list';
import SubmissionsError from './error';
import { parseListFilters } from '@/features/student-lists/filters';

export default async function CourseSubmissionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { courseId } = await params;
  const { supabase, user } = await requireMember();

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
  ) {
    notFound();
  }

  const urlParams = await searchParams;
  const page = parseHistoryPage(urlParams.page);
  const filters = parseListFilters(urlParams);
  if (page === null || !filters) notFound();

  const history = await loadSubmissionHistory(supabase, {
    studentId: user.id,
    courseId,
    page,
    filters,
  });
  if (!history) return <SubmissionsError />;

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <SubmissionHistoryList
        history={history}
        page={page}
        filters={filters}
        courseId={courseId}
      />
    </main>
  );
}
