import { notFound, redirect } from 'next/navigation';
import { CourseWorkspace } from '@/features/course-workspaces/course-workspace';
import type {
  CourseFeatureSetting,
  CourseMember,
  CourseInvitation,
  CourseMemberRole,
} from '@/features/course-workspaces/contracts';
import { getVerifiedUserRole } from '@/lib/auth/verified-user';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const courseFields = 'id,owner_id,title,description,lifecycle,is_legacy';
type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

async function loadCourseView(
  supabase: Supabase,
  courseId: string,
  userId: string,
) {
  const [courseResult, membershipResult, featureResult] = await Promise.all([
    supabase
      .from('courses')
      .select(courseFields)
      .eq('id', courseId)
      .maybeSingle(),
    supabase
      .from('course_memberships')
      .select('role')
      .eq('course_id', courseId)
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('course_features')
      .select('feature,enabled')
      .eq('course_id', courseId),
  ]);
  if (courseResult.error || membershipResult.error || featureResult.error)
    throw new Error('Course could not be loaded.');
  if (!courseResult.data || !membershipResult.data) return null;
  const role = membershipResult.data.role as CourseMemberRole;
  const staff = await loadStaffDirectory(
    supabase,
    courseId,
    role,
    courseResult.data,
  );
  return {
    course: courseResult.data,
    role,
    features: (featureResult.data ?? []) as CourseFeatureSetting[],
    ...staff,
  };
}

async function loadStaffDirectory(
  supabase: Supabase,
  courseId: string,
  role: CourseMemberRole,
  course: { lifecycle: string; is_legacy: boolean },
) {
  if (role !== 'instructor' || course.is_legacy)
    return {
      members: [] as CourseMember[],
      invitations: [] as CourseInvitation[],
    };
  const membersResult = await supabase.rpc('list_course_members', {
    p_course: courseId,
  });
  if (membersResult.error)
    throw new Error('Course members could not be loaded.');
  const members = (membersResult.data ?? []) as CourseMember[];
  if (course.lifecycle !== 'active')
    return { members, invitations: [] as CourseInvitation[] };
  const invitationResult = await supabase.rpc('list_course_invitations', {
    p_course: courseId,
  });
  if (invitationResult.error)
    throw new Error('Course invitations could not be loaded.');
  return {
    members,
    invitations: (invitationResult.data ?? []) as CourseInvitation[],
  };
}

export default async function CoursePage({
  params,
}: PageProps<'/courses/[courseId]'>) {
  const { courseId } = await params;
  const { user, role: platformRole, supabase } = await getVerifiedUserRole();
  if (!user || !supabase) redirect('/sign-in');
  if (!platformRole) redirect('/unauthorized');
  const view = await loadCourseView(supabase, courseId, user.id);
  if (!view) notFound();
  return (
    <CourseWorkspace
      course={view.course}
      role={view.role}
      currentUserId={user.id}
      features={view.features}
      initialMembers={view.members}
      initialInvitations={view.invitations}
      platformAdmin={platformRole === 'admin'}
    />
  );
}
