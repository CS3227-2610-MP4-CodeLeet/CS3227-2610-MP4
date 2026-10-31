import { NextRequest } from 'next/server';
import { roleChangeSchema, userIdSchema } from '@/features/admin-users/contracts';
import { getVerifiedUserRole } from '@/lib/auth/verified-user';
import { readJsonBody, sameOriginRequest } from '@/lib/http/request';
import { privateJson } from '@/lib/http/responses';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  if (!sameOriginRequest(request))
    return privateJson(
      { error: { code: 'origin_rejected', message: 'Request origin could not be verified.' } },
      403,
    );
  const { supabase, user, role } = await getVerifiedUserRole();
  if (!user)
    return privateJson(
      { error: { code: 'unauthorized', message: 'Sign in required.' } },
      401,
    );
  if (role !== 'admin')
    return privateJson(
      { error: { code: 'forbidden', message: 'Admin access required.' } },
      403,
    );
  const { userId } = await context.params;
  if (!userIdSchema.safeParse(userId).success)
    return privateJson(
      { error: { code: 'invalid_user', message: 'User identifier is invalid.' } },
      400,
    );
  const body = await readJsonBody(request, 1_024);
  if (!body.ok)
    return privateJson(
      { error: { code: 'invalid_body', message: 'Request must be bounded JSON.' } },
      400,
    );
  const parsed = roleChangeSchema.safeParse(body.value);
  if (!parsed.success)
    return privateJson(
      { error: { code: 'invalid_role', message: 'Select a supported role.' } },
      400,
    );
  const { error } = await supabase.rpc('admin_set_user_role', {
    p_user_id: userId,
    p_role: parsed.data.role,
  });
  if (error) {
    const known = {
      '42501': [403, 'forbidden', 'Admin access required.'],
      P0001: [409, 'final_admin_required', 'At least one admin must remain.'],
      P0002: [404, 'target_not_found', 'User was not found.'],
      '22023': [400, 'invalid_role', 'Select a supported role.'],
    } as const;
    const mapped = known[error.code as keyof typeof known];
    return mapped
      ? privateJson(
          { error: { code: mapped[1], message: mapped[2] } },
          mapped[0],
        )
      : privateJson(
          { error: { code: 'role_change_failed', message: 'The role could not be changed.' } },
          500,
        );
  }
  return privateJson({ success: true, userId, role: parsed.data.role });
}
