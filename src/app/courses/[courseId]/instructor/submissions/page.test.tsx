/* eslint-disable max-lines-per-function, sonarjs/no-duplicate-string */
// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { requireMember } from '@/lib/auth/verified-user';
import { readCourseAccess } from '@/lib/courses/access';
import InstructorSubmissionsDashboardPage from './page';

vi.mock('@/lib/auth/verified-user', () => ({ requireMember: vi.fn() }));
vi.mock('@/lib/courses/access', () => ({ readCourseAccess: vi.fn() }));
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('not-found');
  },
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('@/components/layout/breadcrumb-context', () => ({
  BreadcrumbSetter: () => null,
}));

const instructorId = '00000000-0000-4000-8000-000000000099';
const courseId = '00000000-0000-4000-8000-000000000001';
const student1Id = '00000000-0000-4000-8000-000000000010';
const student2Id = '00000000-0000-4000-8000-000000000020';
const assign1Id = '00000000-0000-4000-8000-000000000100';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(readCourseAccess).mockResolvedValue({
    role: 'instructor',
    featureEnabled: true,
    lifecycle: 'active',
  } as never);
});

afterEach(() => {
  cleanup();
});

it('rejects access for non-instructors', async () => {
  vi.mocked(readCourseAccess).mockResolvedValue({
    role: 'student',
    featureEnabled: true,
    lifecycle: 'active',
  } as never);
  vi.mocked(requireMember).mockResolvedValue({
    supabase: {},
    user: { id: student1Id },
  } as never);

  await expect(
    InstructorSubmissionsDashboardPage({
      params: Promise.resolve({ courseId }),
      searchParams: Promise.resolve({}),
    }),
  ).rejects.toThrow('not-found');
});

it('renders student display names, assignment titles, and grade status badges', async () => {
  const mockSupabase = {
    rpc: vi.fn().mockImplementation((fn) => {
      if (fn === 'list_course_members') {
        return Promise.resolve({
          data: [
            {
              user_id: student1Id,
              email: 'alice@example.com',
              display_name: 'Alice Smith',
              role: 'student',
            },
            {
              user_id: student2Id,
              email: 'bob@example.com',
              display_name: 'Bob Jones',
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
                    id: assign1Id,
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
                    student_id: student1Id,
                    assignment_id: assign1Id,
                    revision: 2,
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
                  {
                    id: 'sub-2',
                    student_id: student2Id,
                    assignment_id: assign1Id,
                    revision: 1,
                    created_at: new Date().toISOString(),
                    is_late: true,
                    due_at_submission: null,
                    grades: [],
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

  const element = await InstructorSubmissionsDashboardPage({
    params: Promise.resolve({ courseId }),
    searchParams: Promise.resolve({}),
  });

  render(element);

  // Student names resolved from list_course_members
  expect(screen.getByText('Alice Smith')).toBeDefined();
  expect(screen.getByText('Bob Jones')).toBeDefined();

  // Assignment title
  expect(screen.getAllByText('Palindrome Number').length).toBeGreaterThan(0);

  // Revisions
  expect(screen.getByText('Revision 2')).toBeDefined();
  expect(screen.getByText('Revision 1')).toBeDefined();

  // Grade status
  expect(screen.getByText(/Graded: 15 \/ 15/)).toBeDefined();
  expect(screen.getByText(/Needs review/)).toBeDefined();

  // Review link
  const reviewLinks = screen.getAllByRole('link', { name: /Review/i });
  expect(reviewLinks.length).toBe(2);
  expect(reviewLinks[0].getAttribute('href')).toBe(
    `/courses/${courseId}/instructor/submissions/sub-1`,
  );
});

it('filters to latest revisions by default and shows all when viewAll=true', async () => {
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
    user: { id: instructorId },
  } as never);

  // Default: viewAll is not set, only Revision 2 is rendered
  const defaultElement = await InstructorSubmissionsDashboardPage({
    params: Promise.resolve({ courseId }),
    searchParams: Promise.resolve({}),
  });
  const { unmount } = render(defaultElement);
  expect(screen.getByText('Revision 2')).toBeDefined();
  expect(screen.queryByText('Revision 1')).toBeNull();
  unmount();

  // With viewAll='true': both Revision 2 and Revision 1 are rendered
  const allElement = await InstructorSubmissionsDashboardPage({
    params: Promise.resolve({ courseId }),
    searchParams: Promise.resolve({ viewAll: 'true' }),
  });
  render(allElement);
  expect(screen.getByText('Revision 2')).toBeDefined();
  expect(screen.getByText('Revision 1')).toBeDefined();
});

it('falls back to all course assignments when assignmentId is invalid or out of scope', async () => {
  const inMock = vi.fn().mockReturnValue({
    order: vi.fn().mockResolvedValue({
      data: [],
      error: null,
    }),
  });

  const mockSupabase = {
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
    from: vi.fn().mockImplementation((table) => {
      if (table === 'assignments') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [
                  { id: assign1Id, title: 'Palindrome Number', max_xp: 15 },
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
            in: inMock,
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

  const element = await InstructorSubmissionsDashboardPage({
    params: Promise.resolve({ courseId }),
    searchParams: Promise.resolve({ assignmentId: 'invalid-or-foreign-id' }),
  });
  render(element);

  // targetAssignmentIds should fall back to assign1Id of the current course
  expect(inMock).toHaveBeenCalledWith('assignment_id', [assign1Id]);
});
