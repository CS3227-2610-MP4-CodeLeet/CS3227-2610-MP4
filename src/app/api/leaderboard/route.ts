import type { NextRequest } from 'next/server';
import { getVerifiedUserRole } from '@/lib/auth/verified-user';
import { isAppRole } from '@/lib/auth/roles';
import { parseHistoryPage } from '@/features/student-submissions/history';
import { loadLeaderboard } from '@/features/leaderboard/queries.server';
import { privateJson } from '@/lib/http/responses';
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
  const query = request.nextUrl.searchParams;
  const pages = query.getAll('page');
  const page = parseHistoryPage(pages.length > 1 ? pages : pages[0]);
  if (page === null || [...query.keys()].some((key) => key !== 'page'))
    return privateJson(
      { error: { code: 'invalid_query', message: 'Choose a valid page.' } },
      400,
    );
  const data = await loadLeaderboard(supabase, page);
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
