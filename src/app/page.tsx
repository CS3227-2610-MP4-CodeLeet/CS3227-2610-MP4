import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getVerifiedUserRole } from '@/lib/auth/verified-user';

export const dynamic = 'force-dynamic';

export default async function Home() {
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    const { user, role } = await getVerifiedUserRole();
    if (user && role === 'student') redirect('/student/assignments');
    if (user && role === 'instructor') redirect('/instructor');
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
        <Link
          href="/sign-up"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Create student account
        </Link>
        <Link
          href="/sign-in"
          className="rounded-md border px-4 py-2 text-sm font-medium"
        >
          Sign in
        </Link>
      </div>
      <p className="max-w-xl text-sm text-muted-foreground">
        Students can submit Python source for educational feedback. Assignments
        are created by trusted instructors. Submitted source is not executed by
        the server.
      </p>
    </main>
  );
}
