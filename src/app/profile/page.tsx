import Link from 'next/link';
import { AccountThemeButton } from '@/features/auth/app-theme';
import { SignOutButton } from '@/features/auth/sign-out-button';
import { ProfileForm } from '@/features/profile/profile-form';
import { loadProfileSettings } from '@/features/profile/profile.server';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const profile = await loadProfileSettings();
  const workspace =
    profile.role === 'student' ? '/student/assignments' : '/instructor';
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-8">
      <header className="flex min-h-20 flex-wrap items-center justify-between gap-3 border-b py-4">
        <Link href={workspace} className="text-lg font-semibold tracking-tight">
          CodeLeet
        </Link>
        <div className="flex items-center gap-2">
          <SignOutButton />
          <AccountThemeButton />
        </div>
      </header>
      <main className="space-y-5 py-6 sm:py-10">
        <Link
          href={workspace}
          className="text-sm text-cyan-800 underline dark:text-cyan-300"
        >
          {profile.role === 'student'
            ? 'Back to assignments'
            : 'Back to instructor workspace'}
        </Link>
        <section className="space-y-6 rounded-xl border bg-background p-5 sm:p-7">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Profile settings
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage how you appear in CodeLeet.
            </p>
          </div>
          <ProfileForm {...profile} />
        </section>
      </main>
    </div>
  );
}
