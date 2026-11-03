// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }));
import { CourseDirectory } from './course-directory';

const courses = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    title: 'Algorithms',
    description: 'Fall term',
    owner_id: 'owner-1',
    lifecycle: 'active' as const,
    is_legacy: false,
    role: 'instructor' as const,
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    title: 'Legacy',
    description: 'Historical work',
    owner_id: null,
    lifecycle: 'archived' as const,
    is_legacy: true,
    role: 'student' as const,
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        courseId: '00000000-0000-4000-8000-000000000003',
      }),
    }),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('course directory', () => {
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

  it('creates a course and opens its workspace', async () => {
    render(
      <CourseDirectory
        initialCourses={[]}
        canCreate={true}
        currentUserId="owner-1"
        platformAdmin={false}
      />,
    );
    fireEvent.change(screen.getByLabelText('Course title'), {
      target: { value: 'Data Structures' },
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Spring term' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create course' }));
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

  it('joins a course by code and provides an empty state for new students', async () => {
    render(
      <CourseDirectory
        initialCourses={[]}
        canCreate={false}
        currentUserId="student-1"
        platformAdmin={false}
      />,
    );
    expect(screen.getByText(/no courses yet/i)).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Join code'), {
      target: { value: 'synthetic-join-code-123456' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Join course' }));
    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith(
        '/courses/00000000-0000-4000-8000-000000000003',
      ),
    );
    expect(fetch).toHaveBeenCalledWith(
      '/api/courses/join',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(screen.queryByRole('button', { name: 'Create course' })).toBeNull();
  });
});
