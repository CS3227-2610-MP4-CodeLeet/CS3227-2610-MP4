import { beforeEach, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import MySubmissionsPage from './page';
import SubmissionsLoading from './loading';
import { requireMember } from '@/lib/auth/verified-user';
import { readCourseAccess } from '@/lib/courses/access';
import { loadSubmissionHistory } from '@/features/student-submissions/history.server';
const verifiedStudentId = 'verified-student';

vi.mock('@/lib/auth/verified-user', () => ({ requireMember: vi.fn() }));
vi.mock('@/lib/courses/access', () => ({ readCourseAccess: vi.fn() }));
vi.mock('@/features/student-submissions/history.server', () => ({
  loadSubmissionHistory: vi.fn(),
}));
const verified = {
  supabase: {},
  user: { id: verifiedStudentId },
  role: 'student',
};
const courseAccess = {
  role: 'student',
  lifecycle: 'active',
  featureEnabled: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireMember).mockResolvedValue(verified as never);
  vi.mocked(readCourseAccess).mockResolvedValue(courseAccess as never);
});

it('ignores requested identity and renders a safe retry state when data fails', async () => {
  vi.mocked(loadSubmissionHistory).mockResolvedValue(null);
  const view = await MySubmissionsPage({
    searchParams: Promise.resolve({
      student_id: 'another-student',
      courseId: 'course-a',
      page: '2',
    }),
  });
  expect(requireMember).toHaveBeenCalled();
  expect(readCourseAccess).toHaveBeenCalledWith(
    verified.supabase,
    verifiedStudentId,
    'course-a',
    'assessments',
  );
  expect(loadSubmissionHistory).toHaveBeenCalledWith(verified.supabase, {
    studentId: verifiedStudentId,
    courseId: 'course-a',
    page: 2,
    filters: { q: '', language: '' },
  });
  const html = renderToStaticMarkup(view);
  expect(html).toContain('Submissions could not be loaded');
  expect(html).toContain('Try again');
  expect(html).not.toContain('another-student');
});

it('requires an explicit course context before loading submission history', async () => {
  await expect(
    MySubmissionsPage({ searchParams: Promise.resolve({}) }),
  ).rejects.toThrow();
  expect(readCourseAccess).not.toHaveBeenCalled();
  expect(loadSubmissionHistory).not.toHaveBeenCalled();
});

it('provides empty history and an accessible streaming loading state', async () => {
  vi.mocked(loadSubmissionHistory).mockResolvedValue({
    rows: [],
    hasNext: false,
  });
  const view = await MySubmissionsPage({
    searchParams: Promise.resolve({ courseId: 'course-a' }),
  });
  expect(renderToStaticMarkup(view)).toContain('No submissions yet');
  expect(renderToStaticMarkup(<SubmissionsLoading />)).toContain(
    'aria-label="Loading submissions"',
  );
});

it('forwards validated filters with verified identity rather than URL identity', async () => {
  vi.mocked(loadSubmissionHistory).mockResolvedValue({
    rows: [],
    hasNext: false,
  });
  const view = await MySubmissionsPage({
    searchParams: Promise.resolve({
      q: '  Loops  ',
      language: 'java',
      page: '2',
      student_id: 'peer',
      courseId: 'course-a',
    }),
  });
  expect(loadSubmissionHistory).toHaveBeenCalledWith(verified.supabase, {
    studentId: verifiedStudentId,
    courseId: 'course-a',
    page: 2,
    filters: { q: 'Loops', language: 'java' },
  });
  const html = renderToStaticMarkup(view);
  expect(html).toContain('No matches on this page');
  expect(html).not.toContain('peer');
});
