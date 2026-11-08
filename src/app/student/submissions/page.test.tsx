import { beforeEach, expect, it, vi } from 'vitest';
import StudentSubmissionsRedirect from './page';
import { requireMember } from '@/lib/auth/verified-user';

vi.mock('@/lib/auth/verified-user', () => ({ requireMember: vi.fn() }));
vi.mock('next/navigation', () => ({
  redirect: (path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireMember).mockResolvedValue({
    supabase: {},
    user: { id: 'verified-student' },
    role: 'student',
  } as never);
});

it('redirects to /courses/[courseId]/submissions when courseId is provided', async () => {
  await expect(
    StudentSubmissionsRedirect({
      searchParams: Promise.resolve({
        courseId: 'course-a',
        page: '2',
      }),
    }),
  ).rejects.toThrow('NEXT_REDIRECT:/courses/course-a/submissions?page=2');
});

it('redirects to /courses when courseId is not provided', async () => {
  await expect(
    StudentSubmissionsRedirect({ searchParams: Promise.resolve({}) }),
  ).rejects.toThrow('NEXT_REDIRECT:/courses');
});
