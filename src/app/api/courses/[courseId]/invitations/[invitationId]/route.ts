import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { getVerifiedUserRole } from '@/lib/auth/verified-user';
import { sameOriginRequest } from '@/lib/http/request';
import { privateJson } from '@/lib/http/responses';
export async function DELETE(
  request: NextRequest,
  context: RouteContext<'/api/courses/[courseId]/invitations/[invitationId]'>,
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
  const { courseId, invitationId } = await context.params;
  if (
    !z.string().uuid().safeParse(courseId).success ||
    !z.string().uuid().safeParse(invitationId).success
  )
    return privateJson(
      {
        error: {
          code: 'invitation_unavailable',
          message: 'Invitation could not be found.',
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
    const { error } = await supabase.rpc('revoke_course_invitation', {
      p_invitation: invitationId,
    });
    if (error)
      return privateJson(
        {
          error: {
            code: 'invitation_revoke_denied',
            message: 'Invitation could not be revoked.',
          },
        },
        error.code === '42501' ? 403 : 404,
      );
    return privateJson({ status: 'revoked' });
  } catch {
    return privateJson(
      {
        error: {
          code: 'invitation_revoke_failed',
          message: 'Invitation could not be revoked.',
        },
      },
      503,
    );
  }
}
