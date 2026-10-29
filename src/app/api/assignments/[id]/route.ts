import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { assignmentInputSchema } from '@/features/codementor/contracts';
import { getVerifiedUserRole } from '@/lib/auth/verified-user';
import { readJsonBody, sameOriginRequest } from '@/lib/http/request';
import { privateJson } from '@/lib/http/responses';

const updateSchema = assignmentInputSchema
  .extend({ expectedVersion: z.number().int().min(1) })
  .strict();
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
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
  if (!user || role !== 'instructor')
    return privateJson(
      { error: { code: 'forbidden', message: 'Instructor access required.' } },
      user ? 403 : 401,
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
  const parsed = updateSchema.safeParse(body.value);
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
  const { id } = await context.params;
  const idResult = z.uuid().safeParse(id);
  if (!idResult.success)
    return privateJson(
      { error: { code: 'not_found', message: 'Assignment not found.' } },
      404,
    );
  const { data, error } = await supabase.rpc('save_assignment', {
    p_assignment_id: id,
    p_expected_version: parsed.data.expectedVersion,
    p_title: parsed.data.title,
    p_instructions: parsed.data.instructions,
    p_criteria: parsed.data.rubric,
    p_publication_status: parsed.data.publicationStatus,
  });
  if (error)
    return privateJson(
      {
        error: {
          code: 'save_failed',
          message: 'Assignment could not be saved.',
        },
      },
      error.code === '40001' ? 409 : 400,
    );
  return privateJson({ assignment: data });
}
