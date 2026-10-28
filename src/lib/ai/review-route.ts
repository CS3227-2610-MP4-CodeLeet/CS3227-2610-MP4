import { NextResponse, type NextRequest } from 'next/server';
import { reviewRequestSchema } from '@/features/codementor/contracts';
import {
  performReview,
  ReviewServiceError,
} from '@/features/codementor/review-service';
import { getVerifiedUserRole, type AppRole } from '@/lib/auth/verified-user';
import { readJsonBody, sameOriginRequest } from '@/lib/http/request';

function response(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}

function failure(error: unknown, requestId: string) {
  if (!(error instanceof ReviewServiceError))
    return response(
      {
        error: {
          code: 'review_failed',
          message: 'Review could not be completed.',
          requestId,
        },
      },
      500,
    );
  const details = {
    not_found: [404, 'not_found', 'Submission not found.'],
    context_too_large: [
      413,
      'context_too_large',
      'The submission and assignment context exceed the review budget.',
    ],
    quota_exceeded: [429, 'quota_exceeded', 'Daily AI review limit reached.'],
    unavailable: [503, 'ai_unavailable', 'AI review is not configured.'],
    invalid_model_output: [
      502,
      'invalid_model_output',
      'The review could not be validated.',
    ],
    provider_error: [
      502,
      'provider_error',
      'AI review is temporarily unavailable.',
    ],
  } as const;
  const [status, code, message] = details[error.code];
  return response({ error: { code, message, requestId } }, status);
}

export async function handleReview(
  request: NextRequest,
  requiredRole: AppRole,
) {
  const requestId = crypto.randomUUID();
  if (!sameOriginRequest(request))
    return response(
      {
        error: {
          code: 'origin_rejected',
          message: 'Request origin could not be verified.',
          requestId,
        },
      },
      403,
    );
  const context = await getVerifiedUserRole();
  if (!context.user || !context.role)
    return response(
      {
        error: {
          code: 'unauthorized',
          message: 'Sign in required.',
          requestId,
        },
      },
      401,
    );
  if (context.role !== requiredRole)
    return response(
      {
        error: {
          code: 'forbidden',
          message: 'Account role cannot use this review.',
          requestId,
        },
      },
      403,
    );
  const body = await readJsonBody(request, 1_024);
  if (!body.ok)
    return response(
      {
        error: {
          code: 'invalid_body',
          message: 'Request must contain a submission ID.',
          requestId,
        },
      },
      400,
    );
  const parsed = reviewRequestSchema.safeParse(body.value);
  if (!parsed.success)
    return response(
      {
        error: {
          code: 'invalid_body',
          message: 'Request must contain a submission ID.',
          requestId,
        },
      },
      400,
    );
  try {
    const result = await performReview(
      context.supabase,
      context.user.id,
      requiredRole,
      parsed.data.submissionId,
    );
    return response({ ...result, requestId }, 200);
  } catch (error) {
    return failure(error, requestId);
  }
}
