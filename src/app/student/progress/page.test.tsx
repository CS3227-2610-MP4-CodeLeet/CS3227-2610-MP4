import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, it, vi } from 'vitest';
import ProgressPage from './page';
import ProgressLayout from './layout';
import ProgressLoading from './loading';
import ProgressError from './error';
import { requireMember, requireRole } from '@/lib/auth/verified-user';
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
  requireRole: vi.fn(),
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
  useRouter: () => ({ refresh: vi.fn() }),
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));
const courseId = crypto.randomUUID();
const pageProps = { searchParams: Promise.resolve({ courseId }) };
const verified = {
  user: { id: crypto.randomUUID() },
  supabase: {},
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireMember).mockResolvedValue(verified as never);
  vi.mocked(requireRole).mockResolvedValue(verified as never);
  vi.mocked(readCourseAccess).mockResolvedValue({
    role: 'student',
    lifecycle: 'active',
    featureEnabled: true,
  });
  vi.mocked(loadAssignmentProgress).mockResolvedValue({
    total: 0,
    submitted: 0,
    outstanding: 0,
    overdue: 0,
  });
  vi.mocked(loadUpcomingAssignments).mockResolvedValue([]);
  vi.mocked(loadRecentSubmissions).mockResolvedValue([]);
  vi.mocked(loadRecentGrades).mockResolvedValue([]);
  vi.mocked(loadOwnXp).mockResolvedValue({
    total_xp: '42',
    page: 1,
    has_more: false,
    awards: [],
  });
});

it('retrieves only the verified student and uses one server time for counts and deadlines', async () => {
  const html = renderToStaticMarkup(await ProgressPage(pageProps));
  expect(requireMember).toHaveBeenCalledOnce();
  expect(readCourseAccess).toHaveBeenCalledWith(
    verified.supabase,
    verified.user.id,
    courseId,
    'assessments',
  );
  expect(readCourseAccess).toHaveBeenCalledWith(
    verified.supabase,
    verified.user.id,
    courseId,
    'xp',
  );
  const args = vi.mocked(loadAssignmentProgress).mock.calls[0];
  expect(args.slice(0, 3)).toEqual([
    verified.supabase,
    verified.user.id,
    courseId,
  ]);
  expect(loadUpcomingAssignments).toHaveBeenCalledWith(...args);
  expect(loadRecentSubmissions).toHaveBeenCalledWith(
    verified.supabase,
    verified.user.id,
    courseId,
  );
  expect(loadRecentGrades).toHaveBeenCalledWith(
    verified.supabase,
    verified.user.id,
    courseId,
  );
  expect(loadOwnXp).toHaveBeenCalledWith(verified.supabase, courseId, 1);
  expect(html).toContain('42');
  expect(html).toContain(`/student/xp?courseId=${courseId}`);
});

it('starts independent requests together and contains a thrown XP error', async () => {
  let resolveCount!: (value: null) => void;
  vi.mocked(loadAssignmentProgress).mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveCount = resolve;
      }),
  );
  vi.mocked(loadOwnXp).mockRejectedValue(
    new Error('PRIVATE_PROVIDER_SENTINEL'),
  );
  const page = ProgressPage(pageProps);
  await vi.waitFor(() => expect(loadRecentGrades).toHaveBeenCalled());
  resolveCount(null);
  const html = renderToStaticMarkup(await page);
  expect(html).toContain('XP unavailable');
  expect(html).toContain('No submissions yet');
  expect(html).not.toContain('PRIVATE_PROVIDER_SENTINEL');
});

it('denies an unselected course and skips XP when that feature is disabled', async () => {
  await expect(
    ProgressPage({ searchParams: Promise.resolve({}) }),
  ).rejects.toThrow('NEXT_NOT_FOUND');
  vi.mocked(readCourseAccess).mockImplementation(
    async (_client, _user, _id, feature) => ({
      role: 'student',
      lifecycle: 'active',
      featureEnabled: feature === 'assessments',
    }),
  );
  const html = renderToStaticMarkup(await ProgressPage(pageProps));
  expect(loadAssignmentProgress).toHaveBeenCalled();
  expect(loadOwnXp).not.toHaveBeenCalled();
  expect(html).toContain('Submitted assignments');
  expect(html).not.toContain('Total XP');
});

it('authorizes layout and provides accessible loading/error recovery', async () => {
  await ProgressLayout({ children: <p>Progress</p> });
  expect(requireMember).toHaveBeenCalled();
  expect(renderToStaticMarkup(<ProgressLoading />)).toContain('role="status"');
  expect(renderToStaticMarkup(<ProgressError retry={() => {}} />)).toContain(
    'Try again',
  );
});
