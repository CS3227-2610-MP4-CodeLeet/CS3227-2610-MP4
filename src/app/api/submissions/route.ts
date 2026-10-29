import { type NextRequest } from 'next/server';
import { submissionInputSchema } from '@/features/codementor/contracts';
import { getVerifiedUserRole } from '@/lib/auth/verified-user';
import { readJsonBody, sameOriginRequest } from '@/lib/http/request';
import { privateJson } from '@/lib/http/responses';

function submissionError(error: { code: string }) {
  if (error.code === '42501')
    return privateJson(
      {
        error: { code: 'submit_failed', message: 'Submission is not allowed.' },
      },
      403,
    );
  if (error.code === 'P0002')
    return privateJson(
      {
        error: { code: 'submit_failed', message: 'Assignment is unavailable.' },
      },
      404,
    );
  if (error.code === '23505')
    return privateJson(
      {
        error: {
          code: 'submit_failed',
          message: 'Submission retry conflicts with an earlier request.',
        },
      },
      409,
    );
  return privateJson(
    {
      error: {
        code: 'submit_failed',
        message: 'Submission could not be saved.',
      },
    },
    400,
  );
}

async function saveSubmission(request: NextRequest) {
  const { supabase, user, role } = await getVerifiedUserRole();
  if (!user || role !== 'student')
    return {
      response: privateJson(
        {
          error: {
            code: user ? 'forbidden' : 'unauthorized',
            message: 'Student access required.',
          },
        },
        user ? 403 : 401,
      ),
    };
  const body = await readJsonBody(request, 34_000);
  if (!body.ok)
    return {
      response: privateJson(
        {
          error: {
            code: 'invalid_body',
            message: 'Request must be bounded JSON.',
          },
        },
        400,
      ),
    };
  const parsed = submissionInputSchema.safeParse(body.value);
  if (!parsed.success)
    return {
      response: privateJson(
        {
          error: {
            code: 'invalid_submission',
            message: 'Python source must be 1 to 8,000 characters.',
          },
        },
        400,
      ),
    };
  const { data, error } = await supabase.rpc('submit_code', {
    p_assignment_id: parsed.data.assignmentId,
    p_source: parsed.data.source,
    p_request_id: parsed.data.requestId,
  });
  if (error) return { response: submissionError(error) };
  return { submission: data };
}

export async function POST(request: NextRequest) {
  if (!sameOriginRequest(request))
    return privateJson(
      {
        error: {
          code: 'origin_rejected',
          message: 'Request origin could not be verified.',
        },
      },
      403,
    );
  const result = await saveSubmission(request);
  if ('response' in result) return result.response;
  return privateJson({ submission: result.submission }, 201);
}
