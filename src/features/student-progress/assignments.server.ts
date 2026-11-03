import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  PROGRESS_LIST_LIMIT,
  upcomingAssignmentsSchema,
  type AssignmentProgress,
} from './contracts';

function outstandingAssignments(
  client: SupabaseClient,
  studentId: string,
  courseId: string,
  countOnly = false,
) {
  return client
    .from('assignments')
    .select(
      countOnly ? 'id,submissions()' : 'id,title,language,due_at,submissions()',
      countOnly ? { count: 'exact', head: true } : {},
    )
    .eq('publication_status', 'published')
    .eq('course_id', courseId)
    .eq('submissions.student_id', studentId)
    .is('submissions', null);
}

export async function loadAssignmentProgress(
  client: SupabaseClient,
  studentId: string,
  courseId: string,
  now: string,
): Promise<AssignmentProgress | null> {
  try {
    const results = await Promise.all([
      client
        .from('assignments')
        .select('id', { count: 'exact', head: true })
        .eq('publication_status', 'published')
        .eq('course_id', courseId),
      outstandingAssignments(client, studentId, courseId, true),
      outstandingAssignments(client, studentId, courseId, true).lt(
        'due_at',
        now,
      ),
    ]);
    if (
      results.some(
        ({ error, count }) =>
          error || count === null || !Number.isSafeInteger(count) || count < 0,
      )
    )
      return null;
    const [total, outstanding, overdue] = results.map(({ count }) => count!);
    if (outstanding > total || overdue > outstanding) return null;
    return { total, submitted: total - outstanding, outstanding, overdue };
  } catch {
    return null;
  }
}

export async function loadUpcomingAssignments(
  client: SupabaseClient,
  studentId: string,
  courseId: string,
  now: string,
) {
  try {
    const { data, error } = await outstandingAssignments(
      client,
      studentId,
      courseId,
    )
      .gte('due_at', now)
      .order('due_at', { ascending: true })
      .order('id', { ascending: true })
      .limit(PROGRESS_LIST_LIMIT);
    if (error) return null;
    return upcomingAssignmentsSchema.parse(data);
  } catch {
    return null;
  }
}
