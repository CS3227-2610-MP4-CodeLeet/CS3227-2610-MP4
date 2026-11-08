import 'server-only';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { getVerifiedUserRole } from '@/lib/auth/verified-user';
import { readCourseAccess } from '@/lib/courses/access';
import { privateJson } from '@/lib/http/responses';
import { readJsonBody, sameOriginRequest } from '@/lib/http/request';
import { practiceUpdateSchema } from './contracts';
import { loadOwnerCases, loadPublicCases } from './queries.server';

const failure = (code: string, message: string, status: number) =>
  privateJson({ error: { code, message } }, status);
const unavailable = () => failure('not_found', 'Assignment not found.', 404);
type Supabase = NonNullable<
  Awaited<ReturnType<typeof getVerifiedUserRole>>['supabase']
>;

// eslint-disable-next-line max-params -- audience and write intent are distinct authorization inputs.
async function courseForAssignment(
  supabase: Supabase,
  userId: string,
  id: string,
  audience: 'student' | 'instructor',
  writable: boolean,
) {
  const { data: assignment } = await supabase
    .from('assignments')
    .select('course_id')
    .eq('id', id)
    .maybeSingle();
  if (!assignment) return false;
  const access = await readCourseAccess(
    supabase,
    userId,
    assignment.course_id,
    'assessments',
  );
  return Boolean(
    access &&
    access.role === audience &&
    !(access.lifecycle === 'active' && !access.featureEnabled) &&
    !(writable && (access.lifecycle !== 'active' || !access.featureEnabled)),
  );
}

export async function readCases(
  id: string,
  audience: 'student' | 'instructor',
) {
  const { supabase, user } = await getVerifiedUserRole();
  if (!user || !supabase)
    return failure('unauthorized', 'Sign in required.', 401);
  if (!z.uuid().safeParse(id).success) return unavailable();
  if (!(await courseForAssignment(supabase, user.id, id, audience, false)))
    return unavailable();
  try {
    const data =
      audience === 'student'
        ? await loadPublicCases(supabase, id)
        : await loadOwnerCases(supabase, id);
    return data ? privateJson({ data }) : unavailable();
  } catch {
    return failure(
      'load_failed',
      'Practice tests could not be loaded. Try again.',
      503,
    );
  }
}

export async function updateCases(request: NextRequest, id: string) {
  if (!sameOriginRequest(request))
    return failure(
      'origin_rejected',
      'Request origin could not be verified.',
      403,
    );
  const { supabase, user } = await getVerifiedUserRole();
  if (!user || !supabase)
    return failure('unauthorized', 'Sign in required.', 401);
  if (!z.uuid().safeParse(id).success) return unavailable();
  if (!(await courseForAssignment(supabase, user.id, id, 'instructor', true)))
    return unavailable();
  const parsed = await parseUpdate(request);
  if (!parsed?.success)
    return failure('invalid_cases', 'Check the test cases and try again.', 400);
  const value = parsed.data;
  const { data, error } = await supabase.rpc('save_practice_tests', {
    p_assignment_id: id,
    p_expected_version: value.expectedVersion,
    p_action: value.action,
    p_cases: value.action === 'unpublish' ? null : value.cases,
  });
  if (error) return saveError(error.code);
  return privateJson({ data });
}

function saveError(code: string | undefined) {
  if (code === '40001')
    return failure(
      'version_conflict',
      'These tests changed. Reload before saving again.',
      409,
    );
  if (code === '42501') return unavailable();
  return failure(
    'save_failed',
    'Practice tests could not be saved. Check the cases and retry.',
    400,
  );
}

async function parseUpdate(request: NextRequest) {
  const body = await readJsonBody(request, 400_000);
  return body.ok ? practiceUpdateSchema.safeParse(body.value) : null;
}
