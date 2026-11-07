import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ verified: vi.fn(), access: vi.fn() }));
vi.mock('@/lib/auth/verified-user', () => ({
  getVerifiedUserRole: mocks.verified,
}));
vi.mock('@/lib/courses/access', () => ({ readCourseAccess: mocks.access }));
vi.mock('@/features/assignment-deadlines/components', () => ({
  AssignmentDueDate: () => null,
}));
vi.mock('@/features/assignment-xp/components', () => ({
  AssignmentXp: () => null,
}));
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
  redirect: (path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  },
}));

import CourseInstructorPage from './page';

beforeEach(() => {
  vi.clearAllMocks();
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    order: vi.fn(async () => ({
      data: [
        {
          id: 'assignment-1',
          course_id: 'course-1',
          title: 'Archived assignment',
          language: 'python',
          publication_status: 'published',
          updated_at: '2026-11-01T00:00:00Z',
          version: 1,
          due_at: null,
          max_xp: 100,
        },
      ],
      error: null,
    })),
  };
  const supabase = { from: vi.fn(() => builder) };
  mocks.verified.mockResolvedValue({
    user: { id: 'instructor-1' },
    supabase,
  });
  mocks.access.mockResolvedValue({
    role: 'instructor',
    lifecycle: 'active',
    featureEnabled: true,
  });
});

async function renderPage() {
  const page = await CourseInstructorPage({
    params: Promise.resolve({ courseId: 'course-1' }),
  });
  return renderToStaticMarkup(page);
}

it('keeps archived assignments readable without offering a broken Edit action', async () => {
  mocks.access.mockResolvedValueOnce({
    role: 'instructor',
    lifecycle: 'archived',
    featureEnabled: false,
  });

  const html = await renderPage();

  expect(html).toContain('Archived assignment');
  expect(html).toContain('Submissions');
  expect(html).not.toContain('/edit');
});

it('keeps the Edit action available for active course assignments', async () => {
  const html = await renderPage();

  expect(html).toContain(
    '/courses/course-1/instructor/assignments/assignment-1/edit',
  );
});
