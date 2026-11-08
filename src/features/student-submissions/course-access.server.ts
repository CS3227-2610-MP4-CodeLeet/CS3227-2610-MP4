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
    .select('course_id')
    .eq('id', submissionId)
    .eq('student_id', studentId)
    .maybeSingle();
  if (error || !data) return null;
  return data.course_id;
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

export async function hasStudentAiReviewAccess(
  supabase: SupabaseClient,
  studentId: string,
  courseId: string,
) {
  return hasActiveAiReviewAccess(supabase, studentId, courseId, 'student');
}

export async function hasInstructorAiReviewAccess(
  supabase: SupabaseClient,
  instructorId: string,
  courseId: string,
) {
  return hasActiveAiReviewAccess(
    supabase,
    instructorId,
    courseId,
    'instructor',
  );
}

async function hasActiveAiReviewAccess(
  supabase: SupabaseClient,
  userId: string,
  courseId: string,
  role: 'student' | 'instructor',
) {
  const access = await readCourseAccess(supabase, userId, courseId, 'ai');
  return (
    access?.role === role &&
    access.lifecycle === 'active' &&
    access.featureEnabled
  );
}
