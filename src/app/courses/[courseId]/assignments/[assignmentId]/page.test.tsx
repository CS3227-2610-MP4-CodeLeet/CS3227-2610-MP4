// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  member: vi.fn(),
  access: vi.fn(),
}));

vi.mock('@/lib/auth/verified-user', () => ({
  requireMember: mocks.member,
}));
vi.mock('@/lib/courses/access', () => ({ readCourseAccess: mocks.access }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));
vi.mock('@/components/layout/breadcrumb-context', () => ({
  BreadcrumbSetter: () => null,
}));
vi.mock('@/features/student-submissions/assignment-practice', () => ({
  AssignmentPractice: () => <div data-testid="practice-runner" />,
}));
vi.mock('@/features/student-submissions/code-editor', () => ({
  CodeEditor: () => <div data-testid="code-editor" />,
}));

import CourseAssignmentDetailPage from './page';

const testCourseId = '00000000-0000-4000-8000-000000000001';
const testAssignmentId = '00000000-0000-4000-8000-000000000002';

function createMockSupabase(assignments: Array<{
  id: string;
  course_id: string;
  title: string;
  instructions: string;
  language: string;
  publication_status: string;
  due_at: string | null;
  max_xp: number;
}>) {
  return {
    from: vi.fn((table: string) => {
      const filters: Record<string, string> = {};
      const builder = {
        select: vi.fn(() => builder),
        eq: vi.fn((col: string, val: string) => {
          filters[col] = val;
          return builder;
        }),
        order: vi.fn(() => builder),
        maybeSingle: vi.fn(async () => {
          if (table === 'assignments') {
            const match = assignments.find((a) => {
              if (filters.id && a.id !== filters.id) return false;
              if (filters.course_id && a.course_id !== filters.course_id) return false;
              if (filters.publication_status && a.publication_status !== filters.publication_status) return false;
              return true;
            });
            return { data: match ?? null, error: null };
          }
          return { data: null, error: null };
        }),
        then: (
          resolve: (value: unknown) => unknown,
          reject: (reason: unknown) => unknown,
        ) => Promise.resolve({ data: [], error: null }).then(resolve, reject),
      };
      return builder;
    }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('CourseAssignmentDetailPage - Instructor Preview', () => {
  it('renders preview banner, practice runner, and disables submissions for instructors', async () => {
    const supabase = createMockSupabase([
      {
        id: testAssignmentId,
        course_id: testCourseId,
        title: 'Draft Matrix Multiplication',
        instructions: 'Implement matrix multiplication',
        language: 'python',
        publication_status: 'draft',
        due_at: null,
        max_xp: 50,
      },
    ]);

    mocks.member.mockResolvedValue({
      user: { id: 'instructor-1' },
      supabase,
    });
    mocks.access.mockResolvedValue({
      role: 'instructor',
      lifecycle: 'active',
      featureEnabled: true,
    });

    const page = await CourseAssignmentDetailPage({
      params: Promise.resolve({
        courseId: testCourseId,
        assignmentId: testAssignmentId,
      }),
      searchParams: Promise.resolve({}),
    });

    render(page);

    expect(screen.getByText('Preview Mode (Instructor)')).toBeTruthy();
    expect(screen.getByText('Submissions disabled in preview mode')).toBeTruthy();
    expect(screen.queryByText(/Your revisions/i)).toBeNull();
  });

  it('rejects student when assignment is draft', async () => {
    const supabase = createMockSupabase([
      {
        id: testAssignmentId,
        course_id: testCourseId,
        title: 'Draft Matrix Multiplication',
        instructions: 'Implement matrix multiplication',
        language: 'python',
        publication_status: 'draft',
        due_at: null,
        max_xp: 50,
      },
    ]);

    mocks.member.mockResolvedValue({
      user: { id: 'student-1' },
      supabase,
    });
    mocks.access.mockResolvedValue({
      role: 'student',
      lifecycle: 'active',
      featureEnabled: true,
    });

    await expect(
      CourseAssignmentDetailPage({
        params: Promise.resolve({
          courseId: testCourseId,
          assignmentId: testAssignmentId,
        }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow('NEXT_NOT_FOUND');
  });
});
