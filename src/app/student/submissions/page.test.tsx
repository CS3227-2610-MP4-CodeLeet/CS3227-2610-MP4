import { beforeEach, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import MySubmissionsPage from './page';
import SubmissionsLoading from './loading';
import { requireRole } from '@/lib/auth/verified-user';
import { loadSubmissionHistory } from '@/features/student-submissions/history.server';

vi.mock('@/lib/auth/verified-user', () => ({ requireRole: vi.fn() }));
vi.mock('@/features/student-submissions/history.server', () => ({
  loadSubmissionHistory: vi.fn(),
}));
const verified = {
  supabase: {},
  user: { id: 'verified-student' },
  role: 'student',
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireRole).mockResolvedValue(verified as never);
});

it('ignores requested identity and renders a safe retry state when data fails', async () => {
  vi.mocked(loadSubmissionHistory).mockResolvedValue(null);
  const view = await MySubmissionsPage({
    searchParams: Promise.resolve({ student_id: 'another-student', page: '2' }),
  });
  expect(requireRole).toHaveBeenCalledWith('student');
  expect(loadSubmissionHistory).toHaveBeenCalledWith(
    verified.supabase,
    'verified-student',
    2,
  );
  const html = renderToStaticMarkup(view);
  expect(html).toContain('Submissions could not be loaded');
  expect(html).toContain('Try again');
  expect(html).not.toContain('another-student');
});

it('provides empty history and an accessible streaming loading state', async () => {
  vi.mocked(loadSubmissionHistory).mockResolvedValue({
    rows: [],
    hasNext: false,
  });
  const view = await MySubmissionsPage({ searchParams: Promise.resolve({}) });
  expect(renderToStaticMarkup(view)).toContain('No submissions yet');
  expect(renderToStaticMarkup(<SubmissionsLoading />)).toContain(
    'aria-label="Loading submissions"',
  );
});
