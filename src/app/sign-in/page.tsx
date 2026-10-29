import { AuthForm } from '@/features/auth/auth-form';

export default function SignInPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl items-center justify-center px-6 py-12">
      <AuthForm mode="sign-in" />
    </main>
  );
}
