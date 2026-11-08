import { notFound } from 'next/navigation';
import { requireMember } from '@/lib/auth/verified-user';
import { readCourseAccess } from '@/lib/courses/access';
import { parseHistoryPage } from '@/features/student-submissions/history';
import { parseListFilters } from '@/features/student-lists/filters';
import { loadStudentGrades } from '@/features/student-grades/grades.server';
import { StudentGradesList } from '@/features/student-grades/grades-list';
import GradesError from './error';

export default async function CourseGradesPage({
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

  const grades = await loadStudentGrades(supabase, {
    studentId: user.id,
    courseId,
    page,
    filters,
  });
  if (!grades) return <GradesError />;

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <StudentGradesList
        grades={grades}
        page={page}
        filters={filters}
        courseId={courseId}
      />
    </main>
  );
}
