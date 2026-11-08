import { AuthForm } from '@/features/auth/auth-form';
import { AuthPageShell } from '@/features/auth/auth-page-shell';

export default function SignUpPage() {
  return (
    <AuthPageShell>
      <AuthForm mode="sign-up" />
    </AuthPageShell>
  );
}
