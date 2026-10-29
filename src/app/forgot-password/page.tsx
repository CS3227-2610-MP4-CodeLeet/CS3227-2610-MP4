import { ForgotPasswordForm } from '@/features/auth/forgot-password-form';

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl items-center justify-center px-6 py-12">
      <ForgotPasswordForm invalidLink={error === 'invalid-link'} />
    </main>
  );
}
