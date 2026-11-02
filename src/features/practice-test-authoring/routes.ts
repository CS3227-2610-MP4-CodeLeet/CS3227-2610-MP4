import 'server-only';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { getVerifiedUserRole } from '@/lib/auth/verified-user';
import { hasInstructorAccess } from '@/lib/auth/roles';
import { privateJson } from '@/lib/http/responses';
import { readJsonBody, sameOriginRequest } from '@/lib/http/request';
import { practiceUpdateSchema } from './contracts';
import { loadOwnerCases, loadPublicCases } from './queries.server';

const failure = (code: string, message: string, status: number) =>
  privateJson({ error: { code, message } }, status);
const unavailable = () => failure('not_found', 'Assignment not found.', 404);
export async function readCases(
  id: string,
  audience: 'student' | 'instructor',
) {
  const { supabase, user, role } = await getVerifiedUserRole();
  if (!user || !role) return failure('unauthorized', 'Sign in required.', 401);
  const allowed =
    audience === 'student' ? role === 'student' : hasInstructorAccess(role);
  if (!allowed) return failure('forbidden', 'Account access required.', 403);
  if (!z.uuid().safeParse(id).success) return unavailable();
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
  const { supabase, user, role } = await getVerifiedUserRole();
  if (!user || !role) return failure('unauthorized', 'Sign in required.', 401);
  if (!hasInstructorAccess(role))
    return failure('forbidden', 'Instructor access required.', 403);
  if (!z.uuid().safeParse(id).success) return unavailable();
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
