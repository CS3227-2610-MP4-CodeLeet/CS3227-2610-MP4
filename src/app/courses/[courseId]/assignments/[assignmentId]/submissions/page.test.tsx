import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  member: vi.fn(),
  access: vi.fn(),
}));

vi.mock('@/lib/auth/verified-user', () => ({ requireMember: mocks.member }));
vi.mock('@/lib/courses/access', () => ({ readCourseAccess: mocks.access }));
vi.mock('@/components/layout/breadcrumb-context', () => ({
  BreadcrumbSetter: () => null,
}));
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));

import AssignmentSubmissionsPage from './page';

const courseId = 'c9300000-0000-4000-8000-000000000001';
const assignmentId = 'a9300000-0000-4000-8000-000000000001';

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
              title: 'Assignment with no work',
              due_at: null,
            },
            error: null,
          })
        : query({ data: [], error: null }),
    ),
  };
  mocks.member.mockResolvedValue({ user: { id: 'teacher-1' }, supabase });
  mocks.access.mockResolvedValue({
    role: 'instructor',
    lifecycle: 'active',
    featureEnabled: true,
  });
});

describe('assignment submission history', () => {
  it('illustrates an empty instructor history while keeping course navigation', async () => {
    const page = await AssignmentSubmissionsPage({
      params: Promise.resolve({ courseId, assignmentId }),
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain('No submissions yet.');
    expect(html).toContain('data-illustration="code"');
    expect(html).toContain(`/courses/${courseId}/assignments`);
  });
});
