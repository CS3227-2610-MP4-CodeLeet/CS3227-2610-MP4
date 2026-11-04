import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { assignmentInputSchema } from '@/features/codementor/contracts';
import { getVerifiedUserRole } from '@/lib/auth/verified-user';
import { readCourseAccess } from '@/lib/courses/access';
import { saveCourseAssignment } from '../route';
import { readJsonBody, sameOriginRequest } from '@/lib/http/request';
import { privateJson } from '@/lib/http/responses';

const updateSchema = assignmentInputSchema
  .extend({ expectedVersion: z.number().int().min(1) })
  .strict();
function unavailable() {
  return privateJson(
    { error: { code: 'not_found', message: 'Assignment is unavailable.' } },
    404,
  );
}

// eslint-disable-next-line complexity, max-lines-per-function -- keep request validation and course authorization in one auditable sequence.
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!sameOriginRequest(request))
    return privateJson(
      {
        error: {
          code: 'origin_rejected',
          message: 'Request origin could not be verified.',
        },
      },
      403,
    );
  const { supabase, user } = await getVerifiedUserRole();
  if (!user)
    return privateJson(
      { error: { code: 'unauthorized', message: 'Sign in required.' } },
      401,
    );
  const { id } = await context.params;
  if (!z.uuid().safeParse(id).success) return unavailable();
  const body = await readJsonBody(request, 18_000);
  if (!body.ok)
    return privateJson(
      {
        error: {
          code: 'invalid_body',
          message: 'Request must be bounded JSON.',
        },
      },
      400,
    );
  const parsed = updateSchema.safeParse(body.value);
  if (!parsed.success)
    return privateJson(
      {
        error: {
          code: 'invalid_assignment',
          message: 'Assignment details are invalid.',
        },
      },
      400,
    );
  const { data: assignment, error: assignmentError } = await supabase
    .from('assignments')
    .select('course_id')
    .eq('id', id)
    .maybeSingle();
  if (
    assignmentError ||
    !assignment ||
    assignment.course_id !== parsed.data.courseId
  )
    return unavailable();
  const access = await readCourseAccess(
    supabase,
    user.id,
    parsed.data.courseId,
    'assessments',
  );
  if (
    !access ||
    access.role !== 'instructor' ||
    access.lifecycle !== 'active' ||
    !access.featureEnabled
  )
    return unavailable();
  return saveCourseAssignment(supabase, {
    courseId: parsed.data.courseId,
    assignmentId: id,
    expectedVersion: parsed.data.expectedVersion,
    input: parsed.data,
    status: 200,
  });
}
