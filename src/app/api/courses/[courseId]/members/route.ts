import { randomBytes } from 'node:crypto';
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
import { createInviteAuthClient } from '@/lib/supabase/invite-mailer';
const invitationSchema = z
  .object({
    email: z.string().trim().email().max(320),
    role: z.enum(['student', 'instructor']),
  })
  .strict();
const unavailable = () =>
  apiError('course_unavailable', 'Course could not be found.', 404);
const readFailed = () =>
  apiError('members_read_failed', 'Course members could not be loaded.', 503);
type Account = Extract<
  Awaited<ReturnType<typeof courseAccount>>,
  { supabase: unknown }
>;
function invitationCallbackUrl() {
  const configured = process.env.APP_SITE_URL;
  if (!configured) return null;
  try {
    const site = new URL(configured);
    if (
      (site.protocol !== 'https:' && site.protocol !== 'http:') ||
      site.username ||
      site.password
    )
      return null;
    return new URL('/auth/course-invite', site);
  } catch {
    return null;
  }
}
async function readMembers(courseId: string) {
  const auth = await courseAccount();
  if ('response' in auth) return auth.response;
  const [members, invitations] = await Promise.all([
    auth.supabase.rpc('list_course_members', { p_course: courseId }),
    auth.supabase.rpc('list_course_invitations', { p_course: courseId }),
  ]);
  const failure = rpcError(members.error ?? invitations.error, {
    code: 'members_read_failed',
    message: 'Course members could not be loaded.',
    fallback: 503,
    statuses: { '42501': 403 },
  });
  return (
    failure ??
    privateJson({
      members: members.data ?? [],
      invitations: invitations.data ?? [],
    })
  );
}
async function sendInvitationEmail(input: {
  auth: Account;
  mailer: ReturnType<typeof createInviteAuthClient>;
  email: string;
  callback: URL;
  token: string;
  invitationId: string;
}) {
  const { auth, mailer, email, callback, token, invitationId } = input;
  callback.searchParams.set('course_invite', token);
  let failed = false;
  try {
    const { error } = await mailer.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callback.toString(), shouldCreateUser: true },
    });
    failed = Boolean(error);
  } catch {
    failed = true;
  }
  if (!failed) return true;
  try {
    await auth.supabase.rpc('revoke_course_invitation', {
      p_invitation: invitationId,
    });
  } catch {
    /* A retry replaces a pending invite after this generic failure. */
  }
  return false;
}
async function createInvitation(request: NextRequest, courseId: string) {
  const originError = requestOriginError(request);
  if (originError) return originError;
  const parsed = await parsedBody(request, {
    schema: invitationSchema,
    maxBytes: 2_000,
    code: 'invalid_invitation',
    message: 'Invitation details are invalid.',
  });
  if ('response' in parsed) return parsed.response;
  const callback = invitationCallbackUrl();
  if (!callback)
    return apiError(
      'invitation_delivery_unavailable',
      'Invitation email could not be sent.',
      503,
    );
  const auth = await courseAccount();
  if ('response' in auth) return auth.response;
  const mailer = createInviteAuthClient();
  const email = parsed.data.email.toLowerCase();
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const created = await auth.supabase.rpc('create_course_invitation', {
    p_course: courseId,
    p_email: email,
    p_role: parsed.data.role,
    p_token: token,
    p_expires_at: expiresAt,
  });
  const failure = rpcError(created.error, {
    code: 'invitation_denied',
    message: 'Invitation could not be created.',
    statuses: { '42501': 403 },
  });
  if (failure) return failure;
  const delivered = await sendInvitationEmail({
    auth,
    mailer,
    email,
    callback,
    token,
    invitationId: created.data,
  });
  return delivered
    ? privateJson({ status: 'sent' }, 202)
    : apiError(
        'invitation_delivery_failed',
        'Invitation email could not be sent.',
        503,
      );
}
export async function GET(
  _request: NextRequest,
  context: RouteContext<'/api/courses/[courseId]/members'>,
) {
  const { courseId } = await context.params;
  if (!isCourseId(courseId)) return unavailable();
  try {
    return await readMembers(courseId);
  } catch {
    return readFailed();
  }
}
export async function POST(
  request: NextRequest,
  context: RouteContext<'/api/courses/[courseId]/members'>,
) {
  const { courseId } = await context.params;
  if (!isCourseId(courseId)) return unavailable();
  try {
    return await createInvitation(request, courseId);
  } catch {
    return apiError('invitation_failed', 'Invitation could not be sent.', 503);
  }
}
