// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const linkStatus = vi.hoisted(() => ({ pending: false }));

vi.mock('next/link', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/link')>();
  return { ...actual, useLinkStatus: () => linkStatus };
});

import { ButtonLink, LinkPendingSpinner, PendingLink } from './pending-link';
import Link from 'next/link';

const COURSES = 'Courses';
const SPINNER = 'link-pending-spinner';
const icon = <svg data-testid="leading-icon" aria-hidden="true" />;

beforeEach(() => {
  linkStatus.pending = false;
});
afterEach(cleanup);

describe('PendingLink', () => {
  it('renders its icon and label without progress while idle', () => {
    render(
      <PendingLink href="/courses" icon={icon}>
        {COURSES}
      </PendingLink>,
    );
    const link = screen.getByRole('link', { name: COURSES });
    expect(link.getAttribute('href')).toBe('/courses');
    expect(screen.getByTestId('leading-icon')).toBeTruthy();
    expect(screen.queryByTestId(SPINNER)).toBeNull();
  });

  it('swaps the icon for a spinner and announces loading while pending', () => {
    linkStatus.pending = true;
    render(
      <PendingLink href="/courses" icon={icon}>
        {COURSES}
      </PendingLink>,
    );
    expect(screen.getByTestId(SPINNER)).toBeTruthy();
    expect(screen.queryByTestId('leading-icon')).toBeNull();
    expect(
      screen.getByRole('link', { name: /^Courses\s*\(loading\)$/ }),
    ).toBeTruthy();
  });

  it('shows a pending label and keeps a trailing icon', () => {
    linkStatus.pending = true;
    render(
      <PendingLink
        href="/next"
        pendingLabel="Opening…"
        trailingIcon={<svg data-testid="trailing-icon" aria-hidden="true" />}
      >
        Next
      </PendingLink>,
    );
    expect(screen.getByText('Opening…')).toBeTruthy();
    expect(screen.getByTestId('trailing-icon')).toBeTruthy();
  });

  it('keeps a visually hidden label available to assistive technology', () => {
    render(
      <PendingLink href="/courses/c/xp" icon={icon} hideLabel>
        My XP
      </PendingLink>,
    );
    const label = screen.getByText('My XP');
    expect(label.className).toContain('sr-only');
    expect(screen.getByRole('link', { name: 'My XP' })).toBeTruthy();
  });
});

describe('ButtonLink', () => {
  it('applies shared button styles with variant and custom classes', () => {
    render(
      <ButtonLink href="/sign-up" variant="primary" className="self-start">
        Create account
      </ButtonLink>,
    );
    const link = screen.getByRole('link', { name: 'Create account' });
    expect(link.className).toContain('bg-primary');
    expect(link.className).toContain('rounded-md');
    expect(link.className).toContain('self-start');
  });

  it('defaults to the outline variant', () => {
    render(<ButtonLink href="/profile">Profile</ButtonLink>);
    const link = screen.getByRole('link', { name: 'Profile' });
    expect(link.className).toContain('border');
    expect(link.className).not.toContain('bg-primary');
  });
});

describe('LinkPendingSpinner', () => {
  it('renders nothing until the surrounding link is pending', () => {
    const { rerender } = render(
      <Link href="/courses/c">
        Card <LinkPendingSpinner label="Opening" />
      </Link>,
    );
    expect(screen.queryByText('Opening…')).toBeNull();
    linkStatus.pending = true;
    rerender(
      <Link href="/courses/c">
        Card <LinkPendingSpinner label="Opening" />
      </Link>,
    );
    expect(screen.getByText('Opening…')).toBeTruthy();
    expect(screen.getByTestId(SPINNER)).toBeTruthy();
  });
});
