'use client';

import { useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import type { AdminUser, AppRole } from './contracts';

type UserListSetter = Dispatch<SetStateAction<AdminUser[]>>;
type Props = {
  currentUserId: string;
  initialUsers: AdminUser[];
  initialNextAfter: string | null;
};

const roles: AppRole[] = ['student', 'instructor', 'admin'];

type ChangeOptions = {
  targetUserId: string;
  currentUserId: string;
  role: AppRole;
  confirm: () => boolean;
  save: () => Promise<void>;
  navigate: (destination: string) => void;
};

export async function confirmRoleChange({
  targetUserId,
  currentUserId,
  role,
  confirm,
  save,
  navigate,
}: ChangeOptions) {
  const isSelf = targetUserId === currentUserId;
  if (isSelf && !confirm()) return false;
  await save();
  if (isSelf) navigate(destinationForRole(role));
  return true;
}

export function destinationForRole(role: AppRole) {
  return role === 'student' ? '/student/assignments' : '/instructor';
}

export async function runSinglePageRequest(
  inFlight: { current: boolean },
  request: () => Promise<void>,
) {
  if (inFlight.current) return false;
  inFlight.current = true;
  try {
    await request();
    return true;
  } finally {
    inFlight.current = false;
  }
}

export async function runUserRoleChange(
  pendingUserIds: Set<string>,
  userId: string,
  request: () => Promise<void>,
  onPendingChange: (pending: ReadonlySet<string>) => void,
) {
  if (pendingUserIds.has(userId)) return false;
  pendingUserIds.add(userId);
  try {
    onPendingChange(new Set(pendingUserIds));
    await request();
    return true;
  } finally {
    pendingUserIds.delete(userId);
    onPendingChange(new Set(pendingUserIds));
  }
}

function useRoleChanges(
  currentUserId: string,
  setUsers: UserListSetter,
  setError: (message: string | null) => void,
) {
  const router = useRouter();
  const pendingUserIds = useRef(new Set<string>());
  const [busyUserIds, setBusyUserIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  async function changeRole(user: AdminUser, role: AppRole) {
    if (role === user.role || pendingUserIds.current.has(user.user_id)) return;
    setError(null);
    await runUserRoleChange(
      pendingUserIds.current,
      user.user_id,
      async () => {
        try {
          const confirmed = await confirmRoleChange({
            targetUserId: user.user_id,
            currentUserId,
            role,
            confirm: () =>
              window.confirm(
                'Warning: changing your own role takes effect immediately and changes your access to the admin panel. The system will block this change if it would leave no admin. Continue?',
              ),
            save: async () => {
              const response = await fetch(
                `/api/admin/users/${encodeURIComponent(user.user_id)}/role`,
                {
                  method: 'PATCH',
                  headers: { 'content-type': 'application/json' },
                  body: JSON.stringify({ role }),
                },
              );
              if (!response.ok) await throwRoleChangeError(response);
            },
            navigate: (destination) => router.replace(destination),
          });
          if (!confirmed) return;
          if (user.user_id === currentUserId) router.refresh();
          else {
            setUsers((current) =>
              current.map((item) =>
                item.user_id === user.user_id ? { ...item, role } : item,
              ),
            );
          }
        } catch (changeError) {
          setError(
            changeError instanceof Error
              ? changeError.message
              : 'The role could not be changed.',
          );
        }
      },
      setBusyUserIds,
    );
  }

  return { busyUserIds, changeRole };
}

async function throwRoleChangeError(response: Response): Promise<never> {
  const payload = (await response.json()) as { error?: { code?: string } };
  if (payload.error?.code === 'final_admin_required')
    throw new Error(
      'This role change is blocked because at least one admin must remain.',
    );
  throw new Error('The role could not be changed. Refresh and try again.');
}

function useDirectoryPages(
  initialUsers: AdminUser[],
  initialNextAfter: string | null,
  setError: (message: string | null) => void,
) {
  const [users, setUsers] = useState(initialUsers);
  const [nextAfter, setNextAfter] = useState(initialNextAfter);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const pageRequestInFlight = useRef(false);

  async function loadMore() {
    if (!nextAfter) return;
    setError(null);
    await runSinglePageRequest(pageRequestInFlight, async () => {
      setIsLoadingMore(true);
      try {
        const response = await fetch(
          `/api/admin/users?after=${encodeURIComponent(nextAfter)}`,
          { cache: 'no-store' },
        );
        if (!response.ok)
          throw new Error('The user directory could not be loaded.');
        const page = (await response.json()) as {
          users: AdminUser[];
          nextAfter: string | null;
        };
        setUsers((current) => [...current, ...page.users]);
        setNextAfter(page.nextAfter);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'The user directory could not be loaded.',
        );
      } finally {
        setIsLoadingMore(false);
      }
    });
  }

  return { users, setUsers, nextAfter, isLoadingMore, loadMore };
}

function UserRows({
  users,
  busyUserIds,
  changeRole,
}: {
  users: AdminUser[];
  busyUserIds: ReadonlySet<string>;
  changeRole: (user: AdminUser, role: AppRole) => Promise<void>;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-left text-sm">
        <thead className="border-b bg-muted/50">
          <tr>
            <th className="p-3 font-medium">Email</th>
            <th className="p-3 font-medium">Display name</th>
            <th className="p-3 font-medium">User ID</th>
            <th className="p-3 font-medium">Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.user_id} className="border-b last:border-0">
              <td className="p-3">{user.email ?? 'No email'}</td>
              <td className="p-3">{user.display_name}</td>
              <td className="p-3 font-mono text-xs">{user.user_id}</td>
              <td className="p-3">
                <select
                  aria-label={`Role for ${user.email ?? user.user_id}`}
                  className="rounded-md border bg-background px-2 py-1"
                  value={user.role}
                  disabled={busyUserIds.has(user.user_id)}
                  onChange={(event) =>
                    void changeRole(user, event.currentTarget.value as AppRole)
                  }
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
          {!users.length && (
            <tr>
              <td className="p-4 text-muted-foreground" colSpan={4}>
                No registered users.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function UserDirectory({
  currentUserId,
  initialUsers,
  initialNextAfter,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const directory = useDirectoryPages(initialUsers, initialNextAfter, setError);
  const { busyUserIds, changeRole } = useRoleChanges(
    currentUserId,
    directory.setUsers,
    setError,
  );

  return (
    <section className="space-y-4">
      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive p-3 text-sm"
        >
          {error}
        </p>
      )}
      <UserRows
        users={directory.users}
        busyUserIds={busyUserIds}
        changeRole={changeRole}
      />
      {directory.nextAfter && (
        <button
          className="rounded-md border px-4 py-2 text-sm"
          type="button"
          disabled={directory.isLoadingMore}
          onClick={() => void directory.loadMore()}
        >
          {directory.isLoadingMore ? 'Loading users…' : 'Load more users'}
        </button>
      )}
    </section>
  );
}
