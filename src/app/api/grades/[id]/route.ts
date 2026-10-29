import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { validateGradeScores } from '@/features/codementor/contracts';
import { getVerifiedUserRole } from '@/lib/auth/verified-user';
import { readJsonBody, sameOriginRequest } from '@/lib/http/request';
import { privateJson as response } from '@/lib/http/responses';

const gradeSchema = z
  .object({
    scores: z.record(z.string(), z.number().min(0).max(100)),
    feedback: z.string().max(4_000),
    totalScore: z.number().min(0).max(2_000),
    publish: z.boolean(),
    expectedVersion: z.number().int().min(0),
  })
  .strict();
type SupabaseClient = NonNullable<
  Awaited<ReturnType<typeof getVerifiedUserRole>>['supabase']
>;
async function readGradeInput(request: NextRequest) {
  const body = await readJsonBody(request, 8_000);
  if (!body.ok)
    return {
      error: response(
        { error: { code: 'invalid_body', message: 'Grade data is invalid.' } },
        400,
      ),
    };
  const parsed = gradeSchema.safeParse(body.value);
  if (!parsed.success)
    return {
      error: response(
        { error: { code: 'invalid_grade', message: 'Grade data is invalid.' } },
        400,
      ),
    };
  return { grade: parsed.data };
}

async function readRubric(supabase: SupabaseClient, submissionId: string) {
  const { data: submission } = await supabase
    .from('submissions')
    .select('id,assignment_id')
    .eq('id', submissionId)
    .maybeSingle();
  if (!submission) return null;
  const { data: rubric } = await supabase
    .from('assignment_rubrics')
    .select('criteria')
    .eq('assignment_id', submission.assignment_id)
    .maybeSingle();
  const criteria = z
    .array(
      z
        .object({ id: z.uuid(), maxScore: z.number().min(1).max(100) })
        .passthrough(),
    )
    .safeParse(rubric?.criteria);
  return criteria.success ? criteria.data : null;
}

async function saveGrade(
  supabase: SupabaseClient,
  submissionId: string,
  grade: z.infer<typeof gradeSchema>,
) {
  const criteria = await readRubric(supabase, submissionId);
  if (!criteria)
    return response(
      { error: { code: 'not_found', message: 'Submission not found.' } },
      404,
    );
  if (!validateGradeScores(grade.scores, criteria, grade.totalScore))
    return response(
      {
        error: {
          code: 'invalid_grade',
          message: 'Scores must match the private rubric and total.',
        },
      },
      400,
    );
  const { data, error } = await supabase.rpc('save_grade', {
    p_submission_id: submissionId,
    p_scores: grade.scores,
    p_feedback: grade.feedback,
    p_total: grade.totalScore,
    p_publish: grade.publish,
    p_expected_version: grade.expectedVersion,
  });
  if (error)
    return response(
      {
        error: {
          code: error.code === '40001' ? 'version_conflict' : 'save_failed',
          message:
            error.code === '40001'
              ? 'Grade changed; reload before saving.'
              : 'Grade could not be saved.',
        },
      },
      error.code === '40001' ? 409 : 400,
    );
  return response({ grade: data });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!sameOriginRequest(request))
    return response(
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
    return response(
      { error: { code: 'forbidden', message: 'Instructor access required.' } },
      user ? 403 : 401,
    );
  const { id: submissionId } = await context.params;
  if (!z.uuid().safeParse(submissionId).success)
    return response(
      { error: { code: 'not_found', message: 'Submission not found.' } },
      404,
    );
  const input = await readGradeInput(request);
  if ('error' in input) return input.error;
  return saveGrade(supabase, submissionId, input.grade);
}
