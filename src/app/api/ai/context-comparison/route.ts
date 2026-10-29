import { NextResponse, type NextRequest } from 'next/server';
import { reviewRequestSchema } from '@/features/codementor/contracts';
import {
  performContextComparison,
  ReviewServiceError,
} from '@/features/codementor/review-service';
import { getVerifiedUserRole } from '@/lib/auth/verified-user';
import { readJsonBody, sameOriginRequest } from '@/lib/http/request';

const response = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  });

function errorResponse(error: unknown, requestId: string) {
  if (!(error instanceof ReviewServiceError))
    return response(
      {
        error: {
          code: 'comparison_failed',
          message: 'Context comparison failed.',
          requestId,
        },
      },
      500,
    );
  const map = {
    not_found: [404, 'not_found', 'Submission not found.'],
    context_too_large: [
      413,
      'context_too_large',
      'Authorized context exceeds the review budget.',
    ],
    quota_exceeded: [429, 'quota_exceeded', 'Daily AI review limit reached.'],
    unavailable: [503, 'ai_unavailable', 'AI review is not configured.'],
    invalid_model_output: [
      502,
      'invalid_model_output',
      'One review response could not be validated.',
    ],
    provider_error: [
      502,
      'provider_error',
      'AI review is temporarily unavailable.',
    ],
  } as const;
  const [status, code, message] = map[error.code];
  return response({ error: { code, message, requestId } }, status);
}

export async function POST(request: NextRequest) {
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
  const { supabase, user, role } = await getVerifiedUserRole();
  if (!user || !role)
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
  if (role !== 'instructor')
    return response(
      {
        error: {
          code: 'forbidden',
          message: 'Instructor access required.',
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
    const comparison = await performContextComparison(
      supabase,
      user.id,
      parsed.data.submissionId,
    );
    return response({ comparison, requestId });
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
