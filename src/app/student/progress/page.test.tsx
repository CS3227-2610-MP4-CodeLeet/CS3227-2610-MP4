import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, it, vi } from 'vitest';
import ProgressPage from './page';
import ProgressLayout from './layout';
import ProgressLoading from './loading';
import ProgressError from './error';
import { requireRole } from '@/lib/auth/verified-user';
import {
  loadAssignmentProgress,
  loadUpcomingAssignments,
} from '@/features/student-progress/assignments.server';
import {
  loadRecentGrades,
  loadRecentSubmissions,
} from '@/features/student-progress/activity.server';
import { loadOwnXp } from '@/features/assignment-xp/queries.server';

vi.mock('@/lib/auth/verified-user', () => ({ requireRole: vi.fn() }));
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
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
const verified = {
  user: { id: crypto.randomUUID() },
  supabase: {},
  role: 'student',
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireRole).mockResolvedValue(verified as never);
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
  const html = renderToStaticMarkup(await ProgressPage());
  expect(requireRole).toHaveBeenCalledWith('student');
  const args = vi.mocked(loadAssignmentProgress).mock.calls[0];
  expect(args.slice(0, 2)).toEqual([verified.supabase, verified.user.id]);
  expect(loadUpcomingAssignments).toHaveBeenCalledWith(...args);
  expect(loadRecentSubmissions).toHaveBeenCalledWith(
    verified.supabase,
    verified.user.id,
  );
  expect(loadRecentGrades).toHaveBeenCalledWith(
    verified.supabase,
    verified.user.id,
  );
  expect(loadOwnXp).toHaveBeenCalledWith(verified.supabase, 1);
  expect(html).toContain('42');
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
  const page = ProgressPage();
  await vi.waitFor(() => expect(loadRecentGrades).toHaveBeenCalled());
  resolveCount(null);
  const html = renderToStaticMarkup(await page);
  expect(html).toContain('XP unavailable');
  expect(html).toContain('No submissions yet');
  expect(html).not.toContain('PRIVATE_PROVIDER_SENTINEL');
});

it('authorizes layout and provides accessible loading/error recovery', async () => {
  await ProgressLayout({ children: <p>Progress</p> });
  expect(requireRole).toHaveBeenCalledWith('student');
  expect(renderToStaticMarkup(<ProgressLoading />)).toContain('role="status"');
  expect(renderToStaticMarkup(<ProgressError retry={() => {}} />)).toContain(
    'Try again',
  );
});
