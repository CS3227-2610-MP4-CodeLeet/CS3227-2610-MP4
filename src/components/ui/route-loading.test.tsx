// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { RouteLoading } from './route-loading';
import CoursesLoading from '@/app/courses/loading';
import CourseLoading from '@/app/courses/[courseId]/loading';
import AdminLoading from '@/app/admin/loading';

afterEach(cleanup);

it('announces what is loading through a named status region', () => {
  render(<RouteLoading label="courses" />);
  const status = screen.getByRole('status', { name: 'Loading courses' });
  expect(status.textContent).toContain('Loading courses…');
});

it('renders the requested number of skeleton rows', () => {
  const { container } = render(<RouteLoading label="grades" rows={4} />);
  expect(container.querySelectorAll('.h-20')).toHaveLength(4);
});

it.each([
  ['courses', CoursesLoading],
  ['course', CourseLoading],
  ['user roles', AdminLoading],
])('route fallback for %s uses the shared loading state', (label, Loading) => {
  render(<Loading />);
  expect(screen.getByRole('status', { name: `Loading ${label}` })).toBeTruthy();
});
