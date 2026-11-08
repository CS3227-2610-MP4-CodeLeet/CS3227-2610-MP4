/* eslint-disable max-lines-per-function */
// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { requireMember } from '@/lib/auth/verified-user';
import {
  hasInstructorAiReviewAccess,
  hasStudentAiReviewAccess,
  hasStudentAssessmentAccess,
} from '@/features/student-submissions/course-access.server';
import { readCourseAccess } from '@/lib/courses/access';
import CourseSubmissionPage from './page';

vi.mock('@/lib/auth/verified-user', () => ({ requireMember: vi.fn() }));
vi.mock('@/lib/courses/access', () => ({ readCourseAccess: vi.fn() }));
vi.mock('@/features/student-submissions/course-access.server', () => ({
  hasInstructorAiReviewAccess: vi.fn(),
  hasStudentAiReviewAccess: vi.fn(),
  hasStudentAssessmentAccess: vi.fn(),
}));
vi.mock('@/features/practice-test-authoring/queries.server', () => ({
  loadOwnerCases: vi.fn().mockResolvedValue(null),
}));
vi.mock('@/features/student-submissions/runner-environment', () => ({
  resolveBrowserRunnerOrigin: () => 'http://127.0.0.1:3130',
}));
vi.mock('@/features/student-submissions/practice-runner', () => ({
  PracticeRunner: () => <div data-testid="practice-runner" />,
}));
vi.mock('@/features/codementor/grade-form', () => ({
  GradeForm: () => <div data-testid="grade-form" />,
}));
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('not-found');
  },
}));
vi.mock('@/components/layout/breadcrumb-context', () => ({
  BreadcrumbSetter: () => null,
}));
vi.mock('@/components/ui/pending-link', () => ({
  ButtonLink: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));
vi.mock('@/features/codementor/review-button', () => ({
  ReviewButton: () => <button>Request Review</button>,
}));

const studentId = '00000000-0000-4000-8000-000000000001';
const courseId = '00000000-0000-4000-8000-000000000002';
const submissionId = '00000000-0000-4000-8000-000000000003';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(readCourseAccess).mockResolvedValue({
    role: 'student',
    lifecycle: 'active',
    featureEnabled: true,
  } as never);
  vi.mocked(hasStudentAssessmentAccess).mockResolvedValue(true);
  vi.mocked(hasStudentAiReviewAccess).mockResolvedValue(true);
  vi.mocked(hasInstructorAiReviewAccess).mockResolvedValue(true);
});

afterEach(() => {
  cleanup();
});

it('renders rubric criteria title, description, and score / maxScore breakdown instead of raw UUIDs', async () => {
  const mockSupabase = {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: submissionId,
                assignment_id: 'assign-1',
                course_id: courseId,
                source: 'print("hello")',
                language: 'python',
                revision: 1,
                created_at: new Date().toISOString(),
                is_late: false,
                due_at_submission: null,
                assignments: {
                  title: 'Hello Assignment',
                  publication_status: 'published',
                  language: 'python',
                },
              },
              error: null,
            }),
          }),
        }),
      }),
    }),
    rpc: vi.fn().mockImplementation((name) => {
      if (name === 'get_published_submission_grade') {
        return Promise.resolve({
          data: {
            id: 'grade-1',
            total_score: 8,
            feedback: 'Well done on implementation!',
            published_at: new Date().toISOString(),
            criteria: [
              {
                id: '93000000-0000-4000-8000-000000000026',
                title: 'Correctness',
                description: 'Code produces correct outputs',
                maxScore: 5,
                score: 5,
              },
              {
                id: '93000000-0000-4000-8000-000000000027',
                title: 'Code Style',
                description: 'Clean syntax and naming',
                maxScore: 5,
                score: 3,
              },
            ],
          },
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: null });
    }),
  };

  vi.mocked(requireMember).mockResolvedValue({
    supabase: mockSupabase,
    user: { id: studentId },
  } as never);

  const element = await CourseSubmissionPage({
    params: Promise.resolve({ courseId, submissionId }),
  });

  render(element);

  // Grade totals and feedback
  expect(screen.getByText(/Published grade: 8/i)).toBeDefined();
  expect(screen.getByText('Well done on implementation!')).toBeDefined();

  // Rubric criteria titles and score breakdowns
  expect(screen.getByText('Correctness')).toBeDefined();
  expect(screen.getByText('Code produces correct outputs')).toBeDefined();
  expect(screen.getByText('5 / 5')).toBeDefined();

  expect(screen.getByText('Code Style')).toBeDefined();
  expect(screen.getByText('Clean syntax and naming')).toBeDefined();
  expect(screen.getByText('3 / 5')).toBeDefined();

  // Raw criteria UUIDs should not be displayed
  expect(screen.queryByText(/93000000-0000-4000-8000-000000000026/)).toBeNull();
  expect(screen.queryByText(/93000000-0000-4000-8000-000000000027/)).toBeNull();
});

it('renders instructor review view with grade form and test runner when user is instructor', async () => {
  const instructorId = 'instructor-user-1';
  vi.mocked(readCourseAccess).mockResolvedValue({
    role: 'instructor',
    lifecycle: 'active',
    featureEnabled: true,
  } as never);

  const results: Record<string, unknown> = {
    submissions: {
      data: {
        id: submissionId,
        assignment_id: 'assign-1',
        source: 'def solve(): pass',
        language: 'python',
        revision: 2,
        created_at: new Date().toISOString(),
        is_late: false,
        due_at_submission: null,
      },
    },
    assignments: {
      data: { id: 'assign-1', course_id: courseId, title: 'Loops' },
    },
    assignment_rubrics: {
      data: {
        criteria: [
          {
            id: 'criterion-1',
            title: 'Correctness',
            description: 'Works',
            maxScore: 10,
          },
        ],
      },
    },
    grades: {
      data: {
        id: 'grade-1',
        scores: { 'criterion-1': 8 },
        feedback: 'Clear solution',
        total_score: 8,
        published_at: null,
        version: 1,
      },
    },
  };

  const client = {
    from: vi.fn((table: string) => {
      const builder = {
        select: vi.fn(() => builder),
        eq: vi.fn(() => builder),
        maybeSingle: vi.fn(async () => results[table]),
      };
      return builder;
    }),
  };

  vi.mocked(requireMember).mockResolvedValue({
    supabase: client,
    user: { id: instructorId },
  } as never);

  const element = await CourseSubmissionPage({
    params: Promise.resolve({ courseId, submissionId }),
  });

  render(element);

  expect(screen.getByText('Review submission')).toBeDefined();
  expect(screen.getByText('Loops · revision 2')).toBeDefined();
  expect(screen.getByTestId('grade-form')).toBeDefined();
  expect(screen.getByTestId('practice-runner')).toBeDefined();

  const backLink = screen.getByRole('link', { name: /Back to submissions/i });
  expect(backLink.getAttribute('href')).toBe(
    `/courses/${courseId}/submissions`,
  );
});
