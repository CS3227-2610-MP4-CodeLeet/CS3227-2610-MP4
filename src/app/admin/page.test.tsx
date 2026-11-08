/** @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AdminPage from './page';

vi.mock('@/lib/auth/verified-user', () => ({
  requireRole: vi.fn().mockResolvedValue({
    user: { id: 'admin-1' },
    supabase: {
      rpc: vi.fn().mockResolvedValue({
        data: [
          {
            user_id: '91000000-0000-4000-8000-000000000001',
            email: 'user@test.com',
            display_name: 'Test',
            role: 'student',
          },
        ],
        error: null,
      }),
    },
  }),
}));

vi.mock('@/features/admin-users/user-directory', () => ({
  UserDirectory: () => (
    <div data-testid="user-directory">User Directory Mock</div>
  ),
}));

describe('AdminPage', () => {
  it('renders UserDirectory and does not render LegacyOwnerAssignment', async () => {
    const element = await AdminPage();
    render(element);
    expect(screen.getByRole('heading', { name: 'User roles' })).toBeDefined();
    expect(screen.getByTestId('user-directory')).toBeDefined();
    expect(screen.queryByText(/Archived historical workspace/i)).toBeNull();
  });
});
