import { beforeEach, expect, it, vi } from 'vitest';
import { requireMember } from '@/lib/auth/verified-user';
import {
  courseIdForStudentSubmission,
  hasStudentAssessmentAccess,
} from '@/features/student-submissions/course-access.server';
import { loadRevisionComparison } from '@/features/student-submissions/revision-comparison.server';
import CompareRevisionsPage from './page';

const studentId = 'verified-student';

vi.mock('@/lib/auth/verified-user', () => ({ requireMember: vi.fn() }));
vi.mock('@/features/student-submissions/course-access.server', () => ({
  courseIdForStudentSubmission: vi.fn(),
  hasStudentAssessmentAccess: vi.fn(),
}));
vi.mock('@/features/student-submissions/revision-comparison.server', () => ({
  loadRevisionComparison: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('not-found');
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireMember).mockResolvedValue({
    supabase: {},
    user: { id: studentId },
  } as never);
  vi.mocked(courseIdForStudentSubmission).mockResolvedValue('course-a');
  vi.mocked(hasStudentAssessmentAccess).mockResolvedValue(true);
  vi.mocked(loadRevisionComparison).mockResolvedValue(null);
});

it('uses verified identity and validated revision numbers rather than URL identity', async () => {
  await expect(
    CompareRevisionsPage({
      params: Promise.resolve({ submissionId: 'anchor-id' }),
      searchParams: Promise.resolve({
        before: '2',
        after: '1',
        student_id: 'peer',
        courseId: 'course-a',
      }),
    }),
  ).rejects.toThrow('not-found');
  expect(requireMember).toHaveBeenCalled();
  expect(courseIdForStudentSubmission).toHaveBeenCalledWith(
    {},
    studentId,
    'anchor-id',
  );
  expect(hasStudentAssessmentAccess).toHaveBeenCalledWith(
    {},
    studentId,
    'course-a',
  );
  expect(loadRevisionComparison).toHaveBeenCalledWith(
    {},
    'verified-student',
    'anchor-id',
    { before: 2, after: 1 },
  );
});

it('rejects duplicate parameters before any comparison read', async () => {
  await expect(
    CompareRevisionsPage({
      params: Promise.resolve({ submissionId: 'anchor-id' }),
      searchParams: Promise.resolve({ before: ['1', '2'] }),
    }),
  ).rejects.toThrow('not-found');
  expect(loadRevisionComparison).not.toHaveBeenCalled();
});
