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
const courseSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    description: z.string().max(4000).default(''),
  })
  .strict();
const courseFields =
  'id,owner_id,created_by,title,description,lifecycle,is_legacy,created_at,updated_at';
export async function GET() {
  try {
    const auth = await courseAccount();
    if ('response' in auth) return auth.response;
    const { data, error } = await auth.supabase
      .from('courses')
      .select(courseFields)
      .order('created_at', { ascending: false });
    if (error)
      return apiError(
        'course_read_failed',
        'Courses could not be loaded.',
        503,
      );
    return privateJson({ courses: data ?? [] });
  } catch {
    return apiError('course_read_failed', 'Courses could not be loaded.', 503);
  }
}
export async function POST(request: NextRequest) {
  const originError = requestOriginError(request);
  if (originError) return originError;
  const auth = await courseAccount();
  if ('response' in auth) return auth.response;
  const parsed = await parsedBody(request, {
    schema: courseSchema,
    maxBytes: 5_000,
    code: 'invalid_course',
    message: 'Course details are invalid.',
  });
  if ('response' in parsed) return parsed.response;
  try {
    const { data, error } = await auth.supabase.rpc('create_course', {
      p_title: parsed.data.title,
      p_description: parsed.data.description,
    });
    const denied = rpcError(error, {
      code: 'course_create_denied',
      message: 'Course could not be created.',
      statuses: { '42501': 403 },
    });
    if (denied) return denied;
    return privateJson({ courseId: data }, 201);
  } catch {
    return apiError(
      'course_create_failed',
      'Course could not be created.',
      503,
    );
  }
}
