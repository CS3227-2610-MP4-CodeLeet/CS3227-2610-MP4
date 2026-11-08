/** @vitest-environment jsdom */
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import type { CourseFeatureSetting } from '@/features/course-workspaces/contracts';
import { CourseSidebar } from './course-sidebar';

vi.mock('next/navigation', () => ({
  usePathname: () => '/courses/course-123/assignments',
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const COURSE_TITLE = 'Introduction to AI';
const USER_NAME = 'Alice Smith';

const defaultFeatures: CourseFeatureSetting[] = [
  { feature: 'assessments', enabled: true },
  { feature: 'discussions', enabled: true },
  { feature: 'xp', enabled: true },
  { feature: 'leaderboard', enabled: true },
  { feature: 'ai', enabled: true },
];

const defaultProps = {
  course: {
    id: 'course-123',
    title: COURSE_TITLE,
    lifecycle: 'active',
  },
  role: 'student' as const,
  userName: USER_NAME,
  totalXp: '2400',
  features: defaultFeatures,
};

describe('CourseSidebar - basic navigation', () => {
  it('renders course title, user profile, formatted XP, and navigation links', () => {
    render(<CourseSidebar {...defaultProps} />);

    expect(screen.getByText(COURSE_TITLE)).toBeDefined();
    expect(screen.getByText(USER_NAME)).toBeDefined();
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
    expect(screen.queryByText('Administration')).toBeNull();
    expect(screen.queryByRole('link', { name: /manage users/i })).toBeNull();
  });

  it('renders instructor links and administration section for instructor role', () => {
    const instructorProps = {
      ...defaultProps,
      role: 'instructor' as const,
      totalXp: null,
    };
    render(<CourseSidebar {...instructorProps} />);

    expect(screen.getByText(/instructor/i)).toBeDefined();
    expect(screen.getByText('Administration')).toBeDefined();
    expect(
      screen.getByRole('link', { name: /manage users/i }).getAttribute('href'),
    ).toBe('/courses/course-123/manage-users');
    expect(
      screen
        .getByRole('link', { name: /context comparison/i })
        .getAttribute('href'),
    ).toBe('/courses/course-123/context-comparison');
    expect(screen.queryByRole('link', { name: /new assignment/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /my xp/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /my progress/i })).toBeNull();
  });
});

describe('CourseSidebar - feature gating', () => {
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

  it('hides submissions and grades links when assessments feature is disabled', () => {
    const disabledAssessments = {
      ...defaultProps,
      features: defaultProps.features.map((f) =>
        f.feature === 'assessments' ? { ...f, enabled: false } : f,
      ),
    };
    render(<CourseSidebar {...disabledAssessments} />);
    expect(screen.queryByRole('link', { name: /assignments/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /my submissions/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /my grades/i })).toBeNull();
    expect(screen.getByRole('link', { name: /my progress/i })).toBeDefined();
    expect(screen.getByRole('link', { name: /my xp/i })).toBeDefined();
  });

  it('hides progress link when both assessments and xp features are disabled', () => {
    const disabledBoth = {
      ...defaultProps,
      features: defaultProps.features.map((f) =>
        f.feature === 'assessments' || f.feature === 'xp'
          ? { ...f, enabled: false }
          : f,
      ),
    };
    render(<CourseSidebar {...disabledBoth} />);
    expect(screen.queryByRole('link', { name: /my progress/i })).toBeNull();
  });
});

describe('CourseSidebar - collapse and responsive drawer', () => {
  it('toggles collapse state when collapse button is clicked', () => {
    render(<CourseSidebar {...defaultProps} />);
    const toggleButton = screen.getByRole('button', {
      name: /collapse sidebar/i,
    });
    expect(toggleButton.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(toggleButton);
    expect(toggleButton.getAttribute('aria-expanded')).toBe('false');
  });

  it('keeps mobile drawer content expanded even when desktop sidebar preference is collapsed', () => {
    localStorage.setItem('codeleet:course-sidebar-collapsed', 'true');
    render(<CourseSidebar {...defaultProps} isMobileOpen={true} />);

    const titles = screen.getAllByText(COURSE_TITLE);
    expect(titles.length).toBeGreaterThanOrEqual(1);
    const users = screen.getAllByText(USER_NAME);
    expect(users.length).toBeGreaterThanOrEqual(1);
  });
});
