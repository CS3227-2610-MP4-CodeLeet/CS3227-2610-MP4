import { notFound, redirect } from 'next/navigation';
import { getVerifiedUserRole } from '@/lib/auth/verified-user';
import { BreadcrumbSetter } from '@/components/layout/breadcrumb-context';
import { JoinCodeManagement } from '@/features/course-workspaces/course-access';
import { CoursePeople } from '@/features/course-workspaces/course-people';
import type {
  CourseMember,
  CourseInvitation,
  CourseWorkspaceRecord,
} from '@/features/course-workspaces/contracts';

export const dynamic = 'force-dynamic';

async function loadManageUsersData(
  supabase: NonNullable<Awaited<ReturnType<typeof getVerifiedUserRole>>['supabase']>,
  courseId: string,
  userId: string,
) {
  const [courseResult, membershipResult] = await Promise.all([
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
  ]);

  if (courseResult.error || membershipResult.error) {
    throw new Error('Course details could not be loaded.');
  }

  if (
    !courseResult.data ||
    !membershipResult.data ||
    membershipResult.data.role !== 'instructor'
  ) {
    notFound();
  }

  const course = courseResult.data as CourseWorkspaceRecord;

  let members: CourseMember[] = [];
  let invitations: CourseInvitation[] = [];

  if (!course.is_legacy) {
    const membersResult = await supabase.rpc('list_course_members', {
      p_course: courseId,
    });
    if (membersResult.error) {
      throw new Error('Course members could not be loaded.');
    }
    members = (membersResult.data ?? []) as CourseMember[];

    if (course.lifecycle === 'active') {
      const invitationResult = await supabase.rpc('list_course_invitations', {
        p_course: courseId,
      });
      if (invitationResult.error) {
        throw new Error('Course invitations could not be loaded.');
      }
      invitations = (invitationResult.data ?? []) as CourseInvitation[];
    }
  }

  return {
    course,
    members,
    invitations,
  };
}

export default async function ManageUsersPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const { user, supabase } = await getVerifiedUserRole();

  if (!user || !supabase) redirect('/sign-in');

  const { course, members, invitations } = await loadManageUsersData(
    supabase,
    courseId,
    user.id,
  );

  const isOwner = course.owner_id === user.id;

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-8">
      <BreadcrumbSetter title="Manage Users" />
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold">Manage Users</h1>
        <p className="text-sm text-muted-foreground">
          Manage student join codes, course staff, and enrolled students.
        </p>
      </header>

      {course.lifecycle === 'active' && (
        <section className="rounded-xl border bg-card p-5">
          <JoinCodeManagement courseId={course.id} />
        </section>
      )}

      <CoursePeople
        course={course}
        currentUserId={user.id}
        isOwner={isOwner}
        members={members}
        invitations={invitations}
      />
    </main>
  );
}
