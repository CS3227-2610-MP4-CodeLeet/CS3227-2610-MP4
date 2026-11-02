import type { NextRequest } from 'next/server';
import { getVerifiedUserRole } from '@/lib/auth/verified-user';
import { privateJson } from '@/lib/http/responses';
import { parseHistoryPage } from '@/features/student-submissions/history';
import { loadOwnXp } from '@/features/assignment-xp/queries.server';
const fail = (code: string, message: string, status: number) =>
  privateJson({ error: { code, message } }, status);
export async function GET(request: NextRequest) {
  const { user, role, supabase } = await getVerifiedUserRole();
  if (!user || !role) return fail('unauthorized', 'Sign in required.', 401);
  if (role !== 'student')
    return fail('forbidden', 'Student access required.', 403);
  const query = request.nextUrl.searchParams;
  const values = query.getAll('page');
  const page = parseHistoryPage(values.length > 1 ? values : values[0]);
  if (page === null || [...query.keys()].some((key) => key !== 'page'))
    return fail('invalid_query', 'Choose a valid page.', 400);
  const data = await loadOwnXp(supabase, page);
  return data
    ? privateJson({ data })
    : fail('load_failed', 'XP could not be loaded. Try again.', 503);
}
