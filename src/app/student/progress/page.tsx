import { redirect } from 'next/navigation';
import { requireMember } from '@/lib/auth/verified-user';
import { legacyCoursePath } from '@/features/student-submissions/legacy-routes';

export default async function LegacyStudentProgressPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireMember();
  const query = await searchParams;
  const courseId = typeof query.courseId === 'string' ? query.courseId : '';
  redirect(legacyCoursePath(courseId, 'progress'));
}
