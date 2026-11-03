import { beforeEach, expect, it, vi } from 'vitest';
import MyGradesPage from './page';
import { requireMember } from '@/lib/auth/verified-user';
import { readCourseAccess } from '@/lib/courses/access';
import { loadStudentGrades } from '@/features/student-grades/grades.server';

vi.mock('@/lib/auth/verified-user', () => ({ requireMember: vi.fn() }));
vi.mock('@/lib/courses/access', () => ({ readCourseAccess: vi.fn() }));
vi.mock('@/features/student-grades/grades.server', () => ({
  loadStudentGrades: vi.fn(),
}));

const studentId = 'verified-student';
const courseId = 'course-a';
const verified = {
  supabase: {},
  user: { id: studentId },
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireMember).mockResolvedValue(verified as never);
  vi.mocked(readCourseAccess).mockResolvedValue({
    role: 'student',
    lifecycle: 'active',
    featureEnabled: true,
  } as never);
  vi.mocked(loadStudentGrades).mockResolvedValue({ rows: [], hasNext: false });
});

it('requires course membership and scopes published grades to that course', async () => {
  await MyGradesPage({
    searchParams: Promise.resolve({
      courseId,
      student_id: 'another-student',
      q: ' Loops ',
      language: 'java',
      page: '2',
    }),
  });
  expect(readCourseAccess).toHaveBeenCalledWith(
    verified.supabase,
    studentId,
    courseId,
    'assessments',
  );
  expect(loadStudentGrades).toHaveBeenCalledWith(verified.supabase, {
    studentId,
    courseId,
    page: 2,
    filters: { q: 'Loops', language: 'java' },
  });
});

it('fails closed when no course context is selected', async () => {
  await expect(
    MyGradesPage({ searchParams: Promise.resolve({}) }),
  ).rejects.toThrow();
  expect(readCourseAccess).not.toHaveBeenCalled();
  expect(loadStudentGrades).not.toHaveBeenCalled();
});
