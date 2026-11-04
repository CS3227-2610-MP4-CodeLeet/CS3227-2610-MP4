import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  member: vi.fn(),
  access: vi.fn(),
  aiAccess: vi.fn(),
}));
vi.mock('@/lib/auth/verified-user', () => ({ requireMember: mocks.member }));
vi.mock('@/lib/courses/access', () => ({ readCourseAccess: mocks.access }));
vi.mock('@/features/student-submissions/course-access.server', () => ({
  hasInstructorAiReviewAccess: mocks.aiAccess,
}));
vi.mock('@/features/assignment-deadlines/components', () => ({
  SubmissionTimingDetails: () => null,
}));
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));

import InstructorSubmissionPage from './page';

beforeEach(() => {
  vi.clearAllMocks();
  const results: Record<string, unknown> = {
    submissions: {
      data: {
        id: 'submission-1',
        assignment_id: 'assignment-1',
        source: 'print(1)',
        language: 'python',
        revision: 1,
        created_at: '2026-11-01T00:00:00Z',
        is_late: false,
        due_at_submission: null,
      },
    },
    assignments: {
      data: { id: 'assignment-1', course_id: 'course-1', title: 'Loops' },
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
        published_at: '2026-11-02T00:00:00Z',
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
  mocks.member.mockResolvedValue({
    supabase: client,
    user: { id: 'instructor-1' },
  });
  mocks.access.mockResolvedValue({
    role: 'instructor',
    lifecycle: 'archived',
    featureEnabled: true,
  });
  mocks.aiAccess.mockResolvedValue(false);
});

it('shows saved archived grades read-only without grading controls', async () => {
  const page = await InstructorSubmissionPage({
    params: Promise.resolve({ submissionId: 'submission-1' }),
    searchParams: Promise.resolve({ courseId: 'course-1' }),
  });
  const html = renderToStaticMarkup(page);

  expect(html).toContain('Saved grade');
  expect(html).toContain('Correctness');
  expect(html).toContain('8');
  expect(html).toContain('Clear solution');
  expect(html).toContain('Published');
  expect(html).not.toContain('<form');
  expect(html).not.toContain('Save and publish');
});
