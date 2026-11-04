import { notFound } from 'next/navigation';
import { requireMember } from '@/lib/auth/verified-user';
import { readCourseAccess } from '@/lib/courses/access';
import { parseHistoryPage } from '@/features/student-submissions/history';
import { parseListFilters } from '@/features/student-lists/filters';
import { loadStudentGrades } from '@/features/student-grades/grades.server';
import { StudentGradesList } from '@/features/student-grades/grades-list';
import GradesError from './error';

export default async function MyGradesPage({
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
  const grades = await loadStudentGrades(supabase, {
    studentId: user.id,
    courseId,
    page,
    filters,
  });
  if (!grades) return <GradesError />;
  return (
    <StudentGradesList
      grades={grades}
      page={page}
      filters={filters}
      courseId={courseId}
    />
  );
}
