import { z } from 'zod';
import { getVerifiedUserRole } from '@/lib/auth/verified-user';
import { readCourseAccess } from '@/lib/courses/access';
import { privateJson } from '@/lib/http/responses';

const NOT_FOUND = {
  error: { code: 'not_found', message: 'Submission not found.' },
};

// eslint-disable-next-line complexity, sonarjs/cognitive-complexity -- preserve the explicit private response for each access boundary.
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { supabase, user } = await getVerifiedUserRole();
  if (!user)
    return privateJson(
      { error: { code: 'unauthorized', message: 'Sign in required.' } },
      401,
    );
  const { id } = await context.params;
  if (!z.uuid().safeParse(id).success) return privateJson(NOT_FOUND, 404);
  const { data, error } = await supabase
    .from('submissions')
    .select(
      'id,assignment_id,student_id,source,language,revision,created_at,is_late,due_at_submission,assignments(course_id,title,instructions,language),grades(id,scores,feedback,total_score,published_at,version)',
    )
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return privateJson(NOT_FOUND, 404);
  if (data.student_id !== user.id) {
    const assignment = Array.isArray(data.assignments)
      ? data.assignments[0]
      : data.assignments;
    if (!assignment) return privateJson(NOT_FOUND, 404);
    const access = await readCourseAccess(
      supabase,
      user.id,
      assignment.course_id,
      'assessments',
    );
    if (access?.role !== 'instructor') return privateJson(NOT_FOUND, 404);
  } else {
    const assignment = Array.isArray(data.assignments)
      ? data.assignments[0]
      : data.assignments;
    if (!assignment) return privateJson(NOT_FOUND, 404);
    const access = await readCourseAccess(
      supabase,
      user.id,
      assignment.course_id,
      'assessments',
    );
    if (!access) return privateJson(NOT_FOUND, 404);
  }
  return privateJson({ submission: data });
}
