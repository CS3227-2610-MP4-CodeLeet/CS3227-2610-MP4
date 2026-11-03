// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
import { LegacyOwnerAssignment } from './legacy-owner-assignment';

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'assigned' }),
    }),
  );
  vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('Legacy owner assignment', () => {
  it('lets a platform admin assign a verified instructor to the archived Legacy course', async () => {
    render(
      <LegacyOwnerAssignment
        courseId="legacy-course"
        ownerId={null}
        initialInstructors={[
          {
            user_id: 'teacher-1',
            email: 'teacher@example.test',
            display_name: 'Teacher',
          },
        ]}
        nextAfter={null}
      />,
    );
    fireEvent.change(screen.getByLabelText('Legacy course owner'), {
      target: { value: 'teacher-1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Assign owner' }));
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/courses/legacy-owner',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ ownerId: 'teacher-1' }),
        }),
      ),
    );
    expect(mocks.refresh).toHaveBeenCalled();
  });
});
