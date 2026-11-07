/** @vitest-environment jsdom */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CourseSummary } from './contracts';
import { CourseDirectory } from './course-directory';

const mocks = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));

const courses: CourseSummary[] = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    title: 'Algorithms',
    description: 'Core concepts',
    lifecycle: 'active',
    isLegacy: false,
    role: 'instructor',
    ownerId: 'owner-1',
    features: {
      assessments: true,
      ai: true,
      discussions: true,
      xp: true,
      leaderboard: true,
    },
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    title: 'Operating Systems',
    description: null,
    lifecycle: 'active',
    isLegacy: false,
    role: 'student',
    ownerId: 'owner-2',
    features: {
      assessments: true,
      ai: false,
      discussions: true,
      xp: false,
      leaderboard: false,
    },
  },
  {
    id: '00000000-0000-4000-8000-000000000000',
    title: 'Legacy',
    description: 'Historical archive',
    lifecycle: 'archived',
    isLegacy: true,
    role: null,
    ownerId: null,
    features: {
      assessments: true,
      ai: true,
      discussions: true,
      xp: true,
      leaderboard: true,
    },
  },
];

beforeEach(() => {
  mocks.push.mockReset();
  mocks.refresh.mockReset();
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        course: { id: '00000000-0000-4000-8000-000000000003' },
      }),
    }),
  );
  return () => {
    vi.unstubAllGlobals();
  };
});

const CREATE_COURSE_LABEL = 'Create course';

describe('course directory display', () => {
  it('shows each course role and archived Legacy owner state', () => {
    render(
      <CourseDirectory
        initialCourses={courses}
        canCreate={true}
        currentUserId="owner-1"
        platformAdmin={false}
      />,
    );
    expect(screen.getByText('Algorithms')).toBeTruthy();
    expect(screen.getByText('instructor')).toBeTruthy();
    expect(screen.getByText('student')).toBeTruthy();
    expect(screen.getByText('archived')).toBeTruthy();
    expect(screen.getByText(/owner: unassigned/i)).toBeTruthy();
  });
});

describe('course directory create modal', () => {
  it('opens create course modal and submits new course', async () => {
    render(
      <CourseDirectory
        initialCourses={courses}
        canCreate={true}
        currentUserId="owner-1"
        platformAdmin={false}
      />,
    );
    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: CREATE_COURSE_LABEL }));
    expect(screen.getByRole('dialog')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Course title'), {
      target: { value: 'Data Structures' },
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Spring term' },
    });
    const submitBtn = screen.getByRole('button', { name: 'Save course' });
    fireEvent.click(submitBtn);

    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith(
        '/courses/00000000-0000-4000-8000-000000000003',
      ),
    );
    expect(fetch).toHaveBeenCalledWith(
      '/api/courses',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          title: 'Data Structures',
          description: 'Spring term',
        }),
      }),
    );
  });
});

describe('course directory join and cancel modals', () => {
  it('opens join course modal and submits join code', async () => {
    render(
      <CourseDirectory
        initialCourses={[]}
        canCreate={false}
        currentUserId="student-1"
        platformAdmin={false}
      />,
    );
    expect(screen.getByText(/no courses yet/i)).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Join course' }));
    expect(screen.getByRole('dialog')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Join code'), {
      target: { value: 'synthetic-join-code-123456' },
    });
    const submitBtn = screen.getByRole('button', { name: 'Submit join code' });
    fireEvent.click(submitBtn);

    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith(
        '/courses/00000000-0000-4000-8000-000000000003',
      ),
    );
    expect(fetch).toHaveBeenCalledWith(
      '/api/courses/join',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(
      screen.queryByRole('button', { name: CREATE_COURSE_LABEL }),
    ).toBeNull();
  });

  it('closes modal when cancel button is clicked', () => {
    render(
      <CourseDirectory
        initialCourses={courses}
        canCreate={true}
        currentUserId="owner-1"
        platformAdmin={false}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: CREATE_COURSE_LABEL }));
    expect(screen.getByRole('dialog')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
