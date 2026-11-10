import { notFound, redirect } from 'next/navigation';
import {
  courseIdForStudentSubmission,
  hasStudentAssessmentAccess,
} from '@/features/student-submissions/course-access.server';
import { requireMember } from '@/lib/auth/verified-user';

export default async function LegacyStudentSubmissionComparePage({
  params,
  searchParams,
}: {
  params: Promise<{ submissionId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ submissionId }, query] = await Promise.all([params, searchParams]);
  const { supabase, user, role } = await requireMember();
  if (role !== 'student') notFound();
  const courseId = await courseIdForStudentSubmission(
    supabase,
    user.id,
    submissionId,
  );
  if (
    !courseId ||
    !(await hasStudentAssessmentAccess(supabase, user.id, courseId))
  )
    notFound();
  const selection = new URLSearchParams();
  for (const key of ['before', 'after']) {
    const value = query[key];
    if (typeof value === 'string') selection.set(key, value);
  }
  const suffix = selection.size ? `?${selection.toString()}` : '';
  redirect(
    `/courses/${encodeURIComponent(courseId)}/submissions/${encodeURIComponent(submissionId)}/compare${suffix}`,
  );
}
