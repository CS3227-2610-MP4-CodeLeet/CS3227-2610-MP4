import 'server-only';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';
import { canAccessRole, isAppRole, type AppRole } from './roles';

export type { AppRole } from './roles';

type VerifiedContext =
  | { supabase: null; user: null; role: null }
  | {
      supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
      user: User;
      role: AppRole | null;
    };

export async function getVerifiedUserRole(): Promise<VerifiedContext> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    return { supabase: null, user: null, role: null };
  }
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return { supabase: null, user: null, role: null };
  const { data: roleRecord, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();
  if (roleError) throw new Error('Unable to verify account role');
  const role = isAppRole(roleRecord?.role) ? roleRecord.role : null;
  return { supabase, user, role };
}

export async function requireRole(expected: AppRole) {
  const context = await getVerifiedUserRole();
  if (!context.user) redirect('/sign-in');
  if (!canAccessRole(expected, context.role)) redirect('/unauthorized');
  return context as typeof context & {
    supabase: NonNullable<typeof context.supabase>;
    user: NonNullable<typeof context.user>;
    role: AppRole;
  };
}

export async function requireMember() {
  const context = await getVerifiedUserRole();
  if (!context.user || !context.supabase) redirect('/sign-in');
  if (!context.role) redirect('/unauthorized');
  return { supabase: context.supabase, user: context.user, role: context.role };
}
