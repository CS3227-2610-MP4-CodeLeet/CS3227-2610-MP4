import { type NextRequest } from 'next/server';
import { submissionInputSchema } from '@/features/codementor/contracts';
import { getVerifiedUserRole } from '@/lib/auth/verified-user';
import { readCourseAccess } from '@/lib/courses/access';
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

// eslint-disable-next-line complexity -- authorization and assignment validation are intentionally fail-closed in order.
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
  const { supabase, user } = await getVerifiedUserRole();
  if (!user)
    return privateJson(
      { error: { code: 'unauthorized', message: 'Sign in required.' } },
      401,
    );
  const body = await readJsonBody(request, 34_000);
  if (!body.ok)
    return privateJson(
      {
        error: {
          code: 'invalid_body',
          message: 'Request must be bounded JSON.',
        },
      },
      400,
    );
  const parsed = submissionInputSchema.safeParse(body.value);
  if (!parsed.success)
    return privateJson(
      {
        error: {
          code: 'invalid_submission',
          message: 'Submission details are invalid.',
        },
      },
      400,
    );
  const { data: assignment, error: assignmentError } = await supabase
    .from('assignments')
    .select('course_id')
    .eq('id', parsed.data.assignmentId)
    .maybeSingle();
  if (assignmentError || !assignment) return submissionError({ code: 'P0002' });
  const access = await readCourseAccess(
    supabase,
    user.id,
    assignment.course_id,
    'assessments',
  );
  if (
    !access ||
    access.role !== 'student' ||
    access.lifecycle !== 'active' ||
    !access.featureEnabled
  )
    return submissionError({ code: 'P0002' });
  const { data, error } = await supabase.rpc('submit_code', {
    p_assignment_id: parsed.data.assignmentId,
    p_source: parsed.data.source,
    p_request_id: parsed.data.requestId,
  });
  if (error) return submissionError(error);
  return privateJson({ submission: data }, 201);
}
