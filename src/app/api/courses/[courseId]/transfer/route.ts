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
const transferSchema = z.object({ newOwnerId: z.string().uuid() }).strict();
async function transferCourse(request: NextRequest, courseId: string) {
  const originError = requestOriginError(request);
  if (originError) return originError;
  const parsed = await parsedBody(request, {
    schema: transferSchema,
    maxBytes: 1_000,
    code: 'invalid_owner',
    message: 'New owner is invalid.',
  });
  if ('response' in parsed) return parsed.response;
  const auth = await courseAccount();
  if ('response' in auth) return auth.response;
  try {
    const { error } = await auth.supabase.rpc('transfer_course_ownership', {
      p_course: courseId,
      p_new_owner: parsed.data.newOwnerId,
    });
    const denied = rpcError(error, {
      code: 'ownership_transfer_denied',
      message: 'Course ownership could not be transferred.',
      statuses: { '42501': 403 },
    });
    return denied ?? privateJson({ status: 'transferred' });
  } catch {
    return apiError(
      'ownership_transfer_failed',
      'Course ownership could not be transferred.',
      503,
    );
  }
}
export async function POST(
  request: NextRequest,
  context: RouteContext<'/api/courses/[courseId]/transfer'>,
) {
  const { courseId } = await context.params;
  return isCourseId(courseId)
    ? transferCourse(request, courseId)
    : apiError('course_unavailable', 'Course could not be found.', 404);
}
