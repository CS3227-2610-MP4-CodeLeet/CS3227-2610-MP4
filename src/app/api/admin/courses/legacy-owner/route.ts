import { type NextRequest } from 'next/server';
import { z } from 'zod';
import {
  apiError,
  platformAdminAccount,
  parsedBody,
  requestOriginError,
  rpcError,
} from '@/features/course-workspaces/http';
import { privateJson } from '@/lib/http/responses';
const ownerSchema = z.object({ ownerId: z.string().uuid() }).strict();
async function assignLegacyOwner(request: NextRequest) {
  const originError = requestOriginError(request);
  if (originError) return originError;
  const parsed = await parsedBody(request, {
    schema: ownerSchema,
    maxBytes: 1_000,
    code: 'invalid_owner',
    message: 'Legacy owner is invalid.',
  });
  if ('response' in parsed) return parsed.response;
  const auth = await platformAdminAccount();
  if ('response' in auth) return auth.response;
  try {
    const { error } = await auth.supabase.rpc('assign_legacy_course_owner', {
      p_owner: parsed.data.ownerId,
    });
    const denied = rpcError(error, {
      code: 'legacy_assignment_denied',
      message: 'Legacy owner could not be assigned.',
      statuses: { '42501': 403 },
    });
    return denied ?? privateJson({ status: 'assigned' });
  } catch {
    return apiError(
      'legacy_assignment_failed',
      'Legacy owner could not be assigned.',
      503,
    );
  }
}
export async function PUT(request: NextRequest) {
  return assignLegacyOwner(request);
}
