import { getVerifiedUserRole } from '@/lib/auth/verified-user';
import { readJsonBody, sameOriginRequest } from '@/lib/http/request';
import { privateJson } from '@/lib/http/responses';
import { profileInput, usernameValue } from '@/features/profile/contracts';

function failure(code: string, message: string, status: number) {
  return privateJson({ error: { code, message } }, status);
}

function saveFailure(error: { code?: string }) {
  return error.code === '23505'
    ? failure(
        'username_unavailable',
        'Username is unavailable. Choose another.',
        409,
      )
    : failure(
        'save_failed',
        'Your profile could not be saved. Try again.',
        503,
      );
}

async function updateProfile(request: Request) {
  const { user, role, supabase } = await getVerifiedUserRole();
  if (!user || !supabase)
    return failure('unauthorized', 'Sign in to update your profile.', 401);
  if (!role) return failure('forbidden', 'Account access is required.', 403);
  const body = await readJsonBody(request, 1024);
  if (!body.ok)
    return failure(
      'invalid_body',
      'Send a username within the allowed size.',
      body.reason === 'too-large' ? 413 : 400,
    );
  const parsed = profileInput.safeParse(body.value);
  if (!parsed.success)
    return failure(
      'invalid_profile',
      'Enter a username of 1–80 characters without @ or line breaks.',
      400,
    );
  const { data, error } = await supabase
    .from('profiles')
    .update({ display_name: parsed.data.username })
    .eq('id', user.id)
    .select('display_name')
    .maybeSingle();
  if (error) return saveFailure(error);
  if (!data)
    return failure(
      'unavailable',
      'Your profile is unavailable. Please try again.',
      404,
    );
  return privateJson({
    profile: { username: usernameValue.parse(data.display_name) },
  });
}

export async function PATCH(request: Request) {
  if (!sameOriginRequest(request))
    return failure(
      'origin_rejected',
      'Request origin could not be verified.',
      403,
    );
  try {
    return await updateProfile(request);
  } catch {
    return failure(
      'save_failed',
      'Your profile could not be saved. Try again.',
      503,
    );
  }
}
