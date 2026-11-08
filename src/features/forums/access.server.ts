import 'server-only';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { requireMember } from '@/lib/auth/verified-user';
import { readCourseAccess } from '@/lib/courses/access';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const requireForumMember = requireMember;

export async function requireDiscussionCourse(
  userId: string,
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  value: unknown,
  activeOnly = false,
) {
  if (typeof value !== 'string' || !z.uuid().safeParse(value).success)
    notFound();
  const access = await readCourseAccess(supabase, userId, value, 'discussions');
  if (
    !access ||
    (access.lifecycle === 'active' && !access.featureEnabled) ||
    (activeOnly && access.lifecycle !== 'active')
  )
    notFound();
  return { courseId: value, access };
}
