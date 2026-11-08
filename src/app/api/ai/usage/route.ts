import { getVerifiedUserRole } from '@/lib/auth/verified-user';
import { privateJson } from '@/lib/http/responses';

export async function GET() {
  const { supabase, user, role } = await getVerifiedUserRole();
  if (!user || !role)
    return privateJson(
      { error: { code: 'unauthorized', message: 'Sign in required.' } },
      401,
    );
  const { data, error } = await supabase
    .from('ai_usage')
    .select(
      'review_type,status,error_category,latency_ms,input_tokens,output_tokens,token_source,cache_hit,created_at',
    )
    .eq('requester_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error)
    return privateJson(
      { error: { code: 'read_failed', message: 'Usage could not be loaded.' } },
      500,
    );
  return privateJson({ role, usage: data });
}
