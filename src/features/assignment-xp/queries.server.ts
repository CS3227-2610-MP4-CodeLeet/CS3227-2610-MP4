import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { xpSummarySchema } from './contracts';
import { parseXpRevision } from '@/lib/courses/xp-pagination';
export async function loadOwnXp(
  client: SupabaseClient,
  courseId: string,
  page: number,
  revision?: string,
) {
  if (!Number.isInteger(page) || page < 1 || page > 10000) return null;
  if (!parseXpRevision(revision)) return null;
  const { data, error } = await client.rpc('get_my_xp', {
    p_course_id: courseId,
    p_page: page,
    p_revision: revision ?? null,
  });
  if (error) return null;
  const parsed = xpSummarySchema.safeParse(data);
  return parsed.success ? parsed.data : null;
}
