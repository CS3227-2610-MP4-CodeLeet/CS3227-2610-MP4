import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  member: vi.fn(),
  access: vi.fn(),
  loadAssignments: vi.fn(),
}));

vi.mock('@/lib/auth/verified-user', () => ({ requireMember: mocks.member }));
vi.mock('@/lib/courses/access', () => ({ readCourseAccess: mocks.access }));
vi.mock('@/features/assignment-deadlines/assignments.server', () => ({
  loadPublishedAssignments: mocks.loadAssignments,
}));
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
  redirect: (path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  },
}));

import CourseAssignmentsPage from './page';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.member.mockResolvedValue({ user: { id: 'student-1' }, supabase: {} });
  mocks.access.mockResolvedValue({
    role: 'student',
    lifecycle: 'active',
    featureEnabled: true,
  });
  mocks.loadAssignments.mockResolvedValue([]);
});

it('loads published assignments for student in course', async () => {
  const result = await CourseAssignmentsPage({
    params: Promise.resolve({ courseId: 'course-123' }),
    searchParams: Promise.resolve({}),
  });
  expect(result).toBeDefined();
  expect(mocks.access).toHaveBeenCalledWith(
    expect.anything(),
    'student-1',
    'course-123',
    'assessments',
  );
  expect(mocks.loadAssignments).toHaveBeenCalledWith(
    expect.anything(),
    'student-1',
    'course-123',
    expect.anything(),
  );
});

it('throws notFound if student has no access', async () => {
  mocks.access.mockResolvedValue(null);
  await expect(
    CourseAssignmentsPage({
      params: Promise.resolve({ courseId: 'course-123' }),
      searchParams: Promise.resolve({}),
    }),
  ).rejects.toThrow('NEXT_NOT_FOUND');
});
