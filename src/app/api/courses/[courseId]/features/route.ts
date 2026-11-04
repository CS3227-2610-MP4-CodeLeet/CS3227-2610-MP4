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

const featureSchema = z
  .object({
    feature: z.enum(['assessments', 'ai', 'discussions', 'xp', 'leaderboard']),
    enabled: z.boolean(),
  })
  .strict();

export async function PUT(
  request: NextRequest,
  context: RouteContext<'/api/courses/[courseId]/features'>,
) {
  const originError = requestOriginError(request);
  if (originError) return originError;
  const { courseId } = await context.params;
  if (!isCourseId(courseId))
    return apiError('course_unavailable', 'Course could not be found.', 404);
  const parsed = await parsedBody(request, {
    schema: featureSchema,
    maxBytes: 1_000,
    code: 'invalid_feature',
    message: 'Course feature setting is invalid.',
  });
  if ('response' in parsed) return parsed.response;
  const auth = await courseAccount();
  if ('response' in auth) return auth.response;
  try {
    const { error } = await auth.supabase.rpc('set_course_feature', {
      p_course: courseId,
      p_feature: parsed.data.feature,
      p_enabled: parsed.data.enabled,
    });
    const denied = rpcError(error, {
      code: 'feature_update_denied',
      message: 'Course feature setting could not be changed.',
      statuses: { '42501': 403, P0002: 404 },
    });
    return denied ?? privateJson({ status: 'updated' });
  } catch {
    return apiError(
      'feature_update_failed',
      'Course feature setting could not be changed.',
      503,
    );
  }
}
