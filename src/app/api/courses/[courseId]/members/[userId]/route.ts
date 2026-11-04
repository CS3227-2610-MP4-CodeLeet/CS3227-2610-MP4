import { type NextRequest } from 'next/server';
import { z } from 'zod';
import {
  apiError,
  courseAccount,
  isCourseId,
  parsedBody,
  requestOriginError,
  rpcError,
} from '@/features/course-workspaces/http';
import { privateJson } from '@/lib/http/responses';
const roleSchema = z
  .object({ role: z.enum(['student', 'instructor']) })
  .strict();
const memberUnavailable = () =>
  apiError('member_unavailable', 'Course member could not be found.', 404);
async function setCourseMember(
  request: NextRequest,
  courseId: string,
  userId: string,
  role: 'student' | 'instructor' | null,
) {
  const originError = requestOriginError(request);
  if (originError) return originError;
  const auth = await courseAccount();
  if ('response' in auth) return auth.response;
  try {
    const { error } = await auth.supabase.rpc('set_course_member', {
      p_course: courseId,
      p_user: userId,
      p_role: role,
    });
    const denied = rpcError(error, {
      code: role ? 'member_update_denied' : 'member_remove_denied',
      message: 'Course member could not be changed.',
      statuses: { '42501': 403 },
    });
    return denied ?? privateJson({ status: role ? 'updated' : 'removed' });
  } catch {
    return apiError(
      'member_change_failed',
      'Course member could not be changed.',
      503,
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext<'/api/courses/[courseId]/members/[userId]'>,
) {
  const { courseId, userId } = await context.params;
  if (!isCourseId(courseId) || !isCourseId(userId)) return memberUnavailable();
  const originError = requestOriginError(request);
  if (originError) return originError;
  const parsed = await parsedBody(request, {
    schema: roleSchema,
    maxBytes: 1_000,
    code: 'invalid_member_role',
    message: 'Member role is invalid.',
  });
  if ('response' in parsed) return parsed.response;
  return setCourseMember(request, courseId, userId, parsed.data.role);
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext<'/api/courses/[courseId]/members/[userId]'>,
) {
  const { courseId, userId } = await context.params;
  if (!isCourseId(courseId) || !isCourseId(userId)) return memberUnavailable();
  return setCourseMember(request, courseId, userId, null);
}
