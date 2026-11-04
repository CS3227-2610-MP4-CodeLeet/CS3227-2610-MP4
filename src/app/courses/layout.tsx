import Link from 'next/link';
import type { ReactNode } from 'react';
import { AccountThemeButton } from '@/features/auth/app-theme';
import { SignOutButton } from '@/features/auth/auth-form';
import { getVerifiedUserRole } from '@/lib/auth/verified-user';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function CoursesLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = await getVerifiedUserRole();
  if (!user) redirect('/sign-in');
  return (
    <div className="min-h-screen">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b px-6 py-4">
        <Link href="/courses" className="font-semibold">
          CodeLeet · Courses
        </Link>
        <nav
          aria-label="Account navigation"
          className="flex items-center gap-2"
        >
          <Link href="/profile" className="rounded-md border px-3 py-2 text-sm">
            Profile
          </Link>
          <SignOutButton />
          <AccountThemeButton />
        </nav>
      </header>
      {children}
    </div>
  );
}
