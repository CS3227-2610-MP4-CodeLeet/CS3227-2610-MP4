// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
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
vi.mock('@/features/codementor/submission-form', () => ({
  SubmissionForm: () => <div>Submission editor</div>,
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

function query(result: unknown) {
  let isFilteredToPublished = false;
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn((col?: string, val?: string) => {
      if (col === 'publication_status' && val === 'published') {
        isFilteredToPublished = true;
      }
      return builder;
    }),
    order: vi.fn(() => builder),
    maybeSingle: vi.fn(async () => {
      const res = result as {
        data: { publication_status?: string } | null;
        error: unknown;
      };
      if (
        isFilteredToPublished &&
        res?.data?.publication_status !== 'published'
      ) {
        return { data: null, error: null };
      }
      return result;
    }),
    then: (
      resolve: (value: unknown) => unknown,
      reject: (reason: unknown) => unknown,
    ) => Promise.resolve(result).then(resolve, reject),
  };
  return builder;
}

beforeEach(() => {
  vi.clearAllMocks();
});

function createPreviewSupabase() {
  return {
    from: vi.fn((table: string) => {
      if (table === 'assignments') {
        return query({
          data: {
            id: testAssignmentId,
            course_id: testCourseId,
            title: 'Draft Matrix Multiplication',
            instructions: 'Implement matrix multiplication',
            language: 'python',
            publication_status: 'draft',
            due_at: null,
            max_xp: 50,
          },
          error: null,
        });
      }
      return query({ data: [], error: null });
    }),
  };
}

function createStudentSupabase() {
  return {
    from: vi.fn((table: string) =>
      table === 'assignments'
        ? query({
            data: {
              id: testAssignmentId,
              course_id: testCourseId,
              title: 'Published assignment',
              instructions: 'Write code',
              language: 'python',
              publication_status: 'published',
              due_at: null,
              max_xp: 10,
            },
            error: null,
          })
        : query({ data: [], error: null }),
    ),
  };
}

describe('CourseAssignmentDetailPage - Instructor Preview', () => {
  it('renders preview banner, practice runner, and disables submissions for instructors', async () => {
    const supabase = createPreviewSupabase();

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
    expect(
      screen.getByText(/Submissions.*disabled in preview mode/i),
    ).toBeTruthy();
    expect(screen.queryByText(/Your revisions/i)).toBeNull();
  });

  it('rejects student when assignment is draft', async () => {
    const supabase = createPreviewSupabase();

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

describe('CourseAssignmentDetailPage - student history', () => {
  it('illustrates an empty revision history without removing the editor', async () => {
    mocks.member.mockResolvedValue({
      user: { id: 'student-1' },
      supabase: createStudentSupabase(),
    });
    mocks.access.mockResolvedValue({
      role: 'student',
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
    const html = renderToStaticMarkup(page);

    expect(html).toContain('No submissions yet.');
    expect(html).toContain('data-illustration="code"');
    expect(html).toContain('Submission editor');
  });
});
