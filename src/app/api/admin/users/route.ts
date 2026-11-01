import { NextRequest } from 'next/server';
import {
  adminUserSchema,
  userIdSchema,
} from '@/features/admin-users/contracts';
import { getVerifiedUserRole } from '@/lib/auth/verified-user';
import { privateJson } from '@/lib/http/responses';

const pageSize = 50;

function failure(code: string, message: string, status: number) {
  return privateJson({ error: { code, message } }, status);
}

function databaseFailure(code: string) {
  return code === '42501'
    ? failure('forbidden', 'Admin access required.', 403)
    : failure(
        'directory_failed',
        'The user directory could not be loaded.',
        500,
      );
}

function pageResult(data: unknown) {
  const parsed = adminUserSchema.array().safeParse(data ?? []);
  if (!parsed.success)
    return failure(
      'directory_failed',
      'The user directory could not be loaded.',
      500,
    );
  const hasMore = parsed.data.length > pageSize;
  const users = parsed.data.slice(0, pageSize);
  return privateJson({
    users,
    nextAfter: hasMore ? (users.at(-1)?.user_id ?? null) : null,
  });
}

export async function GET(request: NextRequest) {
  const { supabase, user, role } = await getVerifiedUserRole();
  if (!user) return failure('unauthorized', 'Sign in required.', 401);
  if (role !== 'admin')
    return failure('forbidden', 'Admin access required.', 403);
  const after = request.nextUrl.searchParams.get('after');
  if (after && !userIdSchema.safeParse(after).success)
    return failure('invalid_cursor', 'Page cursor is invalid.', 400);
  const { data, error } = await supabase.rpc('admin_list_users', {
    p_after_user_id: after,
    p_limit: pageSize + 1,
  });
  if (error) return databaseFailure(error.code);
  return pageResult(data);
}
