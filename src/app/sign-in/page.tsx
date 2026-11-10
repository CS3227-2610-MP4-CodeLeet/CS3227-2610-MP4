import Link from 'next/link';
import { AuthForm } from '@/features/auth/auth-form';
import { AuthPageShell } from '@/features/auth/auth-page-shell';

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ confirmed?: string | string[] }>;
}) {
  const { confirmed } = await searchParams;
  return (
    <AuthPageShell>
      {confirmed === 'error' && (
        <p
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm"
        >
          That verification link is invalid or has expired. Try signing in, or{' '}
          <Link href="/sign-up" className="font-medium underline">
            create an account
          </Link>{' '}
          if you have not registered yet.
        </p>
      )}
      <AuthForm mode="sign-in" />
    </AuthPageShell>
  );
}
