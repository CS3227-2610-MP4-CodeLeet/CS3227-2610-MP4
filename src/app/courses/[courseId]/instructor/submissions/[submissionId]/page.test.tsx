import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  member: vi.fn(),
  access: vi.fn(),
  aiAccess: vi.fn(),
  ownerCases: vi.fn(),
}));
vi.mock('@/lib/auth/verified-user', () => ({ requireMember: mocks.member }));
vi.mock('@/lib/courses/access', () => ({ readCourseAccess: mocks.access }));
vi.mock('@/features/student-submissions/course-access.server', () => ({
  hasInstructorAiReviewAccess: mocks.aiAccess,
}));
vi.mock('@/features/practice-test-authoring/queries.server', () => ({
  loadOwnerCases: mocks.ownerCases,
}));
vi.mock('@/features/student-submissions/runner-environment', () => ({
  resolveBrowserRunnerOrigin: () => 'http://127.0.0.1:3130',
}));
vi.mock('@/features/assignment-deadlines/components', () => ({
  SubmissionTimingDetails: () => null,
}));
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));

import CourseInstructorSubmissionPage from './page';

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
  mocks.ownerCases.mockResolvedValue(null);
});

it('shows saved archived grades read-only without grading controls', async () => {
  const page = await CourseInstructorSubmissionPage({
    params: Promise.resolve({
      courseId: 'course-1',
      submissionId: 'submission-1',
    }),
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

it('loads and passes authored test cases to practice runner', async () => {
  mocks.ownerCases.mockResolvedValue({
    assignment_id: 'assignment-1',
    title: 'Loops',
    language: 'python',
    version: 1,
    cases: [
      {
        id: 'case-1',
        name: 'Loop Over Positive Integers',
        stdin: '5\n',
        expected_stdout: '1 2 3 4 5\n',
        is_public: true,
      },
      {
        id: 'case-2',
        name: 'Hidden Edge Case',
        stdin: '0\n',
        expected_stdout: '\n',
        is_public: false,
      },
    ],
  });

  const page = await CourseInstructorSubmissionPage({
    params: Promise.resolve({
      courseId: 'course-1',
      submissionId: 'submission-1',
    }),
  });
  const html = renderToStaticMarkup(page);

  expect(mocks.ownerCases).toHaveBeenCalled();
  expect(html).toContain('Loop Over Positive Integers');
  expect(html).toContain('Hidden Edge Case');
});
