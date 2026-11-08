import { ProfileForm } from '@/features/profile/profile-form';
import { loadProfileSettings } from '@/features/profile/profile.server';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const profile = await loadProfileSettings();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-8 sm:py-12">
      <section className="space-y-6 rounded-xl border bg-background p-5 sm:p-7 shadow-sm">
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
  );
}
