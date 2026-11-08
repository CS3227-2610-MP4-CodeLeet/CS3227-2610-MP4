import Link from 'next/link';
import { BookOpen, ShieldCheck, UserRound } from 'lucide-react';
import { ButtonLink } from '@/components/ui/pending-link';
import { AccountThemeButton } from '@/features/auth/app-theme';
import { SignOutButton } from '@/features/auth/auth-form';
import type { AppRole } from '@/lib/auth/roles';

const iconClassName = 'size-4 shrink-0';

export function AppHeader({ role }: { role?: AppRole | null }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b px-6 py-4">
      <div className="flex items-center gap-3">
        <Link href="/courses" className="mr-2 font-semibold">
          CodeLeet
        </Link>
        <nav
          aria-label="Primary navigation"
          className="flex items-center gap-2"
        >
          <ButtonLink
            href="/courses"
            icon={<BookOpen aria-hidden="true" className={iconClassName} />}
          >
            Courses
          </ButtonLink>
          {role === 'admin' && (
            <ButtonLink
              href="/admin"
              icon={
                <ShieldCheck aria-hidden="true" className={iconClassName} />
              }
            >
              User roles
            </ButtonLink>
          )}
        </nav>
      </div>
      <nav aria-label="Account navigation" className="flex items-center gap-2">
        <ButtonLink
          href="/profile"
          icon={<UserRound aria-hidden="true" className={iconClassName} />}
        >
          Profile
        </ButtonLink>
        <SignOutButton />
        <AccountThemeButton />
      </nav>
    </header>
  );
}
