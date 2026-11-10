import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, it, describe, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  member: vi.fn(),
  access: vi.fn(),
  loadAssignments: vi.fn(),
  instructorAssignments: [] as unknown[],
}));

vi.mock('@/lib/auth/verified-user', () => ({
  requireMember: mocks.member,
  getVerifiedUserRole: mocks.member,
}));
vi.mock('@/lib/courses/access', () => ({ readCourseAccess: mocks.access }));
vi.mock('@/features/assignment-deadlines/assignments.server', () => ({
  loadPublishedAssignments: mocks.loadAssignments,
}));
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

import CourseAssignmentsPage from './page';

const testCourseId = 'course-123';
const testTitle = 'Algorithm Problem 1';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.instructorAssignments = [
    {
      id: 'asg-1',
      course_id: testCourseId,
      title: testTitle,
      language: 'python',
      publication_status: 'published',
      updated_at: '2026-11-01T00:00:00Z',
      version: 1,
      due_at: null,
      max_xp: 100,
    },
  ];
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    order: vi.fn(async () => ({
      data: mocks.instructorAssignments,
      error: null,
    })),
  };
  const supabase = { from: vi.fn(() => builder) };
  mocks.member.mockResolvedValue({
    user: { id: 'user-1' },
    supabase,
  });
  mocks.access.mockResolvedValue({
    role: 'student',
    lifecycle: 'active',
    featureEnabled: true,
  });
  mocks.loadAssignments.mockResolvedValue([]);
});

describe('CourseAssignmentsPage - student role', () => {
  it('loads published assignments for student in course', async () => {
    const result = await CourseAssignmentsPage({
      params: Promise.resolve({ courseId: testCourseId }),
      searchParams: Promise.resolve({}),
    });
    expect(result).toBeDefined();
    expect(mocks.access).toHaveBeenCalledWith(
      expect.anything(),
      'user-1',
      testCourseId,
      'assessments',
    );
    expect(mocks.loadAssignments).toHaveBeenCalledWith(
      expect.anything(),
      'user-1',
      testCourseId,
      expect.anything(),
    );
  });

  it('throws notFound if student has no access', async () => {
    mocks.access.mockResolvedValue(null);
    await expect(
      CourseAssignmentsPage({
        params: Promise.resolve({ courseId: testCourseId }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow('NEXT_NOT_FOUND');
  });
});

describe('CourseAssignmentsPage - instructor role', () => {
  it('renders instructor management view with Preview, Edit, and Submissions buttons', async () => {
    mocks.access.mockResolvedValue({
      role: 'instructor',
      lifecycle: 'active',
      featureEnabled: true,
    });

    const page = await CourseAssignmentsPage({
      params: Promise.resolve({ courseId: testCourseId }),
      searchParams: Promise.resolve({}),
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain(testTitle);
    expect(html).toContain('New assignment');
    expect(html).toContain(`/courses/${testCourseId}/assignments/new`);
    expect(html).toContain(`/courses/${testCourseId}/assignments/asg-1`); // Preview
    expect(html).toContain(`/courses/${testCourseId}/assignments/asg-1/edit`); // Edit
    expect(html).toContain(
      `/courses/${testCourseId}/submissions?assignmentId=asg-1`,
    ); // Submissions
    expect(html).not.toContain('← Course workspace');
  });

  it('keeps archived instructor assignments readable without Edit or New action', async () => {
    mocks.access.mockResolvedValue({
      role: 'instructor',
      lifecycle: 'archived',
      featureEnabled: false,
    });

    const page = await CourseAssignmentsPage({
      params: Promise.resolve({ courseId: testCourseId }),
      searchParams: Promise.resolve({}),
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain(testTitle);
    expect(html).not.toContain('New assignment');
    expect(html).not.toContain('/edit');
  });

  it('illustrates an empty assignment list and keeps the create action', async () => {
    mocks.access.mockResolvedValue({
      role: 'instructor',
      lifecycle: 'active',
      featureEnabled: true,
    });
    mocks.instructorAssignments = [];

    const page = await CourseAssignmentsPage({
      params: Promise.resolve({ courseId: testCourseId }),
      searchParams: Promise.resolve({}),
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain('No assignments in this course yet');
    expect(html).toContain('data-illustration="collection"');
    expect(html).toContain(`/courses/${testCourseId}/assignments/new`);
  });
});
