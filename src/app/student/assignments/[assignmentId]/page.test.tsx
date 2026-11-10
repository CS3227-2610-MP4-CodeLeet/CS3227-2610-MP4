import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  member: vi.fn(),
  access: vi.fn(),
}));

vi.mock('@/lib/auth/verified-user', () => ({ requireMember: mocks.member }));
vi.mock('@/lib/courses/access', () => ({ readCourseAccess: mocks.access }));
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));
vi.mock('@/features/codementor/submission-form', () => ({
  SubmissionForm: () => <div>Submission editor</div>,
}));

import StudentAssignmentDetailPage from './page';

const courseId = 'e9300000-0000-4000-8000-000000000001';
const assignmentId = 'e9300000-0000-4000-8000-000000000002';

function query(result: unknown) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    order: vi.fn(() => builder),
    maybeSingle: vi.fn(async () => result),
    then: (
      resolve: (value: unknown) => unknown,
      reject: (reason: unknown) => unknown,
    ) => Promise.resolve(result).then(resolve, reject),
  };
  return builder;
}

beforeEach(() => {
  const supabase = {
    from: vi.fn((table: string) =>
      table === 'assignments'
        ? query({
            data: {
              id: assignmentId,
              course_id: courseId,
              title: 'Legacy assignment route',
              instructions: 'Write code',
              language: 'java',
              publication_status: 'published',
              due_at: null,
              max_xp: 0,
            },
            error: null,
          })
        : query({ data: [], error: null }),
    ),
  };
  mocks.member.mockResolvedValue({ user: { id: 'student-1' }, supabase });
  mocks.access.mockResolvedValue({
    role: 'student',
    lifecycle: 'active',
    featureEnabled: true,
  });
});

describe('legacy student assignment revision history', () => {
  it('illustrates an empty history and keeps the assignment editor', async () => {
    const page = await StudentAssignmentDetailPage({
      params: Promise.resolve({ assignmentId }),
      searchParams: Promise.resolve({ courseId }),
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain('No submissions yet.');
    expect(html).toContain('data-illustration="code"');
    expect(html).toContain('Submission editor');
  });
});
