import 'server-only';
import { redirect } from 'next/navigation';
import { getVerifiedUserRole } from '@/lib/auth/verified-user';

export async function requireForumMember() {
  const context = await getVerifiedUserRole();
  if (!context.user || !context.supabase) redirect('/sign-in');
  if (!context.role) redirect('/unauthorized');
  return { supabase: context.supabase, user: context.user, role: context.role };
}
