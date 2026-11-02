import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { xpSummarySchema } from './contracts';
export async function loadOwnXp(client: SupabaseClient, page: number) {
  if (!Number.isInteger(page) || page < 1 || page > 10000) return null;
  const { data, error } = await client.rpc('get_my_xp', { p_page: page });
  if (error) return null;
  const parsed = xpSummarySchema.safeParse(data);
  return parsed.success ? parsed.data : null;
}
