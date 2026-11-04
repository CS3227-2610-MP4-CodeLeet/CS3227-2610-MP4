import { type NextRequest } from 'next/server';
import { z } from 'zod';
import {
  apiError,
  courseAccount,
  parsedBody,
  requestOriginError,
  rpcError,
} from '@/features/course-workspaces/http';
import { privateJson } from '@/lib/http/responses';
const joinSchema = z
  .object({ code: z.string().trim().min(20).max(128) })
  .strict();
async function joinCourse(request: NextRequest) {
  const originError = requestOriginError(request);
  if (originError) return originError;
  const parsed = await parsedBody(request, {
    schema: joinSchema,
    maxBytes: 1_000,
    code: 'invalid_join_code',
    message: 'Join code is invalid.',
  });
  if ('response' in parsed) return parsed.response;
  const auth = await courseAccount();
  if ('response' in auth) return auth.response;
  if (auth.user.email_confirmed_at == null)
    return apiError(
      'verified_email_required',
      'Verify your email before joining a course.',
      403,
    );
  try {
    const { data, error } = await auth.supabase.rpc('join_course_by_code', {
      p_code: parsed.data.code,
    });
    const failure = rpcError(error, {
      code: 'join_failed',
      message: 'Course could not be joined.',
      fallback: 503,
    });
    if (failure) return failure;
    return data
      ? privateJson({ courseId: data })
      : apiError(
          'join_unavailable',
          'Join code is invalid or unavailable.',
          404,
        );
  } catch {
    return apiError('join_failed', 'Course could not be joined.', 503);
  }
}
export async function POST(request: NextRequest) {
  return joinCourse(request);
}
