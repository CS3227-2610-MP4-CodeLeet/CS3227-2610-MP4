import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { leaderboardSchema } from './contracts';
export async function loadLeaderboard(client: SupabaseClient, page: number) {
  if (!Number.isInteger(page) || page < 1 || page > 10000) return null;
  const { data, error } = await client.rpc('get_leaderboard', { p_page: page });
  if (error) return null;
  const parsed = leaderboardSchema.safeParse(data);
  return parsed.success ? parsed.data : null;
}
