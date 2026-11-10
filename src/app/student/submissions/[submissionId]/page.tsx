import { notFound, redirect } from 'next/navigation';
import {
  courseIdForStudentSubmission,
  hasStudentAssessmentAccess,
} from '@/features/student-submissions/course-access.server';
import { requireMember } from '@/lib/auth/verified-user';

export default async function LegacyStudentSubmissionPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const { submissionId } = await params;
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
  redirect(
    `/courses/${encodeURIComponent(courseId)}/submissions/${encodeURIComponent(submissionId)}`,
  );
}
