// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CourseMember } from './contracts';

const mocks = vi.hoisted(() => ({ refresh: vi.fn(), push: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mocks.refresh, push: mocks.push }),
}));
import { CourseAccess } from './course-access';

const course = {
  id: '00000000-0000-4000-8000-000000000001',
  owner_id: 'owner-1',
  title: 'Algorithms',
  description: '',
  lifecycle: 'active' as const,
  is_legacy: false,
};
const courseIdPath = `/api/courses/${course.id}`;
const transferButtonName = 'Transfer ownership';
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
];
function renderCourseAccess(currentUserId = 'owner-1') {
  render(
    <CourseAccess
      course={course}
      currentUserId={currentUserId}
      members={members}
    />,
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ code: 'synthetic-code-123' }),
    }),
  );
  vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('course access management', () => {
  it('creates then revokes a join code and reports the resulting state', async () => {
    renderCourseAccess();
    fireEvent.click(
      screen.getByRole('button', { name: 'Create or rotate code' }),
    );
    expect((await screen.findByLabelText('New join code')).textContent).toBe(
      'synthetic-code-123',
    );
    expect(fetch).toHaveBeenLastCalledWith(
      `${courseIdPath}/join-code`,
      expect.objectContaining({ method: 'PUT' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Revoke code' }));
    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toBe(
        'The student join code was revoked.',
      ),
    );
    expect(fetch).toHaveBeenLastCalledWith(
      `${courseIdPath}/join-code`,
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('requires owner confirmation and a different instructor before transfer', async () => {
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(false));
    renderCourseAccess();
    const transfer = screen.getByLabelText('New course owner');
    expect(
      Array.from(transfer.querySelectorAll('option')).map((x) => x.value),
    ).toEqual(['', 'teacher-2']);
    fireEvent.change(transfer, { target: { value: 'teacher-2' } });
    fireEvent.click(screen.getByRole('button', { name: transferButtonName }));
    expect(fetch).not.toHaveBeenCalled();
    expect(confirm).toHaveBeenCalledWith(
      'Transfer course ownership? You will remain an instructor.',
    );

    vi.mocked(confirm).mockReturnValue(true);
    fireEvent.click(screen.getByRole('button', { name: transferButtonName }));
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalled());
    expect(fetch).toHaveBeenLastCalledWith(
      `${courseIdPath}/transfer`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ newOwnerId: 'teacher-2' }),
      }),
    );
  });

  it('does not expose owner-only controls to another instructor', () => {
    renderCourseAccess('teacher-2');
    expect(
      screen.getByRole('button', { name: 'Create or rotate code' }),
    ).toBeTruthy();
    expect(
      screen.queryByRole('button', { name: transferButtonName }),
    ).toBeNull();
    expect(screen.queryByRole('button', { name: 'Archive course' })).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Delete empty course' }),
    ).toBeNull();
  });
});
