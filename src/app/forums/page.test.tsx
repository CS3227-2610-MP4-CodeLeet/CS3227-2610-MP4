import { beforeEach, expect, it, vi } from 'vitest';
import ForumsPage from './page';

vi.mock('@/features/forums/access.server', () => ({
  requireForumMember: async () => ({ user: { id: 'user-1' }, supabase: {} }),
}));

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
  redirect: (path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

it('redirects to /courses/[courseId]/forums when courseId is provided', async () => {
  await expect(
    ForumsPage({
      searchParams: Promise.resolve({
        courseId: 'course-123',
        q: 'loops',
      }),
    }),
  ).rejects.toThrow('NEXT_REDIRECT:/courses/course-123/forums?q=loops');
});

it('fails closed when no course context is selected', async () => {
  await expect(
    ForumsPage({ searchParams: Promise.resolve({}) }),
  ).rejects.toThrow('NEXT_NOT_FOUND');
});
