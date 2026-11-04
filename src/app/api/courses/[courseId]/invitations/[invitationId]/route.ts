import { type NextRequest } from 'next/server';
import {
  apiError,
  courseAccount,
  isCourseId,
  requestOriginError,
} from '@/features/course-workspaces/http';
import { privateJson } from '@/lib/http/responses';

const INVITATION_UNAVAILABLE = {
  error: {
    code: 'invitation_unavailable',
    message: 'Invitation could not be found.',
  },
};

const REVOKE_DENIED = {
  error: {
    code: 'invitation_revoke_denied',
    message: 'Invitation could not be revoked.',
  },
};

export async function DELETE(
  request: NextRequest,
  context: RouteContext<'/api/courses/[courseId]/invitations/[invitationId]'>,
): Promise<Response> {
  const originError = requestOriginError(request);
  if (originError) return originError;

  const { courseId, invitationId } = await context.params;
  if (!isCourseId(courseId) || !isCourseId(invitationId))
    return privateJson(INVITATION_UNAVAILABLE, 404);

  try {
    const auth = await courseAccount();
    if ('response' in auth && auth.response) return auth.response;

    const { error } = await auth.supabase.rpc('revoke_course_invitation', {
      p_invitation: invitationId,
      p_course: courseId,
    });
    if (error)
      return privateJson(REVOKE_DENIED, error.code === '42501' ? 403 : 404);
    return privateJson({ status: 'revoked' });
  } catch {
    return apiError(
      'invitation_revoke_failed',
      'Invitation could not be revoked.',
      503,
    );
  }
}
