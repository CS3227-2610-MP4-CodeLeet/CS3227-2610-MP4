import { z, type ZodType } from 'zod';
import { getVerifiedUserRole } from '@/lib/auth/verified-user';
import { readJsonBody, sameOriginRequest } from '@/lib/http/request';
import { privateJson } from '@/lib/http/responses';

export async function courseAccount() {
  const context = await getVerifiedUserRole();
  if (!context.user || !context.supabase)
    return {
      response: privateJson(
        { error: { code: 'unauthorized', message: 'Sign in required.' } },
        401,
      ),
    } as const;
  if (!context.role)
    return {
      response: privateJson(
        { error: { code: 'forbidden', message: 'Course account required.' } },
        403,
      ),
    } as const;
  return {
    user: context.user,
    role: context.role,
    supabase: context.supabase,
  } as const;
}

export async function platformAdminAccount() {
  const context = await courseAccount();
  if ('response' in context) return context;
  if (context.role !== 'admin')
    return {
      response: privateJson(
        {
          error: {
            code: 'forbidden',
            message: 'Platform administration required.',
          },
        },
        403,
      ),
    } as const;
  return context;
}

export function requestOriginError(request: Request) {
  return sameOriginRequest(request)
    ? null
    : privateJson(
        {
          error: {
            code: 'origin_rejected',
            message: 'Request origin could not be verified.',
          },
        },
        403,
      );
}

export function apiError(code: string, message: string, status: number) {
  return privateJson({ error: { code, message } }, status);
}

export function isCourseId(value: unknown): value is string {
  return z.string().uuid().safeParse(value).success;
}

type BodyOptions<T> = {
  schema: ZodType<T>;
  maxBytes: number;
  code: string;
  message: string;
};
export async function parsedBody<T>(request: Request, options: BodyOptions<T>) {
  const body = await readJsonBody(request, options.maxBytes);
  if (!body.ok)
    return {
      response: apiError(
        body.reason === 'too-large' ? 'body_too_large' : 'invalid_body',
        body.reason === 'too-large'
          ? 'Request is too large.'
          : 'Request must be bounded JSON.',
        body.reason === 'too-large' ? 413 : 400,
      ),
    } as const;
  const parsed = options.schema.safeParse(body.value);
  if (!parsed.success)
    return { response: apiError(options.code, options.message, 400) } as const;
  return { data: parsed.data } as const;
}

type RpcErrorOptions = {
  code: string;
  message: string;
  fallback?: number;
  statuses?: Record<string, number>;
};
export function rpcError(
  error: { code?: string } | null,
  options: RpcErrorOptions,
) {
  return error
    ? apiError(
        options.code,
        options.message,
        options.statuses?.[error.code ?? ''] ?? options.fallback ?? 400,
      )
    : null;
}
