/* eslint-disable max-lines-per-function */
// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { requireMember } from '@/lib/auth/verified-user';
import {
  hasStudentAiReviewAccess,
  hasStudentAssessmentAccess,
} from '@/features/student-submissions/course-access.server';
import CourseSubmissionPage from './page';

vi.mock('@/lib/auth/verified-user', () => ({ requireMember: vi.fn() }));
vi.mock('@/features/student-submissions/course-access.server', () => ({
  hasStudentAiReviewAccess: vi.fn(),
  hasStudentAssessmentAccess: vi.fn(),
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
  vi.mocked(hasStudentAssessmentAccess).mockResolvedValue(true);
  vi.mocked(hasStudentAiReviewAccess).mockResolvedValue(true);
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
