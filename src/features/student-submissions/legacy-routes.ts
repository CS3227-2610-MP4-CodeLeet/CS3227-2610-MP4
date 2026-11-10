import { z } from 'zod';

export type StudentCourseSection = 'progress' | 'grades';

export function legacyCoursePath(
  courseId: string,
  section: StudentCourseSection,
) {
  const parsed = z.uuid().safeParse(courseId);
  if (!parsed.success) return '/courses';
  return `/courses/${encodeURIComponent(parsed.data)}/${section}`;
}
