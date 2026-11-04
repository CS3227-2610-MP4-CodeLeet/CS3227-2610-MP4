// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CourseFeatureSetting } from './contracts';
import type { ComponentProps } from 'react';

const mocks = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
import { CourseWorkspace } from './course-workspace';

type WorkspaceProps = ComponentProps<typeof CourseWorkspace>;
const inviteButtonName = 'Invite by email';
const archiveButtonName = 'Archive course';

const course = {
  id: '00000000-0000-4000-8000-000000000001',
  title: 'Algorithms',
  description: 'Fall',
  owner_id: 'owner-1',
  lifecycle: 'active' as const,
  is_legacy: false,
};
const members = [
  {
    user_id: 'owner-1',
    email: 'owner@example.test',
    display_name: 'Owner',
    role: 'instructor' as const,
    joined_at: '2026-01-01',
  },
  {
    user_id: 'teacher-2',
    email: 'teacher@example.test',
    display_name: 'Teacher',
    role: 'instructor' as const,
    joined_at: '2026-01-02',
  },
  {
    user_id: 'student-3',
    email: 'student@example.test',
    display_name: 'Student',
    role: 'student' as const,
    joined_at: '2026-01-03',
  },
];
const features: CourseFeatureSetting[] = [
  { feature: 'assessments', enabled: true },
  { feature: 'ai', enabled: true },
  { feature: 'discussions', enabled: true },
  { feature: 'xp', enabled: true },
  { feature: 'leaderboard', enabled: true },
];

function renderWorkspace(overrides: Partial<WorkspaceProps> = {}) {
  return render(
    <CourseWorkspace
      course={course}
      role="student"
      currentUserId="student-3"
      features={features}
      initialMembers={[]}
      initialInvitations={[]}
      platformAdmin={false}
      {...overrides}
    />,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ status: 'ok' }) }),
  );
  vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('course workspace management', () => {
  it('lets course instructors invite students and configure shipped features', async () => {
    renderWorkspace({
      role: 'instructor',
      currentUserId: 'teacher-2',
      initialMembers: members,
    });
    expect(screen.getByText('Student', { selector: 'p' })).toBeTruthy();
    expect(screen.getByRole('button', { name: inviteButtonName })).toBeTruthy();
    expect(
      screen.queryByRole('button', { name: 'Transfer ownership' }),
    ).toBeNull();
    expect(
      screen.queryByRole('button', { name: archiveButtonName }),
    ).toBeNull();
    fireEvent.click(screen.getByRole('switch', { name: 'AI features' }));
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        `/api/courses/${course.id}/features`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ feature: 'ai', enabled: false }),
        }),
      ),
    );
  });

  it('keeps membership and settings controls away from students', () => {
    renderWorkspace();
    expect(screen.queryByRole('button', { name: inviteButtonName })).toBeNull();
    expect(screen.queryByRole('switch')).toBeNull();
    expect(
      screen.queryByRole('button', { name: archiveButtonName }),
    ).toBeNull();
  });

  it('requires confirmation before archiving a course', async () => {
    renderWorkspace({
      role: 'instructor',
      currentUserId: 'owner-1',
      initialMembers: [members[0]],
    });
    fireEvent.click(screen.getByRole('button', { name: archiveButtonName }));
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        `/api/courses/${course.id}`,
        expect.objectContaining({
          method: 'DELETE',
          body: JSON.stringify({ action: 'archive', confirm: true }),
        }),
      ),
    );
    expect(confirm).toHaveBeenCalled();
  });

  it('keeps archived workspaces read-only', () => {
    renderWorkspace({
      course: { ...course, lifecycle: 'archived' },
      role: 'instructor',
      currentUserId: 'owner-1',
      initialMembers: [members[0]],
    });
    expect(screen.queryByRole('button', { name: inviteButtonName })).toBeNull();
    expect(screen.getByText(/read-only/i)).toBeTruthy();
  });
});

describe('course feature navigation', () => {
  it('offers context comparison only inside an active AI-enabled instructor course', () => {
    renderWorkspace({
      role: 'instructor',
      currentUserId: 'owner-1',
      initialMembers: [members[0]],
    });
    expect(
      screen
        .getByRole('link', { name: 'Context comparison' })
        .getAttribute('href'),
    ).toBe(`/instructor/ai-context?courseId=${course.id}`);
  });

  it('shows only enabled course activities with explicit course context', () => {
    renderWorkspace({
      features: [
        { feature: 'assessments', enabled: true },
        { feature: 'ai', enabled: false },
        { feature: 'discussions', enabled: false },
        { feature: 'xp', enabled: false },
        { feature: 'leaderboard', enabled: false },
      ],
    });
    expect(
      screen.getByRole('link', { name: 'Assignments' }).getAttribute('href'),
    ).toBe(`/student/assignments?courseId=${course.id}`);
    expect(
      screen.getByRole('link', { name: 'My progress' }).getAttribute('href'),
    ).toBe(`/student/progress?courseId=${course.id}`);
    expect(screen.queryByRole('link', { name: 'AI usage' })).toBeNull();
    expect(
      screen.queryByRole('link', { name: 'Context comparison' }),
    ).toBeNull();
    expect(screen.queryByRole('link', { name: 'Discussions' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'My XP' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Leaderboard' })).toBeNull();
  });
});

describe('empty course deletion', () => {
  it('requires confirmation before deleting an empty course', () => {
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(false));
    renderWorkspace({
      role: 'instructor',
      currentUserId: 'owner-1',
      initialMembers: [members[0]],
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Delete empty course' }),
    );
    expect(confirm).toHaveBeenCalledWith(
      'Permanently delete this empty course? This cannot be undone.',
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it('hides permanent deletion while another course member remains', () => {
    renderWorkspace({
      role: 'instructor',
      currentUserId: 'owner-1',
      initialMembers: [members[0], members[2]],
    });
    expect(
      screen.queryByRole('button', { name: 'Delete empty course' }),
    ).toBeNull();
  });
});
