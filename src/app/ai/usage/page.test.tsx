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

import AIUsagePage from './page';

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

describe('AI usage page', () => {
  it('renders a back link to the course workspace', async () => {
    const html = renderToStaticMarkup(
      await AIUsagePage({
        searchParams: Promise.resolve({ courseId }),
      }),
    );

    expect(html).toContain(`href="/courses/${courseId}"`);
    expect(html).toContain('Back to course');
  });
});
