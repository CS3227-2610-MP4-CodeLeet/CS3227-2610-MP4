import { notFound, redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { getVerifiedUserRole } from '@/lib/auth/verified-user';
import { BreadcrumbProvider } from '@/components/layout/breadcrumb-context';
import { CourseWorkspaceShell } from '@/components/layout/course-workspace-shell';
import { loadOwnXp } from '@/features/assignment-xp/queries.server';
import type { CourseFeatureSetting } from '@/features/course-workspaces/contracts';

export const dynamic = 'force-dynamic';

async function fetchCourseWorkspaceData(
  supabase: Parameters<typeof loadOwnXp>[0],
  courseId: string,
  userId: string,
) {
  const [courseResult, membershipResult, featureResult, profileResult] =
    await Promise.all([
      supabase
        .from('courses')
        .select('id,owner_id,title,description,lifecycle,is_legacy')
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
      supabase
        .from('profiles')
        .select('display_name')
        .eq('id', userId)
        .maybeSingle(),
    ]);

  if (courseResult.error || membershipResult.error || featureResult.error) {
    throw new Error('Course workspace could not be loaded.');
  }

  if (!courseResult.data || !membershipResult.data) {
    notFound();
  }

  return {
    course: courseResult.data,
    courseRole: membershipResult.data.role as 'student' | 'instructor',
    features: (featureResult.data ?? []) as CourseFeatureSetting[],
    profileDisplayName: profileResult.data?.display_name ?? null,
  };
}

async function resolveTotalXp(
  supabase: Parameters<typeof loadOwnXp>[0],
  courseId: string,
  courseRole: 'student' | 'instructor',
  features: CourseFeatureSetting[],
): Promise<string | null> {
  const isXpEnabled = features.some((f) => f.feature === 'xp' && f.enabled);
  if (courseRole === 'student' && isXpEnabled) {
    const xpSummary = await loadOwnXp(supabase, courseId, 1);
    return xpSummary?.total_xp ?? null;
  }
  return null;
}

export default async function CourseWorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const { user, role: platformRole, supabase } = await getVerifiedUserRole();

  if (!user || !supabase) redirect('/sign-in');
  if (!platformRole) redirect('/unauthorized');

  const { course, courseRole, features, profileDisplayName } =
    await fetchCourseWorkspaceData(supabase, courseId, user.id);

  const displayName = profileDisplayName || user.email?.split('@')[0] || 'User';
  const totalXp = await resolveTotalXp(
    supabase,
    courseId,
    courseRole,
    features,
  );

  return (
    <BreadcrumbProvider>
      <CourseWorkspaceShell
        course={course}
        role={courseRole}
        userName={displayName}
        totalXp={totalXp}
        features={features}
      >
        {children}
      </CourseWorkspaceShell>
    </BreadcrumbProvider>
  );
}
