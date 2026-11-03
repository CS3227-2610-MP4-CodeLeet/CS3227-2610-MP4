import { expect, type Page } from '@playwright/test';
import { test } from './helpers/course-workspace-fixtures';

test.use({
  baseURL: process.env.ACCOUNT_TEST_BASE_URL ?? 'http://127.0.0.1:3100',
});
test.skip(
  !process.env.MP4_E2E_SERVICE_ROLE_KEY ||
    !/^http:\/\/(localhost|127\.0\.0\.1):/.test(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    ),
  'Requires explicit local Supabase fixture credentials.',
);

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/sign-in');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(/\/(student\/assignments|instructor|unauthorized)?$/);
}

async function openSelectedCourseAssignments(page: Page, courseId: string) {
  await page.getByRole('link', { name: 'Assignments', exact: true }).click();
  await expect(page).toHaveURL(
    new RegExp(`/student/assignments\\?courseId=${courseId}$`),
  );
  await expect(
    page.getByRole('heading', { name: 'Your assignments' }),
  ).toBeVisible();
}

test('course role context stays isolated and stale membership is denied on mobile', async ({
  page,
  courseWorkspaceFixture: fixture,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await signIn(page, fixture.student.email, fixture.password);
  await page.goto(`/courses/${fixture.studentCourseId}`);
  await expect(page.getByText('Course workspace · student')).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Discussions', exact: true }),
  ).toHaveAttribute('href', `/forums?courseId=${fixture.studentCourseId}`);
  await expect(
    page.getByRole('link', { name: 'My XP', exact: true }),
  ).toHaveAttribute('href', `/student/xp?courseId=${fixture.studentCourseId}`);
  await openSelectedCourseAssignments(page, fixture.studentCourseId);
  await page.goto(`/courses/${fixture.studentCourseId}`);
  await page.getByRole('link', { name: 'Discussions', exact: true }).click();
  await expect(page).toHaveURL(
    new RegExp(`/forums\\?courseId=${fixture.studentCourseId}$`),
  );
  await expect(page.getByRole('heading', { name: 'Forums' })).toBeVisible();
  await page.goto(`/courses/${fixture.instructorCourseId}`);
  await expect(page.getByText('Course workspace · instructor')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Invite by email' }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await expect(
    page.getByRole('link', { name: 'Discussions', exact: true }),
  ).toHaveAttribute('href', `/forums?courseId=${fixture.instructorCourseId}`);

  await fixture.removeInstructorCourseMembership();
  await page.goto(`/courses/${fixture.instructorCourseId}`);
  await expect(page.getByText('This page could not be found.')).toBeVisible();
});
