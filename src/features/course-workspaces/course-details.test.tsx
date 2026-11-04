// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CourseDetails } from './course-details';

const course = {
  id: '00000000-0000-4000-8000-000000000001',
  owner_id: 'owner-1',
  title: 'Algorithms',
  description: 'Autumn term',
  lifecycle: 'active' as const,
  is_legacy: false,
};
const coursePath = `/api/courses/${course.id}`;
const courseTitleLabel = 'Course title';
beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('course details form', () => {
  it('saves the edited title and description to the selected course', async () => {
    render(<CourseDetails course={course} />);
    fireEvent.change(screen.getByLabelText(courseTitleLabel), {
      target: { value: 'Advanced Algorithms' },
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Spring term' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save details' }));
    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toBe(
        'Course details saved.',
      ),
    );
    expect(fetch).toHaveBeenCalledWith(
      coursePath,
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({
          title: 'Advanced Algorithms',
          description: 'Spring term',
        }),
      }),
    );
  });

  it('shows a safe error and retains the form values when saving fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          error: { message: 'Course details could not be saved.' },
        }),
      }),
    );
    render(<CourseDetails course={course} />);
    fireEvent.change(screen.getByLabelText(courseTitleLabel), {
      target: { value: 'Keep this title' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save details' }));
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByLabelText(courseTitleLabel)).toHaveProperty(
      'value',
      'Keep this title',
    );
  });
});
