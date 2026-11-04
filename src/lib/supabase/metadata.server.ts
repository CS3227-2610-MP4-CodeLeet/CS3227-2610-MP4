import 'server-only';
import { createClient } from '@supabase/supabase-js';

const auth = {
  persistSession: false,
  autoRefreshToken: false,
  detectSessionInUrl: false,
};

function missingSignInFields(
  url?: string,
  key?: string,
  publishable?: string,
  secret?: string,
) {
  const missing: string[] = [];
  if (!url) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!key) missing.push('SUPABASE_SERVER_SECRET_KEY');
  if (!publishable) missing.push('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
  if (!secret) missing.push('AUTH_RATE_LIMIT_SECRET');
  else if (secret.length < 32)
    missing.push('AUTH_RATE_LIMIT_SECRET (< 32 chars)');
  return missing;
}

export function createSignInClients() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVER_SECRET_KEY;
  const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const secret = process.env.AUTH_RATE_LIMIT_SECRET;
  const missing = missingSignInFields(url, key, publishable, secret);
  if (missing.length > 0) {
    console.error('Sign-in configuration unavailable:', missing.join(', '));
    throw new Error('Sign-in configuration unavailable');
  }
  return {
    metadata: createClient(url!, key!, { auth }),
    secret: secret!,
    getDummyClient: () => createClient(url!, publishable!, { auth }),
  };
}
