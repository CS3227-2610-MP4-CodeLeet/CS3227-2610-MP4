import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireMember: vi.fn(),
  readCourseAccess: vi.fn(),
  loadOwnerCases: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
  practiceEditor: vi.fn(() => null),
}));

vi.mock('next/navigation', () => ({ notFound: mocks.notFound }));
vi.mock('@/lib/auth/verified-user', () => ({
  requireMember: mocks.requireMember,
}));
vi.mock('@/lib/courses/access', () => ({
  readCourseAccess: mocks.readCourseAccess,
}));
vi.mock('@/features/practice-test-authoring/queries.server', () => ({
  loadOwnerCases: mocks.loadOwnerCases,
}));
vi.mock('@/features/practice-test-authoring/editor', () => ({
  PracticeTestEditor: mocks.practiceEditor,
}));
vi.mock('@/components/layout/breadcrumb-context', () => ({
  BreadcrumbSetter: () => null,
}));

import PracticeTestsPage from './page';

const courseId = '00000000-0000-4000-8000-000000000001';
const assignmentId = '00000000-0000-4000-8000-000000000002';
const initial = {
  assignment_id: assignmentId,
  title: 'Practice assignment',
  language: 'python',
  version: 2,
  cases: [],
  published_revision: 1,
  published_at: '2026-11-01T00:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  const supabase = {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: assignmentId, course_id: courseId },
            error: null,
          }),
        })),
      })),
    })),
  };
  mocks.requireMember.mockResolvedValue({
    supabase,
    user: { id: 'instructor' },
  });
  mocks.readCourseAccess.mockResolvedValue({
    role: 'instructor',
    lifecycle: 'active',
    featureEnabled: true,
  });
  mocks.loadOwnerCases.mockResolvedValue(initial);
});

it('renders the dedicated owner editor for an active course instructor', async () => {
  const element = await PracticeTestsPage({
    params: Promise.resolve({ courseId, assignmentId }),
  });

  expect(element.type).toBe('main');
  expect(element.props.children[3].type).toBe(mocks.practiceEditor);
  expect(element.props.children[3].props.initial).toEqual(initial);
  expect(mocks.readCourseAccess).toHaveBeenCalledWith(
    expect.anything(),
    'instructor',
    courseId,
    'assessments',
  );
});

it('hides the owner editor from students', async () => {
  mocks.readCourseAccess.mockResolvedValue({
    role: 'student',
    lifecycle: 'active',
    featureEnabled: true,
  });

  await expect(
    PracticeTestsPage({
      params: Promise.resolve({ courseId, assignmentId }),
    }),
  ).rejects.toThrow('NEXT_NOT_FOUND');
  expect(mocks.loadOwnerCases).not.toHaveBeenCalled();
});

it('hides an assignment from another course', async () => {
  mocks.requireMember.mockResolvedValue({
    supabase: {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: assignmentId, course_id: 'different-course' },
              error: null,
            }),
          })),
        })),
      })),
    },
    user: { id: 'instructor' },
  });

  await expect(
    PracticeTestsPage({
      params: Promise.resolve({ courseId, assignmentId }),
    }),
  ).rejects.toThrow('NEXT_NOT_FOUND');
  expect(mocks.loadOwnerCases).not.toHaveBeenCalled();
});
