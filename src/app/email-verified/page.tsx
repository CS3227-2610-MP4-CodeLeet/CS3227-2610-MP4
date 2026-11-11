import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { getVerifiedUserRole } from '@/lib/auth/verified-user';

export const dynamic = 'force-dynamic';

export default async function EmailVerifiedPage() {
  const { user, role } = await getVerifiedUserRole();
  if (!user?.email_confirmed_at) redirect('/sign-in');

  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl items-center justify-center px-6 py-12">
      <section className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm sm:p-10">
        <div className="mb-6 inline-flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          <CheckCircle2 aria-hidden="true" className="size-8" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Email verified
        </h1>
        {role ? (
          <>
            <p className="mt-3 text-muted-foreground">
              Your account is ready. You can now open your courses.
            </p>
            <Link
              href="/courses"
              className="mt-7 inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 py-2.5 font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Continue to Courses
            </Link>
          </>
        ) : (
          <p className="mt-3 text-muted-foreground">
            Your email is confirmed, but this account cannot access courses yet.
            Ask a project administrator to check your account role.
          </p>
        )}
      </section>
    </main>
  );
}
