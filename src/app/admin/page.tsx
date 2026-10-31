import { requireRole } from '@/lib/auth/verified-user';
import { adminUserSchema } from '@/features/admin-users/contracts';
import { UserDirectory } from '@/features/admin-users/user-directory';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const { user, supabase } = await requireRole('admin');
  const { data, error } = await supabase.rpc('admin_list_users', {
    p_after_user_id: null,
    p_limit: 51,
  });
  if (error) throw new Error('User directory could not be loaded');
  const rows = adminUserSchema.array().parse(data ?? []);
  const hasMore = rows.length > 50;
  const initialUsers = rows.slice(0, 50);
  return (
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-10">
      <header>
        <p className="text-sm text-muted-foreground">Administration</p>
        <h1 className="text-3xl font-semibold">User roles</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Change a user between student, instructor, and admin. At least one admin must remain.
        </p>
      </header>
      <UserDirectory
        currentUserId={user.id}
        initialUsers={initialUsers}
        initialNextAfter={hasMore ? initialUsers.at(-1)?.user_id ?? null : null}
      />
    </main>
  );
}
