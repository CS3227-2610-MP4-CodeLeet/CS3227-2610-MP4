import {
  loadAssignmentProgress,
  loadUpcomingAssignments,
} from '@/features/student-progress/assignments.server';
import {
  loadRecentGrades,
  loadRecentSubmissions,
} from '@/features/student-progress/activity.server';
import { loadOwnXp } from '@/features/assignment-xp/queries.server';
import { ProgressOverview } from '@/features/student-progress/components';
import { notFound } from 'next/navigation';
import { requireMember } from '@/lib/auth/verified-user';
import { readCourseAccess } from '@/lib/courses/access';
import type { CourseAccess } from '@/lib/courses/access';

async function section<T>(promise: Promise<T>) {
  try {
    return await promise;
  } catch {
    return null;
  }
}

function canViewFeature(access: CourseAccess | null) {
  return Boolean(
    access?.role === 'student' &&
    (access.lifecycle === 'archived' || access.featureEnabled),
  );
}

async function progressFeatures(
  supabase: Awaited<ReturnType<typeof requireMember>>['supabase'],
  userId: string,
  courseId: string,
) {
  const [assessmentAccess, xpAccess] = await Promise.all([
    readCourseAccess(supabase, userId, courseId, 'assessments'),
    readCourseAccess(supabase, userId, courseId, 'xp'),
  ]);
  return {
    assessmentsEnabled: canViewFeature(assessmentAccess),
    xpEnabled: canViewFeature(xpAccess),
  };
}

function loadWhenEnabled<T>(enabled: boolean, load: () => Promise<T>) {
  return enabled ? section(load()) : Promise.resolve(null);
}

export default async function CourseProgressPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const { supabase, user } = await requireMember();

  const { assessmentsEnabled, xpEnabled } = await progressFeatures(
    supabase,
    user.id,
    courseId,
  );
  if (!assessmentsEnabled && !xpEnabled) notFound();

  const now = new Date().toISOString();
  const [assignments, upcoming, submissions, grades, xp] = await Promise.all([
    loadWhenEnabled(assessmentsEnabled, () =>
      loadAssignmentProgress(supabase, user.id, courseId, now),
    ),
    loadWhenEnabled(assessmentsEnabled, () =>
      loadUpcomingAssignments(supabase, user.id, courseId, now),
    ),
    loadWhenEnabled(assessmentsEnabled, () =>
      loadRecentSubmissions(supabase, user.id, courseId),
    ),
    loadWhenEnabled(assessmentsEnabled, () =>
      loadRecentGrades(supabase, user.id, courseId),
    ),
    loadWhenEnabled(xpEnabled, () => loadOwnXp(supabase, courseId, 1)),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <ProgressOverview
        courseId={courseId}
        assessmentsEnabled={assessmentsEnabled}
        xpEnabled={xpEnabled}
        data={{
          assignments,
          upcoming,
          submissions,
          grades,
          xp: xp?.total_xp ?? null,
        }}
      />
    </main>
  );
}
