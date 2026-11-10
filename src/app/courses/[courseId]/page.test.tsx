import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  verified: vi.fn(),
  rpc: vi.fn(),
  workspace: vi.fn(() => null),
}));

vi.mock('@/lib/auth/verified-user', () => ({
  getVerifiedUserRole: mocks.verified,
}));
vi.mock('@/features/course-workspaces/course-workspace', () => ({
  CourseWorkspace: mocks.workspace,
}));
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
  redirect: (path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  },
}));

import CoursePage from './page';

function query(result: unknown) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    maybeSingle: vi.fn(async () => result),
    then: (
      resolve: (value: unknown) => unknown,
      reject: (reason: unknown) => unknown,
    ) => Promise.resolve(result).then(resolve, reject),
  };
  return builder;
}

beforeEach(() => {
  vi.clearAllMocks();
  const courseId = 'legacy-course';
  const supabase = {
    from: vi.fn((table: string) => {
      if (table === 'courses')
        return query({
          data: {
            id: courseId,
            owner_id: null,
            title: 'Legacy',
            description: '',
            lifecycle: 'archived',
            is_legacy: true,
          },
          error: null,
        });
      if (table === 'course_memberships')
        return query({ data: { role: 'instructor' }, error: null });
      return query({ data: [], error: null });
    }),
    rpc: mocks.rpc.mockResolvedValue({
      data: null,
      error: { message: 'Legacy member directory is unavailable' },
    }),
  };
  mocks.verified.mockResolvedValue({
    user: { id: 'legacy-instructor' },
    role: 'instructor',
    supabase,
  });
});

it('renders the read-only Legacy workspace without loading its blocked directory', async () => {
  const element = await CoursePage({
    params: Promise.resolve({ courseId: 'legacy-course' }),
    searchParams: Promise.resolve({}),
  });

  expect(element.type).toBe(mocks.workspace);
  expect(element.props.course.is_legacy).toBe(true);
  expect(element.props.course.lifecycle).toBe('archived');
  expect(element.props.initialMembers).toEqual([]);
  expect(element.props.initialInvitations).toEqual([]);
  expect(mocks.rpc).not.toHaveBeenCalled();
});

it('keeps a nonmember platform admin out of the course-member page route', async () => {
  const courseId = 'admin-course';
  const from = vi.fn((table: string) => {
    if (table === 'courses')
      return query({
        data: {
          id: courseId,
          owner_id: 'course-owner',
          title: 'Algorithms',
          description: 'Fall section',
          lifecycle: 'active',
          is_legacy: false,
        },
        error: null,
      });
    if (table === 'course_memberships')
      return query({ data: null, error: null });
    return query({ data: [], error: null });
  });
  mocks.verified.mockResolvedValue({
    user: { id: 'admin-1' },
    role: 'admin',
    supabase: { from, rpc: mocks.rpc },
  });

  await expect(
    CoursePage({
      params: Promise.resolve({ courseId }),
      searchParams: Promise.resolve({}),
    }),
  ).rejects.toThrow('NEXT_NOT_FOUND');
});
