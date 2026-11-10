/** @vitest-environment jsdom */
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import CourseWorkspaceLayout from './layout';

const COURSE_ID = 'course-123';

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
  usePathname: () => `/courses/${COURSE_ID}`,
}));

vi.mock('@/lib/auth/verified-user', () => ({
  getVerifiedUserRole: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function createMockSupabase(
  membership: { role: string } | null = { role: 'student' },
) {
  return {
    from: vi.fn((table: string) => {
      if (table === 'courses') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              id: COURSE_ID,
              title: 'Intro to Python',
              lifecycle: 'active',
              is_legacy: false,
            },
            error: null,
          }),
        };
      }
      if (table === 'course_memberships') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: membership,
            error: null,
          }),
        };
      }
      if (table === 'course_features') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({
            data: [{ feature: 'assessments', enabled: true }],
            error: null,
          }),
        };
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { display_name: 'John Doe' },
            error: null,
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    }),
    rpc: vi.fn().mockResolvedValue({
      data: { total_xp: '500', page: 1, has_more: false, awards: [] },
      error: null,
    }),
  };
}

describe('CourseWorkspaceLayout', () => {
  it('renders sidebar, breadcrumbs, and children when member has access', async () => {
    const { getVerifiedUserRole } = await import('@/lib/auth/verified-user');

    vi.mocked(getVerifiedUserRole).mockResolvedValue({
      user: { id: 'user-1', email: 'john@example.com' } as never,
      role: 'student',
      supabase: createMockSupabase() as never,
    });

    const element = await CourseWorkspaceLayout({
      children: <div>Course Page Content</div>,
      params: Promise.resolve({ courseId: COURSE_ID }),
    });

    render(element);

    expect(screen.getByText('Course Page Content')).toBeDefined();
    expect(
      screen.getAllByText('Intro to Python').length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('John Doe')).toBeDefined();
  });

  it('keeps nonmember platform admins out of the course-member route tree', async () => {
    const { getVerifiedUserRole } = await import('@/lib/auth/verified-user');

    vi.mocked(getVerifiedUserRole).mockResolvedValue({
      user: { id: 'admin-1', email: 'admin@example.com' } as never,
      role: 'admin',
      supabase: createMockSupabase(null) as never,
    });

    await expect(
      CourseWorkspaceLayout({
        children: <div>Course Page Content</div>,
        params: Promise.resolve({ courseId: COURSE_ID }),
      }),
    ).rejects.toThrow('NEXT_NOT_FOUND');
  });
});
