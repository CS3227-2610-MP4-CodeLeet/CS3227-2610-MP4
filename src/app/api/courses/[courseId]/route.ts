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
const fields =
  'id,owner_id,created_by,title,description,lifecycle,is_legacy,created_at,updated_at';
const courseReadFailed = () =>
  apiError('course_read_failed', 'Course could not be loaded.', 503);
const courseUnavailable = () =>
  apiError('course_unavailable', 'Course could not be found.', 404);
const patchSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    description: z.string().max(4000).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0);
const lifecycleSchema = z
  .object({
    confirm: z.literal(true),
    action: z.enum(['archive', 'delete-empty']),
  })
  .strict();
async function readCourse(courseId: string) {
  const auth = await courseAccount();
  if ('response' in auth) return auth.response;
  const { data: course, error } = await auth.supabase
    .from('courses')
    .select(fields)
    .eq('id', courseId)
    .maybeSingle();
  if (error) return courseReadFailed();
  if (!course) return courseUnavailable();
  const [membership, features] = await Promise.all([
    auth.supabase
      .from('course_memberships')
      .select('role')
      .eq('course_id', courseId)
      .eq('user_id', auth.user.id)
      .maybeSingle(),
    auth.supabase
      .from('course_features')
      .select('feature,enabled')
      .eq('course_id', courseId),
  ]);
  if (!membership.data) return courseUnavailable();
  if (features.error) return courseReadFailed();
  return privateJson({
    course,
    role: membership.data.role,
    features: features.data ?? [],
  });
}
async function updateCourse(request: NextRequest, courseId: string) {
  const originError = requestOriginError(request);
  if (originError) return originError;
  const auth = await courseAccount();
  if ('response' in auth) return auth.response;
  const parsed = await parsedBody(request, {
    schema: patchSchema,
    maxBytes: 5_000,
    code: 'invalid_course',
    message: 'Course details are invalid.',
  });
  if ('response' in parsed) return parsed.response;
  const { data, error } = await auth.supabase.rpc('update_course', {
    p_course: courseId,
    p_title: parsed.data.title ?? null,
    p_description: parsed.data.description ?? null,
  });
  const denied = rpcError(error, {
    code: 'course_update_denied',
    message: 'Course could not be updated.',
    statuses: { '42501': 403, P0002: 404 },
  });
  return denied ?? privateJson({ course: data });
}
async function changeLifecycle(request: NextRequest, courseId: string) {
  const originError = requestOriginError(request);
  if (originError) return originError;
  const parsed = await parsedBody(request, {
    schema: lifecycleSchema,
    maxBytes: 1_000,
    code: 'confirmation_required',
    message: 'Confirm the course action explicitly.',
  });
  if ('response' in parsed) return parsed.response;
  const auth = await courseAccount();
  if ('response' in auth) return auth.response;
  const action = parsed.data.action;
  const rpc = action === 'archive' ? 'archive_course' : 'delete_empty_course';
  const args =
    action === 'archive'
      ? { p_course: courseId }
      : { p_course: courseId, p_confirm: true };
  const { error } = await auth.supabase.rpc(rpc, args);
  const denied = rpcError(error, {
    code: 'course_lifecycle_denied',
    message:
      error?.code === '23514'
        ? 'Only an empty course can be deleted.'
        : 'Course action was denied.',
    statuses: { '42501': 403, '23514': 409, P0002: 404 },
  });
  return (
    denied ??
    privateJson({ status: action === 'archive' ? 'archived' : 'deleted' })
  );
}
export async function GET(
  _request: NextRequest,
  context: RouteContext<'/api/courses/[courseId]'>,
) {
  const { courseId } = await context.params;
  if (!isCourseId(courseId)) return courseUnavailable();
  try {
    return await readCourse(courseId);
  } catch {
    return courseReadFailed();
  }
}
export async function PATCH(
  request: NextRequest,
  context: RouteContext<'/api/courses/[courseId]'>,
) {
  const { courseId } = await context.params;
  return isCourseId(courseId)
    ? updateCourse(request, courseId)
    : courseUnavailable();
}
export async function DELETE(
  request: NextRequest,
  context: RouteContext<'/api/courses/[courseId]'>,
) {
  const { courseId } = await context.params;
  return isCourseId(courseId)
    ? changeLifecycle(request, courseId)
    : courseUnavailable();
}
