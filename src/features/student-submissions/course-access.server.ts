import 'server-only';
import type { createSupabaseServerClient } from '@/lib/supabase/server';
import { readCourseAccess } from '@/lib/courses/access';

type SupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export async function courseIdForStudentSubmission(
  supabase: SupabaseClient,
  studentId: string,
  submissionId: string,
) {
  const { data, error } = await supabase
    .from('submissions')
    .select('assignments!inner(course_id)')
    .eq('id', submissionId)
    .eq('student_id', studentId)
    .maybeSingle();
  if (error || !data) return null;
  const assignment = Array.isArray(data.assignments)
    ? data.assignments[0]
    : data.assignments;
  return assignment?.course_id ?? null;
}

export async function hasStudentAssessmentAccess(
  supabase: SupabaseClient,
  studentId: string,
  courseId: string,
) {
  const access = await readCourseAccess(
    supabase,
    studentId,
    courseId,
    'assessments',
  );
  return (
    access?.role === 'student' &&
    (access.lifecycle === 'archived' || access.featureEnabled)
  );
}
