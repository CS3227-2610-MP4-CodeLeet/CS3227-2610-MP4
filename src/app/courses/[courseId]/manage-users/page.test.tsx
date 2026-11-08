// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  verified: vi.fn(),
  rpc: vi.fn(),
  from: vi.fn(),
}));

vi.mock('@/lib/auth/verified-user', () => ({
  getVerifiedUserRole: mocks.verified,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
  redirect: (path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  },
}));

vi.mock('@/components/layout/breadcrumb-context', () => ({
  BreadcrumbSetter: () => null,
}));

import ManageUsersPage from './page';

function query(result: unknown) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    maybeSingle: vi.fn(async () => result),
    then: (
      resolve: (value: unknown) => unknown,
      reject: (reason: unknown) => unknown,
    ) => Promise.resolve(result).then(resolve, reject),
  };
  return builder;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ status: 'ok' }) }),
  );
});

describe('ManageUsersPage', () => {
  const courseId = 'test-course-id';

  it('renders student join code above people for instructors', async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'courses') {
          return query({
            data: {
              id: courseId,
              owner_id: 'owner-1',
              title: 'Algorithms',
              description: 'Fall',
              lifecycle: 'active',
              is_legacy: false,
            },
            error: null,
          });
        }
        if (table === 'course_memberships') {
          return query({ data: { role: 'instructor' }, error: null });
        }
        return query({ data: [], error: null });
      }),
      rpc: mocks.rpc.mockImplementation(async (fn: string) => {
        if (fn === 'list_course_members') {
          return {
            data: [
              {
                user_id: 'owner-1',
                email: 'owner@example.test',
                display_name: 'Owner',
                role: 'instructor',
                joined_at: '2026-01-01',
              },
            ],
            error: null,
          };
        }
        if (fn === 'list_course_invitations') {
          return { data: [], error: null };
        }
        return { data: null, error: null };
      }),
    };

    mocks.verified.mockResolvedValue({
      user: { id: 'owner-1' },
      role: 'instructor',
      supabase,
    });

    const element = await ManageUsersPage({
      params: Promise.resolve({ courseId }),
    });

    render(element);

    expect(screen.getByRole('heading', { name: 'Manage Users' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Student join code' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'People' })).toBeTruthy();

    // Verify Student join code appears above People in document order
    const joinCodeHeading = screen.getByRole('heading', { name: 'Student join code' });
    const peopleHeading = screen.getByRole('heading', { name: 'People' });
    expect(
      joinCodeHeading.compareDocumentPosition(peopleHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('triggers notFound when a student visits manage-users', async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'courses') {
          return query({
            data: {
              id: courseId,
              owner_id: 'owner-1',
              title: 'Algorithms',
              description: 'Fall',
              lifecycle: 'active',
              is_legacy: false,
            },
            error: null,
          });
        }
        if (table === 'course_memberships') {
          return query({ data: { role: 'student' }, error: null });
        }
        return query({ data: [], error: null });
      }),
      rpc: mocks.rpc,
    };

    mocks.verified.mockResolvedValue({
      user: { id: 'student-1' },
      role: 'student',
      supabase,
    });

    await expect(
      ManageUsersPage({ params: Promise.resolve({ courseId }) }),
    ).rejects.toThrow('NEXT_NOT_FOUND');
  });
});
