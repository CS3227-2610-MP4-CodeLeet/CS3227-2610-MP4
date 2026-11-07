import Link from 'next/link';
import { AccountThemeButton } from '@/features/auth/app-theme';
import { SignOutButton } from '@/features/auth/auth-form';
import type { AppRole } from '@/lib/auth/roles';

export function AppHeader({ role }: { role?: AppRole | null }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b px-6 py-4">
      <div className="flex items-center gap-5">
        <Link href="/courses" className="font-semibold">
          CodeLeet
        </Link>
        <Link className="text-sm underline" href="/courses">
          Courses
        </Link>
        {role === 'admin' && (
          <Link className="text-sm underline" href="/admin">
            User roles
          </Link>
        )}
      </div>
      <nav aria-label="Account navigation" className="flex items-center gap-2">
        <Link href="/profile" className="rounded-md border px-3 py-2 text-sm">
          Profile
        </Link>
        <SignOutButton />
        <AccountThemeButton />
      </nav>
    </header>
  );
}
