import { parseHistoryPage } from '@/features/student-submissions/history';
import { z } from 'zod';
import { parseXpRevision } from './xp-pagination';

export function parseCourseActivityQuery(query: URLSearchParams) {
  const courseIds = query.getAll('courseId');
  const courseId =
    courseIds.length === 1 ? z.uuid().safeParse(courseIds[0]) : null;
  const pages = query.getAll('page');
  const revisions = query.getAll('revision');
  const revision = parseXpRevision(
    revisions.length > 1 ? revisions : revisions[0],
  );
  const page = parseHistoryPage(pages.length > 1 ? pages : pages[0]);
  const unexpected = [...query.keys()].some(
    (key) => key !== 'page' && key !== 'courseId' && key !== 'revision',
  );
  return courseId?.success && page !== null && revision && !unexpected
    ? { courseId: courseId.data, page, ...revision }
    : null;
}
