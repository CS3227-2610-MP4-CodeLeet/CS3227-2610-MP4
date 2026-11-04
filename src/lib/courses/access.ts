import 'server-only';

import type { createSupabaseServerClient } from '@/lib/supabase/server';
import type { CourseFeature } from '@/features/course-workspaces/contracts';

export type CourseRole = 'student' | 'instructor';
export type CourseLifecycle = 'active' | 'archived';
export type CourseAccess = {
  role: CourseRole;
  lifecycle: CourseLifecycle;
  featureEnabled: boolean;
};
type SupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export async function readCourseAccess(
  supabase: SupabaseClient,
  userId: string,
  courseId: string,
  feature: CourseFeature,
): Promise<CourseAccess | null> {
  const { data: membership, error: membershipError } = await supabase
    .from('course_memberships')
    .select('role')
    .eq('course_id', courseId)
    .eq('user_id', userId)
    .maybeSingle();
  if (
    membershipError ||
    (membership?.role !== 'student' && membership?.role !== 'instructor')
  )
    return null;

  const [
    { data: course, error: courseError },
    { data: setting, error: settingError },
  ] = await Promise.all([
    supabase
      .from('courses')
      .select('lifecycle')
      .eq('id', courseId)
      .maybeSingle(),
    supabase
      .from('course_features')
      .select('enabled')
      .eq('course_id', courseId)
      .eq('feature', feature)
      .maybeSingle(),
  ]);
  if (courseError || settingError || !course) return null;
  return {
    role: membership.role,
    lifecycle: course.lifecycle,
    featureEnabled: setting?.enabled === true,
  };
}
