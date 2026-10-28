import 'server-only';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';

export type AppRole = 'student' | 'instructor';
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
  const role =
    roleRecord?.role === 'student' || roleRecord?.role === 'instructor'
      ? roleRecord.role
      : null;
  return { supabase, user, role };
}

export async function requireRole(expected: AppRole) {
  const context = await getVerifiedUserRole();
  if (!context.user) redirect('/sign-in');
  if (context.role !== expected) redirect('/unauthorized');
  return context as typeof context & {
    supabase: NonNullable<typeof context.supabase>;
    user: NonNullable<typeof context.user>;
    role: AppRole;
  };
}
