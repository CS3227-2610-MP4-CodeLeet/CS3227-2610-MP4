import { beforeEach, expect, it, vi } from 'vitest';
import AIUsagePage from './page';

vi.mock('@/lib/auth/verified-user', () => ({
  getVerifiedUserRole: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
  redirect: (path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  },
}));

beforeEach(async () => {
  vi.clearAllMocks();
  const { getVerifiedUserRole } = await import('@/lib/auth/verified-user');
  vi.mocked(getVerifiedUserRole).mockResolvedValue({
    user: { id: 'user-1' } as any,
    role: 'student',
    supabase: {} as any,
  });
});

it('redirects to /courses/[courseId]/ai-usage when courseId is provided', async () => {
  await expect(
    AIUsagePage({ searchParams: Promise.resolve({ courseId: 'course-123' }) }),
  ).rejects.toThrow('NEXT_REDIRECT:/courses/course-123/ai-usage');
});

it('fails closed when no course context is selected', async () => {
  await expect(
    AIUsagePage({ searchParams: Promise.resolve({}) }),
  ).rejects.toThrow('NEXT_NOT_FOUND');
});
