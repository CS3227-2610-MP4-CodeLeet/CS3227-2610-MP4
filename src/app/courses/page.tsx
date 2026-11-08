import { redirect } from 'next/navigation';
import { CourseDirectory } from '@/features/course-workspaces/course-directory';
import type { CourseMemberRole } from '@/features/course-workspaces/contracts';
import { getVerifiedUserRole } from '@/lib/auth/verified-user';

export const dynamic = 'force-dynamic';

const courseFields = 'id,owner_id,title,description,lifecycle,is_legacy';

export default async function CoursesPage() {
  const { user, role, supabase } = await getVerifiedUserRole();
  if (!user || !supabase) redirect('/sign-in');
  if (!role) redirect('/unauthorized');
  const [courseResult, membershipResult] = await Promise.all([
    supabase
      .from('courses')
      .select(courseFields)
      .order('created_at', { ascending: false }),
    supabase
      .from('course_memberships')
      .select('course_id,role')
      .eq('user_id', user.id),
  ]);
  if (courseResult.error || membershipResult.error)
    throw new Error('Courses could not be loaded.');
  const membershipByCourse = new Map(
    (membershipResult.data ?? []).map((membership) => [
      membership.course_id,
      membership.role as CourseMemberRole,
    ]),
  );
  const courses = (courseResult.data ?? []).map((course) => ({
    ...course,
    role: membershipByCourse.get(course.id) ?? null,
  }));
  const canCreate =
    role === 'admin' ||
    role === 'instructor' ||
    courses.some((course) => course.role === 'instructor');
  return (
    <CourseDirectory
      initialCourses={courses}
      canCreate={canCreate}
      currentUserId={user.id}
      platformAdmin={role === 'admin'}
    />
  );
}
