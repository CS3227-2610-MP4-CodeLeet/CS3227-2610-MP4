/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ requireRole: vi.fn(), from: vi.fn() }));
vi.mock('@/lib/auth/verified-user', () => ({
  requireRole: mocks.requireRole,
}));
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));

import AdminCoursePage from './page';

function query(result: unknown) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    maybeSingle: vi.fn(async () => result),
  };
  return builder;
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

it('shows only course metadata to an authorized platform admin', async () => {
  const courseId = '00000000-0000-4000-8000-000000000001';
  const supabase = {
    from: mocks.from.mockImplementation((table: string) => {
      if (table !== 'courses') throw new Error(`Unexpected table: ${table}`);
      return query({
        data: {
          id: courseId,
          owner_id: null,
          title: 'Legacy',
          description: 'Historical archive',
          lifecycle: 'archived',
          is_legacy: true,
        },
        error: null,
      });
    }),
  };
  mocks.requireRole.mockResolvedValue({
    user: { id: 'admin-1' },
    role: 'admin',
    supabase,
  });

  const element = await AdminCoursePage({
    params: Promise.resolve({ courseId }),
  });
  render(element);

  expect(mocks.requireRole).toHaveBeenCalledWith('admin');
  expect(mocks.from).toHaveBeenCalledExactlyOnceWith('courses');
  expect(screen.getByRole('heading', { name: 'Legacy' })).toBeTruthy();
  expect(screen.getByText('Historical archive')).toBeTruthy();
  expect(screen.getByText('Archived')).toBeTruthy();
  expect(screen.getByText('Unassigned')).toBeTruthy();
  expect(screen.queryByRole('link', { name: /manage users/i })).toBeNull();
  expect(
    screen.queryByRole('button', { name: /transfer ownership/i }),
  ).toBeNull();
});

it('requires the admin role before querying course metadata', async () => {
  mocks.requireRole.mockRejectedValue(new Error('admin access required'));

  await expect(
    AdminCoursePage({
      params: Promise.resolve({
        courseId: '00000000-0000-4000-8000-000000000001',
      }),
    }),
  ).rejects.toThrow('admin access required');
  expect(mocks.from).not.toHaveBeenCalled();
});
