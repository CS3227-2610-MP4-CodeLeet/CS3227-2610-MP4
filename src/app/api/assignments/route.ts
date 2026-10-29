import { type NextRequest } from 'next/server';
import { assignmentInputSchema } from '@/features/codementor/contracts';
import { getVerifiedUserRole } from '@/lib/auth/verified-user';
import { readJsonBody, sameOriginRequest } from '@/lib/http/request';
import { privateJson } from '@/lib/http/responses';

export async function GET() {
  const { supabase, user, role } = await getVerifiedUserRole();
  if (!user || !role)
    return privateJson(
      { error: { code: 'unauthorized', message: 'Sign in required.' } },
      401,
    );
  let query = supabase
    .from('assignments')
    .select(
      'id,title,language,publication_status,instructions,version,created_at,updated_at',
    );
  if (role === 'student') query = query.eq('publication_status', 'published');
  const { data, error } = await query.order('updated_at', { ascending: false });
  if (error)
    return privateJson(
      {
        error: {
          code: 'read_failed',
          message: 'Assignments could not be loaded.',
        },
      },
      500,
    );
  return privateJson({ assignments: data });
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
  const { supabase, user, role } = await getVerifiedUserRole();
  if (!user || !role)
    return privateJson(
      { error: { code: 'unauthorized', message: 'Sign in required.' } },
      401,
    );
  if (role !== 'instructor')
    return privateJson(
      { error: { code: 'forbidden', message: 'Instructor access required.' } },
      403,
    );
  const body = await readJsonBody(request, 18_000);
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
  const parsed = assignmentInputSchema.safeParse(body.value);
  if (!parsed.success)
    return privateJson(
      {
        error: {
          code: 'invalid_assignment',
          message: 'Assignment details are invalid.',
        },
      },
      400,
    );
  const { data, error } = await supabase.rpc('save_assignment', {
    p_assignment_id: null,
    p_expected_version: 0,
    p_title: parsed.data.title,
    p_instructions: parsed.data.instructions,
    p_criteria: parsed.data.rubric,
    p_publication_status: parsed.data.publicationStatus,
    p_language: parsed.data.language,
  });
  if (error)
    return privateJson(
      {
        error: {
          code: 'save_failed',
          message: 'Assignment could not be saved.',
        },
      },
      400,
    );
  return privateJson({ assignment: data }, 201);
}
