import { beforeEach, expect, it, vi } from 'vitest';
import CourseLeaderboardPage from './page';
import { requireMember } from '@/lib/auth/verified-user';
import { readCourseAccess } from '@/lib/courses/access';
import { loadLeaderboard } from '@/features/leaderboard/queries.server';

vi.mock('@/lib/auth/verified-user', () => ({ requireMember: vi.fn() }));
vi.mock('@/lib/courses/access', () => ({ readCourseAccess: vi.fn() }));
vi.mock('@/features/leaderboard/queries.server', () => ({
  loadLeaderboard: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireMember).mockResolvedValue({
    user: { id: 'user-1' },
    supabase: {},
  } as never);
  vi.mocked(readCourseAccess).mockResolvedValue({
    role: 'student',
    lifecycle: 'active',
    featureEnabled: true,
  } as never);
  vi.mocked(loadLeaderboard).mockResolvedValue({
    rows: [],
    page: 1,
    has_more: false,
  } as never);
});

it('loads leaderboard for course member', async () => {
  const result = await CourseLeaderboardPage({
    params: Promise.resolve({ courseId: 'course-123' }),
    searchParams: Promise.resolve({ page: '1' }),
  });
  expect(result).toBeDefined();
  expect(loadLeaderboard).toHaveBeenCalledWith(
    expect.anything(),
    'course-123',
    1,
  );
});

it('fails closed when member has no leaderboard access', async () => {
  vi.mocked(readCourseAccess).mockResolvedValue(null as never);
  await expect(
    CourseLeaderboardPage({
      params: Promise.resolve({ courseId: 'course-123' }),
      searchParams: Promise.resolve({}),
    }),
  ).rejects.toThrow('NEXT_NOT_FOUND');
});
