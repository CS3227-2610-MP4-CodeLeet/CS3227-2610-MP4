import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ResetPasswordForm } from '@/features/auth/reset-password-form';
import { AuthPageShell } from '@/features/auth/auth-page-shell';

export const dynamic = 'force-dynamic';

async function hasVerifiedSession() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    return Boolean(user && !error);
  } catch {
    return false;
  }
}

export default async function ResetPasswordPage() {
  const verified = await hasVerifiedSession();
  return (
    <AuthPageShell>
      {verified ? (
        <ResetPasswordForm />
      ) : (
        <section className="w-full max-w-md space-y-4 rounded-xl border bg-card p-6">
          <h1 className="text-2xl font-semibold">Reset link unavailable</h1>
          <p className="text-sm text-muted-foreground">
            Open the reset link from your email to choose a new password.
          </p>
          <Link
            href="/forgot-password"
            className="inline-block text-sm underline"
          >
            Request a new link
          </Link>
        </section>
      )}
    </AuthPageShell>
  );
}
