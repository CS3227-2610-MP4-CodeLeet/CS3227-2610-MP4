import { requireRole } from '@/lib/auth/verified-user';
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

async function section<T>(promise: Promise<T>) {
  try {
    return await promise;
  } catch {
    return null;
  }
}

export default async function ProgressPage() {
  const { supabase, user } = await requireRole('student');
  const now = new Date().toISOString();
  const [assignments, upcoming, submissions, grades, xp] = await Promise.all([
    section(loadAssignmentProgress(supabase, user.id, now)),
    section(loadUpcomingAssignments(supabase, user.id, now)),
    section(loadRecentSubmissions(supabase, user.id)),
    section(loadRecentGrades(supabase, user.id)),
    section(loadOwnXp(supabase, 1)),
  ]);
  return (
    <ProgressOverview
      data={{
        assignments,
        upcoming,
        submissions,
        grades,
        xp: xp?.total_xp ?? null,
      }}
    />
  );
}
