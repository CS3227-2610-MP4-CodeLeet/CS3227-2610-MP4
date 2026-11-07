import { notFound, redirect } from 'next/navigation';
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
  await requireMember();
  const params = await searchParams;
  const courseId = typeof params.courseId === 'string' ? params.courseId : '';
  if (!courseId) notFound();

  const search = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (key !== 'courseId' && typeof val === 'string') {
      search.set(key, val);
    }
  }
  const queryStr = search.toString();
  redirect(
    `/courses/${encodeURIComponent(courseId)}/submissions${queryStr ? `?${queryStr}` : ''}`,
  );
}
