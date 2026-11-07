/** @vitest-environment jsdom */
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import ProfilePage from './page';

const mocks = vi.hoisted(() => ({
  loadProfileSettings: vi.fn(),
}));

vi.mock('@/features/profile/profile.server', () => ({
  loadProfileSettings: mocks.loadProfileSettings,
}));

vi.mock('@/features/profile/profile-form', () => ({
  ProfileForm: ({ username, email, role }: { username: string; email: string; role: string }) => (
    <div data-testid="profile-form">
      <span>{username}</span>
      <span>{email}</span>
      <span>{role}</span>
    </div>
  ),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ProfilePage', () => {
  it('renders profile settings heading, form, and omits legacy back-links', async () => {
    mocks.loadProfileSettings.mockResolvedValue({
      username: 'Student 01',
      usernameLoginEnabled: true,
      email: 'student01@codeleet.test',
      role: 'student',
    });

    const element = await ProfilePage();
    render(element);

    expect(screen.getByRole('heading', { name: 'Profile settings' })).toBeDefined();
    expect(screen.getByText('Manage how you appear in CodeLeet.')).toBeDefined();
    expect(screen.getByTestId('profile-form')).toBeDefined();
    expect(screen.getByText('Student 01')).toBeDefined();
    expect(screen.getByText('student01@codeleet.test')).toBeDefined();

    // Verify back-links are completely removed
    expect(screen.queryByText(/back to assignments/i)).toBeNull();
    expect(screen.queryByText(/back to courses/i)).toBeNull();
  });
});
