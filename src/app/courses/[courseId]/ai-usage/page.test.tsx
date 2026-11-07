import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  userRole: vi.fn(),
  access: vi.fn(),
  usage: [] as unknown[],
}));

vi.mock('@/lib/auth/verified-user', () => ({
  getVerifiedUserRole: mocks.userRole,
}));
vi.mock('@/lib/courses/access', () => ({
  readCourseAccess: mocks.access,
}));
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));

import CourseAIUsagePage from './page';

const courseId = '00000000-0000-4000-8000-000000000050';

beforeEach(() => {
  vi.clearAllMocks();
  const selectQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn(async () => ({ data: mocks.usage, error: null })),
  };
  mocks.userRole.mockResolvedValue({
    user: { id: 'student-1' },
    role: 'student',
    supabase: {
      from: vi.fn().mockReturnValue(selectQuery),
    },
  });
  mocks.access.mockResolvedValue({
    role: 'student',
    lifecycle: 'active',
    featureEnabled: true,
  });
});

describe('CourseAIUsagePage', () => {
  it('renders usage statistics and table for course member', async () => {
    mocks.usage = [
      {
        review_type: 'automated',
        status: 'succeeded',
        error_category: null,
        latency_ms: 320,
        input_tokens: 100,
        output_tokens: 50,
        token_source: 'live',
        cache_hit: true,
        created_at: new Date().toISOString(),
      },
    ];

    const element = await CourseAIUsagePage({
      params: Promise.resolve({ courseId }),
    });
    const html = renderToStaticMarkup(element);

    expect(html).toContain('AI Usage');
    expect(html).toContain('Total Reviews');
    expect(html).toContain('100%');
    expect(html).toContain('320ms');
  });

  it('fails closed when member has no access', async () => {
    mocks.access.mockResolvedValue(null);
    await expect(
      CourseAIUsagePage({
        params: Promise.resolve({ courseId }),
      }),
    ).rejects.toThrow('NEXT_NOT_FOUND');
  });
});
