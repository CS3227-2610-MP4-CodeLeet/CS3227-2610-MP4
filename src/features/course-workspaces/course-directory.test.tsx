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

  it('opens create course modal and submits new course', async () => {
    render(
      <CourseDirectory
        initialCourses={courses}
        canCreate={true}
        currentUserId="owner-1"
        platformAdmin={false}
      />,
    );
    // Modal is initially closed
    expect(screen.queryByRole('dialog')).toBeNull();

    // Click right-aligned header button to open modal
    fireEvent.click(screen.getByRole('button', { name: 'Create course' }));
    expect(screen.getByRole('dialog')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Course title'), {
      target: { value: 'Data Structures' },
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Spring term' },
    });
    // Submit the form inside the modal
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
    // Modal is initially closed
    expect(screen.queryByRole('dialog')).toBeNull();

    // Click right-aligned header button to open modal
    fireEvent.click(screen.getByRole('button', { name: 'Join course' }));
    expect(screen.getByRole('dialog')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Join code'), {
      target: { value: 'synthetic-join-code-123456' },
    });
    // Submit button inside modal
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
    expect(screen.queryByRole('button', { name: 'Create course' })).toBeNull();
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
    fireEvent.click(screen.getByRole('button', { name: 'Create course' }));
    expect(screen.getByRole('dialog')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
