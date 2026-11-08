import { ForgotPasswordForm } from '@/features/auth/forgot-password-form';
import { AuthPageShell } from '@/features/auth/auth-page-shell';

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <AuthPageShell>
      <ForgotPasswordForm invalidLink={error === 'invalid-link'} />
    </AuthPageShell>
  );
}
