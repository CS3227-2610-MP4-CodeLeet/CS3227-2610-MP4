import type { NextRequest } from 'next/server';
import { getVerifiedUserRole } from '@/lib/auth/verified-user';
import { isAppRole } from '@/lib/auth/roles';
import { privateJson } from '@/lib/http/responses';
import { loadOwnXp } from '@/features/assignment-xp/queries.server';
import { readCourseAccess } from '@/lib/courses/access';
import { parseCourseActivityQuery } from '@/lib/courses/activity-query';
const fail = (code: string, message: string, status: number) =>
  privateJson({ error: { code, message } }, status);
export async function GET(request: NextRequest) {
  const { user, role, supabase } = await getVerifiedUserRole();
  if (!user || !supabase) return fail('unauthorized', 'Sign in required.', 401);
  if (!isAppRole(role))
    return fail('forbidden', 'Account access required.', 403);
  const context = parseCourseActivityQuery(request.nextUrl.searchParams);
  if (!context)
    return fail('invalid_query', 'Choose a valid course and page.', 400);
  const access = await readCourseAccess(
    supabase,
    user.id,
    context.courseId,
    'xp',
  );
  if (
    !access ||
    access.role !== 'student' ||
    (access.lifecycle === 'active' && !access.featureEnabled)
  )
    return fail('not_found', 'Course XP is unavailable.', 404);
  const data = await loadOwnXp(supabase, context.courseId, context.page);
  return data
    ? privateJson({ data })
    : fail('load_failed', 'XP could not be loaded. Try again.', 503);
}
