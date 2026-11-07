/* eslint-disable max-lines-per-function -- behavioral test suites keep related scenarios together. */
/* eslint-disable sonarjs/no-duplicate-string -- repeated expected text documents the user-facing contract. */
// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));
import {
  confirmRoleChange,
  destinationForRole,
  runSinglePageRequest,
  UserDirectory,
} from './user-directory';

const users = [
  {
    user_id: '00000000-0000-4000-8000-000000000001',
    email: 'admin@example.test',
    display_name: 'Admin User',
    role: 'admin' as const,
  },
];

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('admin user directory', () => {
  it('renders the approved account fields and role options', () => {
    const markup = renderToStaticMarkup(
      <UserDirectory
        currentUserId={users[0].user_id}
        initialUsers={users}
        initialNextAfter={null}
      />,
    );
    expect(markup).toContain('admin@example.test');
    expect(markup).toContain('Admin User');
    expect(markup).toContain(users[0].user_id);
    expect(markup).toContain('student');
    expect(markup).toContain('instructor');
    expect(markup).toContain('admin');
  });

  it('sends no role update when a self-change warning is cancelled', async () => {
    const confirm = vi.fn(() => false);
    const save = vi.fn();
    const navigate = vi.fn();
    await confirmRoleChange({
      targetUserId: users[0].user_id,
      currentUserId: users[0].user_id,
      role: 'instructor',
      confirm,
      save,
      navigate,
    });
    expect(confirm).toHaveBeenCalledOnce();
    expect(save).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('saves once after self-change confirmation and selects the resulting workspace', async () => {
    const confirm = vi.fn(() => true);
    const save = vi.fn().mockResolvedValue(undefined);
    const navigate = vi.fn();
    await confirmRoleChange({
      targetUserId: users[0].user_id,
      currentUserId: users[0].user_id,
      role: 'instructor',
      confirm,
      save,
      navigate,
    });
    expect(save).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith('/courses');
    expect(destinationForRole('student')).toBe('/student/assignments');
  });

  it('ignores duplicate page loads while one request is pending and releases the guard', async () => {
    let finishRequest!: () => void;
    const request = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finishRequest = resolve;
        }),
    );
    const inFlight = { current: false };

    const firstLoad = runSinglePageRequest(inFlight, request);
    const duplicateLoad = runSinglePageRequest(inFlight, request);

    await expect(duplicateLoad).resolves.toBe(false);
    expect(request).toHaveBeenCalledOnce();
    finishRequest();
    await expect(firstLoad).resolves.toBe(true);
    expect(inFlight.current).toBe(false);
  });

  it('loads and appends a subsequent user page', async () => {
    const next = {
      ...users[0],
      user_id: '00000000-0000-4000-8000-000000000002',
      email: 'next@example.test',
    };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ users: [next], nextAfter: null }), {
          status: 200,
        }),
      ),
    );
    render(
      <UserDirectory
        currentUserId="other"
        initialUsers={users}
        initialNextAfter="cursor / one"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Load more users' }));
    expect(await screen.findByText('next@example.test')).toBeTruthy();
    expect(fetch).toHaveBeenCalledWith(
      '/api/admin/users?after=cursor%20%2F%20one',
      { cache: 'no-store' },
    );
    expect(
      screen.queryByRole('button', { name: 'Load more users' }),
    ).toBeNull();
  });

  it('saves another user role and updates that row', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('{}', { status: 200 })),
    );
    render(
      <UserDirectory
        currentUserId="other"
        initialUsers={users}
        initialNextAfter={null}
      />,
    );
    fireEvent.change(
      screen.getByRole('combobox', { name: 'Role for admin@example.test' }),
      { target: { value: 'instructor' } },
    );
    await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    expect(fetch).toHaveBeenCalledWith(
      '/api/admin/users/00000000-0000-4000-8000-000000000001/role',
      expect.objectContaining({ method: 'PATCH' }),
    );
    expect(
      (
        screen.getByRole('combobox', {
          name: 'Role for admin@example.test',
        }) as HTMLSelectElement
      ).value,
    ).toBe('instructor');
  });

  it('shows the final-admin denial and does not leave the pending state behind', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({ error: { code: 'final_admin_required' } }),
            { status: 409 },
          ),
        ),
    );
    render(
      <UserDirectory
        currentUserId="other"
        initialUsers={users}
        initialNextAfter={null}
      />,
    );
    fireEvent.change(
      screen.getByRole('combobox', { name: 'Role for admin@example.test' }),
      { target: { value: 'student' } },
    );
    expect((await screen.findByRole('alert')).textContent).toContain(
      'at least one admin must remain',
    );
    expect(
      (
        screen.getByRole('combobox', {
          name: 'Role for admin@example.test',
        }) as HTMLSelectElement
      ).disabled,
    ).toBe(false);
  });

  it('searches users with debounce and updates directory', async () => {
    const searchedUser = {
      user_id: '00000000-0000-4000-8000-000000000099',
      email: 'searched@example.test',
      display_name: 'Searched User',
      role: 'student' as const,
    };
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ users: [searchedUser], nextAfter: null }),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', mockFetch);

    render(
      <UserDirectory
        currentUserId="other"
        initialUsers={users}
        initialNextAfter="cursor-1"
      />,
    );

    const searchInput = screen.getByRole('searchbox', {
      name: /search users/i,
    });
    fireEvent.change(searchInput, { target: { value: 'searched@example.test' } });

    // Wait for 300ms debounce
    await new Promise((resolve) => setTimeout(resolve, 350));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/users?q=searched%40example.test',
        expect.anything(),
      );
    });
  });

  it('filters users by role and updates directory', async () => {
    const instructorUser = {
      user_id: '00000000-0000-4000-8000-000000000088',
      email: 'instructor@example.test',
      display_name: 'Instructor User',
      role: 'instructor' as const,
    };
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ users: [instructorUser], nextAfter: null }),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', mockFetch);

    render(
      <UserDirectory
        currentUserId="other"
        initialUsers={users}
        initialNextAfter="cursor-1"
      />,
    );

    const roleFilter = screen.getByRole('combobox', { name: /filter by role/i });
    fireEvent.change(roleFilter, { target: { value: 'instructor' } });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/users?role=instructor'),
        expect.anything(),
      );
    });
  });
});
