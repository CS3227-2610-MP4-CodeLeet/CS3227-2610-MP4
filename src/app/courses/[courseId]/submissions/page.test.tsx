import { beforeEach, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import CourseSubmissionsPage from './page';
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
  const view = await CourseSubmissionsPage({
    params: Promise.resolve({ courseId: 'course-a' }),
    searchParams: Promise.resolve({
      student_id: 'another-student',
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

it('fails closed when student has no access', async () => {
  vi.mocked(readCourseAccess).mockResolvedValue(null as never);
  await expect(
    CourseSubmissionsPage({
      params: Promise.resolve({ courseId: 'course-a' }),
      searchParams: Promise.resolve({}),
    }),
  ).rejects.toThrow();
});
