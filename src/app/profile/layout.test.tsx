/** @vitest-environment jsdom */
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import ProfileLayout from './layout';

const mocks = vi.hoisted(() => ({
  redirect: vi.fn(),
  getVerifiedUserRole: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: mocks.redirect,
}));

vi.mock('@/lib/auth/verified-user', () => ({
  getVerifiedUserRole: mocks.getVerifiedUserRole,
}));

vi.mock('@/features/auth/auth-form', () => ({
  SignOutButton: () => <button type="button">Sign out</button>,
}));

vi.mock('@/features/auth/app-theme', () => ({
  AccountThemeButton: () => <button type="button">Toggle theme</button>,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ProfileLayout', () => {
  it('redirects unauthenticated visitor to /sign-in', async () => {
    mocks.getVerifiedUserRole.mockResolvedValue({ user: null, role: null });

    await ProfileLayout({ children: <div>Child Content</div> });

    expect(mocks.redirect).toHaveBeenCalledWith('/sign-in');
  });

  it('renders global AppHeader and children for student role', async () => {
    mocks.getVerifiedUserRole.mockResolvedValue({
      user: { id: 'student-1', email: 'student@example.com' },
      role: 'student',
    });

    const element = await ProfileLayout({
      children: <div>Child Content</div>,
    });
    render(element);

    expect(screen.getByRole('link', { name: 'CodeLeet' }).getAttribute('href')).toBe('/courses');
    expect(screen.getByRole('link', { name: 'Courses' }).getAttribute('href')).toBe('/courses');
    expect(screen.getByRole('link', { name: 'Profile' }).getAttribute('href')).toBe('/profile');
    expect(screen.queryByRole('link', { name: /user roles/i })).toBeNull();
    expect(screen.getByText('Child Content')).toBeDefined();
  });

  it('renders global AppHeader with admin navigation for admin role', async () => {
    mocks.getVerifiedUserRole.mockResolvedValue({
      user: { id: 'admin-1', email: 'admin@example.com' },
      role: 'admin',
    });

    const element = await ProfileLayout({
      children: <div>Child Content</div>,
    });
    render(element);

    expect(screen.getByRole('link', { name: /user roles/i }).getAttribute('href')).toBe('/admin');
    expect(screen.getByText('Child Content')).toBeDefined();
  });
});
