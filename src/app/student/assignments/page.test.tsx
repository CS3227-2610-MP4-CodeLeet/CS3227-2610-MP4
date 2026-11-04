import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ member: vi.fn(), access: vi.fn() }));
vi.mock('@/lib/auth/verified-user', () => ({ requireMember: mocks.member }));
vi.mock('@/lib/courses/access', () => ({ readCourseAccess: mocks.access }));
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
  redirect: (path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  },
}));

import AssignmentListPage from './page';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.member.mockResolvedValue({ user: { id: 'student-1' }, supabase: {} });
  mocks.access.mockResolvedValue({
    role: 'student',
    lifecycle: 'active',
    featureEnabled: true,
  });
});

it('redirects a course-less student assignment visit to course selection', async () => {
  await expect(
    AssignmentListPage({ searchParams: Promise.resolve({}) }),
  ).rejects.toThrow('NEXT_REDIRECT:/courses');
  expect(mocks.member).toHaveBeenCalledOnce();
  expect(mocks.access).not.toHaveBeenCalled();
});
