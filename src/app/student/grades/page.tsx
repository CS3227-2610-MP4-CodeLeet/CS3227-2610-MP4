import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth/verified-user';
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
  const { supabase, user } = await requireRole('student');
  const params = await searchParams;
  const page = parseHistoryPage(params.page);
  const filters = parseListFilters(params);
  if (page === null || !filters) notFound();
  const grades = await loadStudentGrades(supabase, user.id, page, filters);
  if (!grades) return <GradesError />;
  return <StudentGradesList grades={grades} page={page} filters={filters} />;
}
