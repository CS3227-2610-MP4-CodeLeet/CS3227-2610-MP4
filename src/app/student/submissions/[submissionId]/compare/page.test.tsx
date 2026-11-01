import { beforeEach, expect, it, vi } from 'vitest';
import { requireRole } from '@/lib/auth/verified-user';
import { loadRevisionComparison } from '@/features/student-submissions/revision-comparison.server';
import CompareRevisionsPage from './page';

vi.mock('@/lib/auth/verified-user', () => ({ requireRole: vi.fn() }));
vi.mock('@/features/student-submissions/revision-comparison.server', () => ({
  loadRevisionComparison: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('not-found');
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireRole).mockResolvedValue({
    supabase: {},
    user: { id: 'verified-student' },
  } as never);
  vi.mocked(loadRevisionComparison).mockResolvedValue(null);
});

it('uses verified identity and validated revision numbers rather than URL identity', async () => {
  await expect(
    CompareRevisionsPage({
      params: Promise.resolve({ submissionId: 'anchor-id' }),
      searchParams: Promise.resolve({
        before: '2',
        after: '1',
        student_id: 'peer',
      }),
    }),
  ).rejects.toThrow('not-found');
  expect(requireRole).toHaveBeenCalledWith('student');
  expect(loadRevisionComparison).toHaveBeenCalledWith(
    {},
    'verified-student',
    'anchor-id',
    { before: 2, after: 1 },
  );
});

it('rejects duplicate parameters before any comparison read', async () => {
  await expect(
    CompareRevisionsPage({
      params: Promise.resolve({ submissionId: 'anchor-id' }),
      searchParams: Promise.resolve({ before: ['1', '2'] }),
    }),
  ).rejects.toThrow('not-found');
  expect(loadRevisionComparison).not.toHaveBeenCalled();
});
