import { beforeEach, expect, it, vi } from 'vitest';
import { redirect } from 'next/navigation';
import PracticeTestsPage from './page';

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

it('redirects to the unified assignment edit page', async () => {
  const courseId = '00000000-0000-4000-8000-000000000001';
  const assignmentId = '00000000-0000-4000-8000-000000000002';

  await PracticeTestsPage({
    params: Promise.resolve({ courseId, assignmentId }),
  });

  expect(redirect).toHaveBeenCalledWith(
    `/courses/${courseId}/assignments/${assignmentId}/edit`,
  );
});
