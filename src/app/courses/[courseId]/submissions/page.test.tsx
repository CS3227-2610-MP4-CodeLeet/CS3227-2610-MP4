/* eslint-disable max-lines-per-function */
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
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('@/components/layout/breadcrumb-context', () => ({
  BreadcrumbSetter: () => null,
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

it('fails closed when user has no access', async () => {
  vi.mocked(readCourseAccess).mockResolvedValue(null as never);
  await expect(
    CourseSubmissionsPage({
      params: Promise.resolve({ courseId: 'course-a' }),
      searchParams: Promise.resolve({}),
    }),
  ).rejects.toThrow();
});

it('renders instructor dashboard when user is course instructor', async () => {
  const instructorId = 'instructor-1';
  const mockSupabase = {
    rpc: vi.fn().mockImplementation((fn) => {
      if (fn === 'list_course_members') {
        return Promise.resolve({
          data: [
            {
              user_id: 'student-1',
              email: 'alice@example.com',
              display_name: 'Alice Smith',
              role: 'student',
            },
          ],
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: null });
    }),
    from: vi.fn().mockImplementation((table) => {
      if (table === 'assignments') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: 'assign-1',
                    title: 'Palindrome Number',
                    max_xp: 100,
                    assignment_rubrics: [
                      {
                        criteria: [
                          { id: 'c1', title: 'Correctness', maxScore: 15 },
                        ],
                      },
                    ],
                  },
                ],
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'submissions') {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: 'sub-1',
                    student_id: 'student-1',
                    assignment_id: 'assign-1',
                    revision: 1,
                    created_at: new Date().toISOString(),
                    is_late: false,
                    due_at_submission: null,
                    grades: [
                      {
                        id: 'grade-1',
                        total_score: 15,
                        published_at: new Date().toISOString(),
                      },
                    ],
                  },
                ],
                error: null,
              }),
            }),
          }),
        };
      }
      return { select: vi.fn() };
    }),
  };

  vi.mocked(requireMember).mockResolvedValue({
    supabase: mockSupabase,
    user: { id: instructorId },
  } as never);
  vi.mocked(readCourseAccess).mockResolvedValue({
    role: 'instructor',
    lifecycle: 'active',
    featureEnabled: true,
  } as never);

  const view = await CourseSubmissionsPage({
    params: Promise.resolve({ courseId: 'course-a' }),
    searchParams: Promise.resolve({}),
  });

  const html = renderToStaticMarkup(view);
  expect(html).toContain('Alice Smith');
  expect(html).toContain('Palindrome Number');
  expect(html).toContain('/courses/course-a/submissions/sub-1');
  expect(html).not.toContain('/courses/course-a/instructor/submissions');
});

it('illustrates an empty instructor submission queue', async () => {
  const mockSupabase = {
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    }),
  };
  vi.mocked(requireMember).mockResolvedValue({
    supabase: mockSupabase,
    user: { id: 'instructor-1' },
  } as never);
  vi.mocked(readCourseAccess).mockResolvedValue({
    role: 'instructor',
    lifecycle: 'active',
    featureEnabled: true,
  } as never);

  const view = await CourseSubmissionsPage({
    params: Promise.resolve({ courseId: 'course-a' }),
    searchParams: Promise.resolve({}),
  });
  const html = renderToStaticMarkup(view);

  expect(html).toContain('No submissions found for the selected filter.');
  expect(html).toContain('data-illustration="code"');
});

it('filters to latest revisions by default and shows all when viewAll=true for instructors', async () => {
  const student1Id = 'student-1';
  const assign1Id = 'assign-1';
  const mockSupabase = {
    rpc: vi.fn().mockResolvedValue({
      data: [
        {
          user_id: student1Id,
          email: 'alice@example.com',
          display_name: 'Alice',
          role: 'student',
        },
      ],
      error: null,
    }),
    from: vi.fn().mockImplementation((table) => {
      if (table === 'assignments') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [{ id: assign1Id, title: 'Assign 1', max_xp: 10 }],
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'submissions') {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: 'sub-rev-2',
                    student_id: student1Id,
                    assignment_id: assign1Id,
                    revision: 2,
                    created_at: '2026-11-08T12:00:00Z',
                    is_late: false,
                    due_at_submission: null,
                    grades: null,
                  },
                  {
                    id: 'sub-rev-1',
                    student_id: student1Id,
                    assignment_id: assign1Id,
                    revision: 1,
                    created_at: '2026-11-08T11:00:00Z',
                    is_late: false,
                    due_at_submission: null,
                    grades: null,
                  },
                ],
                error: null,
              }),
            }),
          }),
        };
      }
      return { select: vi.fn() };
    }),
  };

  vi.mocked(requireMember).mockResolvedValue({
    supabase: mockSupabase,
    user: { id: 'instructor-1' },
  } as never);
  vi.mocked(readCourseAccess).mockResolvedValue({
    role: 'instructor',
    lifecycle: 'active',
    featureEnabled: true,
  } as never);

  const defaultView = await CourseSubmissionsPage({
    params: Promise.resolve({ courseId: 'course-a' }),
    searchParams: Promise.resolve({}),
  });
  const defaultHtml = renderToStaticMarkup(defaultView);
  expect(defaultHtml).toContain('Revision 2');
  expect(defaultHtml).not.toContain('Revision 1');

  const allView = await CourseSubmissionsPage({
    params: Promise.resolve({ courseId: 'course-a' }),
    searchParams: Promise.resolve({ viewAll: 'true' }),
  });
  const allHtml = renderToStaticMarkup(allView);
  expect(allHtml).toContain('Revision 2');
  expect(allHtml).toContain('Revision 1');
});
