import { type NextRequest } from 'next/server';
import { z } from 'zod';
import {
  apiError,
  parsedBody,
  requestOriginError,
  rpcError,
} from '@/features/course-workspaces/http';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { privateJson } from '@/lib/http/responses';
const UNAVAILABLE_CODE = 'invitation_unavailable';
const UNAVAILABLE_MESSAGE = 'Invitation could not be accepted.';
const sessionSchema = z
  .object({
    token: z
      .string()
      .min(40)
      .max(128)
      .regex(/^[A-Za-z0-9_-]+$/),
    accessToken: z.string().min(20).max(4096),
    refreshToken: z.string().min(1).max(512),
  })
  .strict();
type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;
async function verifiedIdentity(
  supabase: Supabase,
  accessToken: string,
  refreshToken: string,
) {
  const { error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (sessionError) return false;
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user?.email_confirmed_at) return false;
  const { data: role, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();
  return !roleError && Boolean(role?.role);
}
async function acceptWithSession(
  supabase: Supabase,
  input: z.infer<typeof sessionSchema>,
) {
  if (
    !(await verifiedIdentity(supabase, input.accessToken, input.refreshToken))
  )
    return unavailable();
  const { data: courseId, error } = await supabase.rpc(
    'accept_course_invitation',
    { p_token: input.token },
  );
  const failure = rpcError(error, {
    code: UNAVAILABLE_CODE,
    message: UNAVAILABLE_MESSAGE,
    fallback: 404,
    statuses: { '42501': 404 },
  });
  if (
    failure ||
    typeof courseId !== 'string' ||
    !z.string().uuid().safeParse(courseId).success
  )
    return failure ?? unavailable();
  return privateJson({ courseId });
}
async function acceptInvitation(request: NextRequest) {
  const originError = requestOriginError(request);
  if (originError) return originError;
  const parsed = await parsedBody(request, {
    schema: sessionSchema,
    maxBytes: 6_000,
    code: UNAVAILABLE_CODE,
    message: UNAVAILABLE_MESSAGE,
  });
  if ('response' in parsed) return parsed.response;
  try {
    return await acceptWithSession(
      await createSupabaseServerClient(),
      parsed.data,
    );
  } catch {
    return unavailable();
  }
}
function unavailable() {
  return apiError(UNAVAILABLE_CODE, UNAVAILABLE_MESSAGE, 404);
}
export async function POST(request: NextRequest) {
  return acceptInvitation(request);
}
