/** @vitest-environment jsdom */
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { CourseSidebar } from './course-sidebar';

vi.mock('next/navigation', () => ({
  usePathname: () => '/courses/course-123/assignments',
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('CourseSidebar', () => {
  const defaultProps = {
    course: {
      id: 'course-123',
      title: 'Introduction to AI',
      lifecycle: 'active',
    },
    role: 'student' as const,
    userName: 'Alice Smith',
    totalXp: '2400',
    features: [
      { feature: 'assessments', enabled: true },
      { feature: 'discussions', enabled: true },
      { feature: 'xp', enabled: true },
      { feature: 'leaderboard', enabled: true },
      { feature: 'ai', enabled: true },
    ],
  };

  it('renders course title, user profile, formatted XP, and navigation links', () => {
    render(<CourseSidebar {...defaultProps} />);

    expect(screen.getByText('Introduction to AI')).toBeDefined();
    expect(screen.getByText('Alice Smith')).toBeDefined();
    expect(screen.getByText(/student/i)).toBeDefined();
    expect(screen.getByText(/2,400 XP/i)).toBeDefined();

    expect(
      screen.getByRole('link', { name: /assignments/i }).getAttribute('href'),
    ).toBe('/courses/course-123/assignments');
    expect(
      screen.getByRole('link', { name: /discussions/i }).getAttribute('href'),
    ).toBe('/courses/course-123/forums');
    expect(
      screen.getByRole('link', { name: /leaderboard/i }).getAttribute('href'),
    ).toBe('/courses/course-123/leaderboard');
    expect(
      screen.getByRole('link', { name: /my xp/i }).getAttribute('href'),
    ).toBe('/courses/course-123/xp');
  });

  it('toggles collapse state when collapse button is clicked', () => {
    render(<CourseSidebar {...defaultProps} />);
    const toggleButton = screen.getByRole('button', {
      name: /collapse sidebar/i,
    });
    expect(toggleButton.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(toggleButton);
    expect(toggleButton.getAttribute('aria-expanded')).toBe('false');
  });

  it('hides XP badge and link when xp feature is disabled', () => {
    const disabledXp = {
      ...defaultProps,
      features: defaultProps.features.map((f) =>
        f.feature === 'xp' ? { ...f, enabled: false } : f,
      ),
    };
    render(<CourseSidebar {...disabledXp} />);
    expect(screen.queryByText(/2,400 XP/i)).toBeNull();
    expect(screen.queryByRole('link', { name: /my xp/i })).toBeNull();
  });

  it('renders instructor links for instructor role', () => {
    const instructorProps = {
      ...defaultProps,
      role: 'instructor' as const,
      totalXp: null,
    };
    render(<CourseSidebar {...instructorProps} />);

    expect(screen.getByText(/instructor/i)).toBeDefined();
    expect(
      screen
        .getByRole('link', { name: /context comparison/i })
        .getAttribute('href'),
    ).toBe('/courses/course-123/instructor/ai-context');
    expect(
      screen.getByRole('link', { name: /new assignment/i }).getAttribute('href'),
    ).toBe('/courses/course-123/instructor/assignments/new');
    expect(screen.queryByRole('link', { name: /my xp/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /my progress/i })).toBeNull();
  });
});
