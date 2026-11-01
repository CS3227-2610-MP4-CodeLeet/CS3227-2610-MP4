import type { ReactNode } from 'react';
import Link from 'next/link';
import { AccountThemeButton } from '@/features/auth/app-theme';
import { SignOutButton } from '@/features/auth/auth-form';
import { requireRole } from '@/lib/auth/verified-user';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireRole('admin');
  return (
    <div>
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-5">
          <Link href="/admin" className="font-semibold">
            CodeLeet · Admin
          </Link>
          <Link className="text-sm underline" href="/instructor">
            Instructor workspace
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <SignOutButton />
          <AccountThemeButton />
        </div>
      </header>
      {children}
    </div>
  );
}
