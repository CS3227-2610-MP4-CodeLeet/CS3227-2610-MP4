import { beforeEach, expect, it, vi } from 'vitest';
import ProgressPage from './page';
import { requireMember } from '@/lib/auth/verified-user';

vi.mock('@/lib/auth/verified-user', () => ({
  requireMember: vi.fn(),
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
  vi.mocked(requireMember).mockResolvedValue({
    user: { id: 'student-1' },
    supabase: {},
  } as never);
});

it('redirects to /courses/[courseId]/progress when courseId is provided', async () => {
  await expect(
    ProgressPage({ searchParams: Promise.resolve({ courseId: 'course-123' }) }),
  ).rejects.toThrow('NEXT_REDIRECT:/courses/course-123/progress');
});

it('fails closed when no course context is selected', async () => {
  await expect(
    ProgressPage({ searchParams: Promise.resolve({}) }),
  ).rejects.toThrow('NEXT_NOT_FOUND');
});
