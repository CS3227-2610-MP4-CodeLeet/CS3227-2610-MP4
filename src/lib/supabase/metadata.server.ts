import 'server-only';
import { createClient } from '@supabase/supabase-js';

const auth = {
  persistSession: false,
  autoRefreshToken: false,
  detectSessionInUrl: false,
};
export function createSignInClients() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVER_SECRET_KEY;
  const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const secret = process.env.AUTH_RATE_LIMIT_SECRET;
  if (!url || !key || !publishable || !secret || secret.length < 32)
    throw new Error('Sign-in configuration unavailable');
  return {
    metadata: createClient(url, key, { auth }),
    secret,
    getDummyClient: () => createClient(url, publishable, { auth }),
  };
}
