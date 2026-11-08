import { redirect } from 'next/navigation';
import { getVerifiedUserRole } from '@/lib/auth/verified-user';
import { ButtonLink } from '@/components/ui/pending-link';

export const dynamic = 'force-dynamic';

export default async function Home() {
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    const { user } = await getVerifiedUserRole();
    if (user) redirect('/courses');
  }
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center gap-6 px-6 py-16">
      <p className="text-sm font-medium tracking-wide text-muted-foreground">
        CS3227 · CodeLeet
      </p>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
        Programming Assignment Platform
      </h1>
      <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
        A place to practise programming, submit assignments and learn from
        feedback.
      </p>
      <div className="flex flex-wrap gap-3">
        <ButtonLink href="/sign-up" variant="primary" size="lg">
          Create student account
        </ButtonLink>
        <ButtonLink href="/sign-in" size="lg">
          Sign in
        </ButtonLink>
      </div>
    </main>
  );
}
