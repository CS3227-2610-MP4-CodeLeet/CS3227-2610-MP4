import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  member: vi.fn(),
  access: vi.fn(),
  submissions: [] as unknown[],
}));

vi.mock('@/lib/auth/verified-user', () => ({ requireMember: mocks.member }));
vi.mock('@/lib/courses/access', () => ({ readCourseAccess: mocks.access }));
vi.mock('@/features/codementor/context-comparison', () => ({
  ContextComparison: () => null,
}));
vi.mock('@/components/layout/breadcrumb-context', () => ({
  BreadcrumbSetter: () => null,
}));
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));

import ContextComparisonPage from './page';

beforeEach(() => {
  vi.clearAllMocks();
  const selectQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn(async () => ({ data: mocks.submissions, error: null })),
  };
  mocks.member.mockResolvedValue({
    user: { id: 'instructor-1' },
    supabase: {
      from: vi.fn().mockReturnValue(selectQuery),
    },
  });
  mocks.access.mockResolvedValue({
    role: 'instructor',
    lifecycle: 'active',
    featureEnabled: true,
  });
});

describe('instructor Context Comparison page', () => {
  it('illustrates when there are no submissions to compare', async () => {
    mocks.submissions = [];

    const html = renderToStaticMarkup(
      await ContextComparisonPage({
        params: Promise.resolve({ courseId: 'c1' }),
      }),
    );

    expect(html).toContain('Context comparison becomes available');
    expect(html).toContain('data-illustration="code"');
  });

  it('renders assignment title when assignments relation is an object or an array', async () => {
    mocks.submissions = [
      {
        id: 'sub-1',
        assignment_id: 'assign-1',
        revision: 1,
        created_at: '2026-11-01',
        assignments: { title: 'Object Assignment' },
      },
      {
        id: 'sub-2',
        assignment_id: 'assign-2',
        revision: 2,
        created_at: '2026-11-02',
        assignments: [{ title: 'Array Assignment' }],
      },
    ];

    const html = renderToStaticMarkup(
      await ContextComparisonPage({
        params: Promise.resolve({ courseId: 'c1' }),
      }),
    );

    expect(html).toContain('Object Assignment · revision 1');
    expect(html).toContain('Array Assignment · revision 2');
    expect(html).toContain('AI Context Strategy Comparison');
    expect(html).toContain(
      'Context Engineering &amp; Resource-Aware Evaluation',
    );
    expect(html).not.toContain('/instructor');
  });

  it('rejects access when user is not an instructor', async () => {
    mocks.access.mockResolvedValue({
      role: 'student',
      lifecycle: 'active',
      featureEnabled: true,
    });

    await expect(
      ContextComparisonPage({
        params: Promise.resolve({ courseId: 'c1' }),
      }),
    ).rejects.toThrow('NEXT_NOT_FOUND');
  });
});
