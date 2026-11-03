import { signInInput } from '@/features/auth/sign-in-contracts';
import {
  performSignIn,
  type SignInResult,
} from '@/features/auth/sign-in-service.server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSignInClients } from '@/lib/supabase/metadata.server';
import { readJsonBody, sameOriginRequest } from '@/lib/http/request';
import { privateJson } from '@/lib/http/responses';

function failure(code: string, message: string, status: number) {
  return privateJson({ error: { code, message } }, status);
}
function responseFor(result: SignInResult) {
  if (result.kind === 'success') return privateJson({ ok: true });
  if (result.kind === 'limited') {
    const response = failure(
      'rate_limited',
      'Too many attempts. Please wait a minute and try again.',
      429,
    );
    response.headers.set('Retry-After', String(result.retryAfter));
    return response;
  }
  return result.kind === 'unavailable'
    ? failure(
        'unavailable',
        'Sign-in is unavailable. Please try again later.',
        503,
      )
    : failure(
        'invalid_credentials',
        'Sign-in failed. Check your details and try again.',
        401,
      );
}
export async function POST(request: Request) {
  if (!sameOriginRequest(request))
    return failure(
      'origin_rejected',
      'Request origin could not be verified.',
      403,
    );
  try {
    const body = await readJsonBody(request, 8192);
    if (!body.ok)
      return failure(
        'invalid_body',
        'Check your sign-in details.',
        body.reason === 'too-large' ? 413 : 400,
      );
    const input = signInInput.safeParse(body.value);
    if (!input.success)
      return failure('invalid_input', 'Check your sign-in details.', 400);
    const deps = {
      ...createSignInClients(),
      getPasswordClient: createSupabaseServerClient,
    };
    return responseFor(await performSignIn(input.data, deps));
  } catch {
    return responseFor({ kind: 'unavailable' });
  }
}
