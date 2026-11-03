// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CourseInvitation, CourseMember } from './contracts';

const mocks = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
import { CoursePeople } from './course-people';

const course = {
  id: '00000000-0000-4000-8000-000000000001',
  owner_id: 'owner-1',
  title: 'Algorithms',
  description: '',
  lifecycle: 'active' as const,
  is_legacy: false,
};
const members: CourseMember[] = [
  {
    user_id: 'owner-1',
    email: 'owner@example.test',
    display_name: 'Owner',
    role: 'instructor',
    joined_at: '2026-01-01',
  },
  {
    user_id: 'teacher-2',
    email: 'teacher@example.test',
    display_name: 'Teacher',
    role: 'instructor',
    joined_at: '2026-01-02',
  },
  {
    user_id: 'student-3',
    email: 'student@example.test',
    display_name: 'Student',
    role: 'student',
    joined_at: '2026-01-03',
  },
];
const invitations: CourseInvitation[] = [
  {
    id: 'invite-1',
    email: 'pending@example.test',
    role: 'student',
    expires_at: '2026-12-01T00:00:00Z',
    accepted_at: null,
    revoked_at: null,
    created_at: '2026-11-01T00:00:00Z',
  },
];
function renderPeople({ isOwner = true } = {}) {
  return render(
    <CoursePeople
      course={course}
      currentUserId={isOwner ? 'owner-1' : 'teacher-2'}
      isOwner={isOwner}
      members={members}
      invitations={invitations}
    />,
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }),
  );
  vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('course people controls', () => {
  it('lets the owner invite either role and refreshes the member list', async () => {
    renderPeople();
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'new-teacher@example.test' },
    });
    fireEvent.change(screen.getByLabelText('Invite role'), {
      target: { value: 'instructor' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Invite by email' }));
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalled());
    expect(fetch).toHaveBeenCalledWith(
      `/api/courses/${course.id}/members`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          email: 'new-teacher@example.test',
          role: 'instructor',
        }),
      }),
    );
  });

  it('limits instructors to student invitations and student membership changes', async () => {
    renderPeople({ isOwner: false });
    expect(screen.queryByLabelText('Invite role')).toBeNull();
    expect(screen.getAllByRole('button', { name: 'Remove' })).toHaveLength(1);
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'new-student@example.test' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Invite by email' }));
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalled());
    expect(fetch).toHaveBeenCalledWith(
      `/api/courses/${course.id}/members`,
      expect.objectContaining({
        body: JSON.stringify({
          email: 'new-student@example.test',
          role: 'student',
        }),
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        `/api/courses/${course.id}/members/student-3`,
        expect.objectContaining({ method: 'DELETE' }),
      ),
    );
  });

  it('keeps owner and instructor controls unavailable when confirmation is declined', () => {
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(false));
    renderPeople();
    expect(screen.getByLabelText('Role for teacher@example.test')).toBeTruthy();
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove' })[0]!);
    expect(confirm).toHaveBeenCalledWith(
      'Remove teacher@example.test from this course?',
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it('revokes only active pending invitations', async () => {
    renderPeople();
    expect(screen.getByText(/pending@example.test/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Revoke' }));
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalled());
    expect(fetch).toHaveBeenCalledWith(
      `/api/courses/${course.id}/invitations/invite-1`,
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
