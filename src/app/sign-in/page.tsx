import { AuthForm } from '@/features/auth/auth-form';
import { AuthPageShell } from '@/features/auth/auth-page-shell';

export default function SignInPage() {
  return (
    <AuthPageShell>
      <AuthForm mode="sign-in" />
    </AuthPageShell>
  );
}
