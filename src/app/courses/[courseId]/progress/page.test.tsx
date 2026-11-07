import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, it, vi } from 'vitest';
import CourseProgressPage from './page';
import { requireMember } from '@/lib/auth/verified-user';
import { readCourseAccess } from '@/lib/courses/access';
import {
  loadAssignmentProgress,
  loadUpcomingAssignments,
} from '@/features/student-progress/assignments.server';
import {
  loadRecentGrades,
  loadRecentSubmissions,
} from '@/features/student-progress/activity.server';
import { loadOwnXp } from '@/features/assignment-xp/queries.server';

vi.mock('@/lib/auth/verified-user', () => ({
  requireMember: vi.fn(),
}));
vi.mock('@/lib/courses/access', () => ({ readCourseAccess: vi.fn() }));
vi.mock('@/features/student-progress/assignments.server', () => ({
  loadAssignmentProgress: vi.fn(),
  loadUpcomingAssignments: vi.fn(),
}));
vi.mock('@/features/student-progress/activity.server', () => ({
  loadRecentSubmissions: vi.fn(),
  loadRecentGrades: vi.fn(),
}));
vi.mock('@/features/assignment-xp/queries.server', () => ({
  loadOwnXp: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));

const courseId = crypto.randomUUID();
const pageProps = { params: Promise.resolve({ courseId }) };
const verified = {
  user: { id: crypto.randomUUID() },
  supabase: {},
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireMember).mockResolvedValue(verified as never);
  vi.mocked(readCourseAccess).mockResolvedValue({
    role: 'student',
    lifecycle: 'active',
    featureEnabled: true,
  } as never);
  vi.mocked(loadAssignmentProgress).mockResolvedValue({} as never);
  vi.mocked(loadUpcomingAssignments).mockResolvedValue([]);
  vi.mocked(loadRecentSubmissions).mockResolvedValue([]);
  vi.mocked(loadRecentGrades).mockResolvedValue([]);
  vi.mocked(loadOwnXp).mockResolvedValue({ total_xp: '0' } as never);
});

it('retrieves only the verified student and uses one server time for counts and deadlines', async () => {
  await CourseProgressPage(pageProps);
  expect(requireMember).toHaveBeenCalledOnce();
  expect(loadAssignmentProgress).toHaveBeenCalledWith(
    verified.supabase,
    verified.user.id,
    courseId,
    expect.any(String),
  );
  expect(loadUpcomingAssignments).toHaveBeenCalledWith(
    verified.supabase,
    verified.user.id,
    courseId,
    expect.any(String),
  );
});

it('denies an unselected course and skips XP when that feature is disabled', async () => {
  vi.mocked(readCourseAccess).mockResolvedValue(null as never);
  await expect(CourseProgressPage(pageProps)).rejects.toThrow('NEXT_NOT_FOUND');
});
