import { parseHistoryPage } from '@/features/student-submissions/history';
import { z } from 'zod';

export function parseCourseActivityQuery(query: URLSearchParams) {
  const courseIds = query.getAll('courseId');
  const courseId =
    courseIds.length === 1 ? z.uuid().safeParse(courseIds[0]) : null;
  const pages = query.getAll('page');
  const page = parseHistoryPage(pages.length > 1 ? pages : pages[0]);
  const unexpected = [...query.keys()].some(
    (key) => key !== 'page' && key !== 'courseId',
  );
  return courseId?.success && page !== null && !unexpected
    ? { courseId: courseId.data, page }
    : null;
}
