import 'server-only';
import { redirect } from 'next/navigation';
import { getVerifiedUserRole } from '@/lib/auth/verified-user';
import { usernameValue } from './contracts';

export async function loadProfileSettings() {
  const { user, role, supabase } = await getVerifiedUserRole();
  if (!user || !supabase) redirect('/sign-in');
  if (!role) redirect('/unauthorized');
  const { data, error } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .maybeSingle();
  if (error || !data) throw new Error('Profile is unavailable.');
  return {
    username: usernameValue.parse(data.display_name),
    email: user.email ?? '',
    role,
  };
}
