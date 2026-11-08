/** @vitest-environment jsdom */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { AppHeader } from './app-header';

vi.mock('@/features/auth/auth-form', () => ({
  SignOutButton: () => <button type="button">Sign out</button>,
}));

vi.mock('@/features/auth/app-theme', () => ({
  AccountThemeButton: () => <button type="button">Toggle theme</button>,
}));

afterEach(() => {
  cleanup();
});

describe('AppHeader', () => {
  it('renders brand, Courses link, Profile, Theme and SignOut for student role', () => {
    render(<AppHeader role="student" />);
    expect(
      screen.getByRole('link', { name: 'CodeLeet' }).getAttribute('href'),
    ).toBe('/courses');
    expect(
      screen.getByRole('link', { name: 'Courses' }).getAttribute('href'),
    ).toBe('/courses');
    expect(
      screen.getByRole('link', { name: 'Profile' }).getAttribute('href'),
    ).toBe('/profile');
    expect(screen.queryByRole('link', { name: /user roles/i })).toBeNull();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Toggle theme' })).toBeDefined();
  });

  it('renders Courses and Profile as button-styled navigation links', () => {
    render(<AppHeader role="student" />);
    for (const name of ['Courses', 'Profile']) {
      const link = screen.getByRole('link', { name });
      expect(link.className).toContain('rounded-md');
      expect(link.className).toContain('border');
      expect(link.querySelector('svg[aria-hidden="true"]')).toBeTruthy();
    }
  });

  it('renders brand, Courses link, and User roles link for admin role', () => {
    render(<AppHeader role="admin" />);
    expect(
      screen.getByRole('link', { name: 'CodeLeet' }).getAttribute('href'),
    ).toBe('/courses');
    expect(
      screen.getByRole('link', { name: 'Courses' }).getAttribute('href'),
    ).toBe('/courses');
    expect(
      screen.getByRole('link', { name: /user roles/i }).getAttribute('href'),
    ).toBe('/admin');
  });
});
