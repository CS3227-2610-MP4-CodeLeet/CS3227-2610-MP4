import { randomBytes } from 'node:crypto';
import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { getVerifiedUserRole } from '@/lib/auth/verified-user';
import { sameOriginRequest } from '@/lib/http/request';
import { privateJson } from '@/lib/http/responses';
const courseIdSchema = z.string().uuid();

export async function PUT(
  request: NextRequest,
  context: RouteContext<'/api/courses/[courseId]/join-code'>,
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
  const { courseId } = await context.params;
  if (!courseIdSchema.safeParse(courseId).success)
    return privateJson(
      {
        error: {
          code: 'course_unavailable',
          message: 'Course could not be found.',
        },
      },
      404,
    );
  try {
    const { supabase, user, role } = await getVerifiedUserRole();
    if (!user || !supabase)
      return privateJson(
        { error: { code: 'unauthorized', message: 'Sign in required.' } },
        401,
      );
    if (!role)
      return privateJson(
        { error: { code: 'forbidden', message: 'Course account required.' } },
        403,
      );
    const code = randomBytes(24).toString('base64url');
    const { error } = await supabase.rpc('rotate_course_join_code', {
      p_course: courseId,
      p_code: code,
    });
    if (error)
      return privateJson(
        {
          error: {
            code: 'join_code_denied',
            message: 'Join code could not be updated.',
          },
        },
        error.code === '42501' ? 403 : 400,
      );
    return privateJson({ code });
  } catch {
    return privateJson(
      {
        error: {
          code: 'join_code_failed',
          message: 'Join code could not be updated.',
        },
      },
      503,
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext<'/api/courses/[courseId]/join-code'>,
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
  const { courseId } = await context.params;
  if (!courseIdSchema.safeParse(courseId).success)
    return privateJson(
      {
        error: {
          code: 'course_unavailable',
          message: 'Course could not be found.',
        },
      },
      404,
    );
  try {
    const { supabase, user, role } = await getVerifiedUserRole();
    if (!user || !supabase)
      return privateJson(
        { error: { code: 'unauthorized', message: 'Sign in required.' } },
        401,
      );
    if (!role)
      return privateJson(
        { error: { code: 'forbidden', message: 'Course account required.' } },
        403,
      );
    const { error } = await supabase.rpc('revoke_course_join_code', {
      p_course: courseId,
    });
    if (error)
      return privateJson(
        {
          error: {
            code: 'join_code_denied',
            message: 'Join code could not be revoked.',
          },
        },
        error.code === '42501' ? 403 : 400,
      );
    return privateJson({ status: 'revoked' });
  } catch {
    return privateJson(
      {
        error: {
          code: 'join_code_failed',
          message: 'Join code could not be revoked.',
        },
      },
      503,
    );
  }
}
