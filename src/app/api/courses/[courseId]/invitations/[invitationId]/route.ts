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

type SupabaseClient = Extract<
  Awaited<ReturnType<typeof courseAccount>>,
  { supabase: unknown }
>['supabase'];

async function checkCourseInvitation(
  supabase: SupabaseClient,
  courseId: string,
  invitationId: string,
) {
  const { data, error } = await supabase.rpc('list_course_invitations', {
    p_course: courseId,
  });
  if (error) return error.code === '42501' ? 403 : 404;
  const exists = ((data ?? []) as Array<{ id: string }>).some(
    (inv) => inv.id === invitationId,
  );
  return exists ? 200 : 404;
}

async function revokeInvitation(
  auth: Awaited<ReturnType<typeof courseAccount>>,
  courseId: string,
  invitationId: string,
) {
  if ('response' in auth && auth.response) return auth.response;
  const check = await checkCourseInvitation(
    auth.supabase,
    courseId,
    invitationId,
  );
  if (check === 403) return privateJson(REVOKE_DENIED, 403);
  if (check === 404) return privateJson(INVITATION_UNAVAILABLE, 404);

  const { error } = await auth.supabase.rpc('revoke_course_invitation', {
    p_invitation: invitationId,
  });
  if (error)
    return privateJson(REVOKE_DENIED, error.code === '42501' ? 403 : 404);
  return privateJson({ status: 'revoked' });
}

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
    return await revokeInvitation(auth, courseId, invitationId);
  } catch {
    return apiError(
      'invitation_revoke_failed',
      'Invitation could not be revoked.',
      503,
    );
  }
}
