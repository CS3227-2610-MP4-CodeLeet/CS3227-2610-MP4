import 'server-only';
import { z } from 'zod';
import { getVerifiedUserRole } from '@/lib/auth/verified-user';
import { readCourseAccess } from '@/lib/courses/access';
import { privateJson } from '@/lib/http/responses';
import { loadOwnerCases, loadPublicCases } from './queries.server';

const failure = (code: string, message: string, status: number) =>
  privateJson({ error: { code, message } }, status);
const unavailable = () => failure('not_found', 'Assignment not found.', 404);
type Supabase = NonNullable<
  Awaited<ReturnType<typeof getVerifiedUserRole>>['supabase']
>;

async function courseForAssignment(
  supabase: Supabase,
  userId: string,
  id: string,
  audience: 'student' | 'instructor',
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
    !(access.lifecycle === 'active' && !access.featureEnabled),
  );
}

async function authorizeRead(id: string, audience: 'student' | 'instructor') {
  const { supabase, user } = await getVerifiedUserRole();
  if (!user || !supabase) {
    return { error: failure('unauthorized', 'Sign in required.', 401) };
  }
  if (!z.uuid().safeParse(id).success) {
    return { error: unavailable() };
  }
  const isAllowed = await courseForAssignment(supabase, user.id, id, audience);
  if (!isAllowed) {
    return { error: unavailable() };
  }
  return { supabase };
}

export async function readCases(
  id: string,
  audience: 'student' | 'instructor',
) {
  const auth = await authorizeRead(id, audience);
  if (auth.error) return auth.error;
  try {
    const data =
      audience === 'student'
        ? await loadPublicCases(auth.supabase, id)
        : await loadOwnerCases(auth.supabase, id);
    return data ? privateJson({ data }) : unavailable();
  } catch {
    return failure(
      'load_failed',
      'Practice tests could not be loaded. Try again.',
      503,
    );
  }
}
