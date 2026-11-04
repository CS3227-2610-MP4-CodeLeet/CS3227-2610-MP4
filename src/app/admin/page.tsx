import { requireRole } from '@/lib/auth/verified-user';
import { adminUserSchema } from '@/features/admin-users/contracts';
import { LegacyOwnerAssignment } from '@/features/course-workspaces/legacy-owner-assignment';
import { UserDirectory } from '@/features/admin-users/user-directory';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

async function loadAdminData(supabase: Supabase) {
  const [{ data, error }, legacyResult] = await Promise.all([
    supabase.rpc('admin_list_users', { p_after_user_id: null, p_limit: 51 }),
    supabase
      .from('courses')
      .select('id,owner_id')
      .eq('is_legacy', true)
      .maybeSingle(),
  ]);
  if (error) throw new Error('User directory could not be loaded');
  if (legacyResult.error) throw new Error('Legacy course could not be loaded');
  const rows = adminUserSchema.array().parse(data ?? []);
  const initialUsers = rows.slice(0, 50);
  return {
    legacy: legacyResult.data,
    initialUsers,
    nextAfter: rows.length > 50 ? (initialUsers.at(-1)?.user_id ?? null) : null,
  };
}

export default async function AdminPage() {
  const { user, supabase } = await requireRole('admin');
  const { legacy, initialUsers, nextAfter } = await loadAdminData(supabase);
  return (
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-10">
      <header>
        <p className="text-sm text-muted-foreground">Administration</p>
        <h1 className="text-3xl font-semibold">User roles</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Change a user between student, instructor, and admin. At least one
          admin must remain.
        </p>
      </header>
      {legacy && (
        <LegacyOwnerAssignment
          courseId={legacy.id}
          ownerId={legacy.owner_id}
          initialInstructors={initialUsers
            .filter((candidate) => candidate.role === 'instructor')
            .map(({ user_id, email, display_name }) => ({
              user_id,
              email,
              display_name,
            }))}
          nextAfter={nextAfter}
        />
      )}
      <UserDirectory
        currentUserId={user.id}
        initialUsers={initialUsers}
        initialNextAfter={nextAfter}
      />
    </main>
  );
}
