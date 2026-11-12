import type { NextRequest } from 'next/server';
import { getVerifiedUserRole } from '@/lib/auth/verified-user';
import { isAppRole } from '@/lib/auth/roles';
import { loadLeaderboard } from '@/features/leaderboard/queries.server';
import { privateJson } from '@/lib/http/responses';
import { readCourseAccess } from '@/lib/courses/access';
import { parseCourseActivityQuery } from '@/lib/courses/activity-query';
export async function GET(request: NextRequest) {
  const { user, role, supabase } = await getVerifiedUserRole();
  if (!user)
    return privateJson(
      { error: { code: 'unauthorized', message: 'Sign in required.' } },
      401,
    );
  if (!isAppRole(role) || !supabase)
    return privateJson(
      { error: { code: 'forbidden', message: 'Account access required.' } },
      403,
    );
  const context = parseCourseActivityQuery(request.nextUrl.searchParams);
  if (!context)
    return privateJson(
      {
        error: {
          code: 'invalid_query',
          message: 'Choose a valid course and page.',
        },
      },
      400,
    );
  const access = await readCourseAccess(
    supabase,
    user.id,
    context.courseId,
    'leaderboard',
  );
  if (
    !access ||
    !['student', 'instructor'].includes(access.role) ||
    (access.lifecycle === 'active' && !access.featureEnabled)
  )
    return privateJson(
      {
        error: {
          code: 'not_found',
          message: 'Course leaderboard is unavailable.',
        },
      },
      404,
    );
  const data = await loadLeaderboard(
    supabase,
    context.courseId,
    context.page,
    context.revision,
  );
  return data
    ? privateJson({ data })
    : privateJson(
        {
          error: {
            code: 'load_failed',
            message: 'Leaderboard could not be loaded. Try again.',
          },
        },
        503,
      );
}
