'use client';

import { PendingButton } from '@/components/ui/pending-button';
import { DirectoryEmptyState } from './directory-empty-state';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { useRouter } from 'next/navigation';
import type { AdminUser, AppRole } from './contracts';

type UserListSetter = Dispatch<SetStateAction<AdminUser[]>>;
type Props = {
  currentUserId: string;
  initialUsers: AdminUser[];
  initialNextAfter: string | null;
};

const roles: AppRole[] = ['student', 'instructor', 'admin'];
const USER_DIRECTORY_LOAD_ERROR = 'The user directory could not be loaded.';

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
  void role;
  return '/courses';
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

function buildAdminUsersUrl(after: string | null, query: string, role: string) {
  const queryParts: string[] = [];
  if (after) queryParts.push(`after=${encodeURIComponent(after)}`);
  if (query.trim()) queryParts.push(`q=${encodeURIComponent(query.trim())}`);
  if (role) queryParts.push(`role=${encodeURIComponent(role)}`);
  return queryParts.length
    ? `/api/admin/users?${queryParts.join('&')}`
    : '/api/admin/users';
}

function useDebouncedSearch(search: string, delay = 300) {
  const [debounced, setDebounced] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), delay);
    return () => clearTimeout(timer);
  }, [search, delay]);
  return debounced;
}

async function fetchUsersPage(url: string) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(USER_DIRECTORY_LOAD_ERROR);
  return (await response.json()) as {
    users: AdminUser[];
    nextAfter: string | null;
  };
}

function useFilteredSearch({
  query,
  role,
  setError,
  onLoaded,
}: {
  query: string;
  role: string;
  setError: (message: string | null) => void;
  onLoaded: (page: { users: AdminUser[]; nextAfter: string | null }) => void;
}) {
  const [isSearching, setIsSearching] = useState(false);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    let isSubscribed = true;
    async function fetchFiltered() {
      setError(null);
      setIsSearching(true);
      try {
        const page = await fetchUsersPage(
          buildAdminUsersUrl(null, query, role),
        );
        if (isSubscribed) onLoaded(page);
      } catch (loadError) {
        if (isSubscribed) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : USER_DIRECTORY_LOAD_ERROR,
          );
        }
      } finally {
        if (isSubscribed) setIsSearching(false);
      }
    }

    void fetchFiltered();
    return () => {
      isSubscribed = false;
    };
  }, [query, role, setError, onLoaded]);

  return isSearching;
}

type LoadMoreState = {
  nextAfter: string | null;
  debouncedQuery: string;
  roleFilter: string;
  queryGen: { current: number };
  activeGen: number;
  setError: (msg: string | null) => void;
  setUsers: Dispatch<SetStateAction<AdminUser[]>>;
  setNextAfter: (next: string | null) => void;
  setIsLoadingMore: (loading: boolean) => void;
};

async function executeLoadMore(state: LoadMoreState) {
  state.setIsLoadingMore(true);
  try {
    const page = await fetchUsersPage(
      buildAdminUsersUrl(
        state.nextAfter,
        state.debouncedQuery,
        state.roleFilter,
      ),
    );
    if (state.queryGen.current !== state.activeGen) return;
    state.setUsers((current) => [...current, ...page.users]);
    state.setNextAfter(page.nextAfter);
  } catch (loadError) {
    if (state.queryGen.current === state.activeGen) {
      state.setError(
        loadError instanceof Error
          ? loadError.message
          : USER_DIRECTORY_LOAD_ERROR,
      );
    }
  } finally {
    if (state.queryGen.current === state.activeGen)
      state.setIsLoadingMore(false);
  }
}

function useDirectoryPages(
  initialUsers: AdminUser[],
  initialNextAfter: string | null,
  setError: (message: string | null) => void,
) {
  const [users, setUsers] = useState(initialUsers);
  const [nextAfter, setNextAfter] = useState(initialNextAfter);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const debouncedQuery = useDebouncedSearch(search);
  const pageRequestInFlight = useRef(false);
  const queryGen = useRef(0);

  useEffect(() => {
    queryGen.current += 1;
    pageRequestInFlight.current = false;
  }, [debouncedQuery, roleFilter]);

  const onLoaded = useCallback(
    (page: { users: AdminUser[]; nextAfter: string | null }) => {
      setUsers(page.users);
      setNextAfter(page.nextAfter);
    },
    [],
  );

  const isSearching = useFilteredSearch({
    query: debouncedQuery,
    role: roleFilter,
    setError,
    onLoaded,
  });

  async function loadMore() {
    if (!nextAfter || isSearching) return;
    setError(null);
    const activeGen = queryGen.current;
    await runSinglePageRequest(pageRequestInFlight, () =>
      executeLoadMore({
        nextAfter,
        debouncedQuery,
        roleFilter,
        queryGen,
        activeGen,
        setError,
        setUsers,
        setNextAfter,
        setIsLoadingMore,
      }),
    );
  }

  return {
    users,
    setUsers,
    nextAfter,
    isLoadingMore,
    isSearching,
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    loadMore,
  };
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
    <div
      role="region"
      aria-label="User directory table"
      tabIndex={0}
      className="overflow-x-auto rounded-xl border focus-visible:outline-2 focus-visible:outline-ring"
    >
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
        </tbody>
      </table>
    </div>
  );
}

function DirectoryFilters({
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  isSearching,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  roleFilter: string;
  onRoleFilterChange: (value: string) => void;
  isSearching: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="relative min-w-64 flex-1">
        <input
          type="search"
          aria-label="Search users by email or name"
          placeholder="Search users by email or name…"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
        {isSearching && (
          <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">
            Searching…
          </span>
        )}
      </div>
      <div className="w-44">
        <select
          aria-label="Filter by role"
          value={roleFilter}
          onChange={(event) => onRoleFilterChange(event.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="">All roles</option>
          <option value="student">Student</option>
          <option value="instructor">Instructor</option>
          <option value="admin">Admin</option>
        </select>
      </div>
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
      <DirectoryFilters
        search={directory.search}
        onSearchChange={directory.setSearch}
        roleFilter={directory.roleFilter}
        onRoleFilterChange={directory.setRoleFilter}
        isSearching={directory.isSearching}
      />
      {directory.users.length ? (
        <UserRows
          users={directory.users}
          busyUserIds={busyUserIds}
          changeRole={changeRole}
        />
      ) : (
        <DirectoryEmptyState
          isSearching={directory.isSearching}
          isFiltered={Boolean(directory.search.trim() || directory.roleFilter)}
          hasError={Boolean(error)}
        />
      )}
      {directory.nextAfter && (
        <PendingButton
          pending={directory.isLoadingMore}
          className="rounded-md border px-4 py-2 text-sm"
          type="button"
          disabled={directory.isLoadingMore || directory.isSearching}
          onClick={() => void directory.loadMore()}
        >
          {directory.isLoadingMore ? 'Loading users…' : 'Load more users'}
        </PendingButton>
      )}
    </section>
  );
}
