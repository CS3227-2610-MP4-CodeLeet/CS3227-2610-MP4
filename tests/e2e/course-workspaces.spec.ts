import { expect, type Page } from '@playwright/test';
import { test } from './helpers/course-workspace-fixtures';

const closeNavLabel = 'Close navigation menu';
const openNavLabel = 'Open navigation menu';

async function expectMobileMenuExpanded(page: Page, expanded: boolean) {
  await expect(
    page.getByRole('button', { name: openNavLabel }),
  ).toHaveAttribute('aria-expanded', String(expanded));
}

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
  await page.getByLabel('Email or username', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(/\/courses$/);
}

async function openSelectedCourseAssignments(page: Page, courseId: string) {
  const menuButton = page.getByRole('button', { name: openNavLabel });
  await expect(menuButton).toBeVisible();
  await expectMobileMenuExpanded(page, false);
  await menuButton.click();
  await expectMobileMenuExpanded(page, true);
  await expect(page.getByRole('button', { name: closeNavLabel })).toBeVisible();
  await page.getByRole('link', { name: 'Assignments', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/courses/${courseId}/assignments$`));
  await expect(
    page.getByRole('heading', { name: 'Your assignments' }),
  ).toBeVisible();
}

async function openMobileMenu(page: Page) {
  const menuButton = page.getByRole('button', { name: openNavLabel });
  await expect(menuButton).toBeVisible();
  await expectMobileMenuExpanded(page, false);
  await menuButton.click();
  await expectMobileMenuExpanded(page, true);
  await expect(page.getByRole('button', { name: closeNavLabel })).toBeVisible();
}

async function verifyStudentMobileView(page: Page, courseId: string) {
  await openMobileMenu(page);
  await expect(
    page.getByRole('link', { name: 'Discussions', exact: true }),
  ).toHaveAttribute('href', `/courses/${courseId}/forums`);
  await expect(
    page.getByRole('link', { name: 'My XP', exact: true }),
  ).toHaveAttribute('href', `/courses/${courseId}/xp`);
  await page.getByRole('button', { name: closeNavLabel }).click();
  await openSelectedCourseAssignments(page, courseId);
  await page.goto(`/courses/${courseId}`);

  await openMobileMenu(page);
  const nav = page.getByRole('navigation', { name: 'Course section links' });
  const discussionsLink = nav.getByRole('link', {
    name: 'Discussions',
    exact: true,
  });
  await expect(discussionsLink).toBeVisible();
  await discussionsLink.click({ timeout: 5000 });
  await expect(page).toHaveURL(new RegExp(`/courses/${courseId}/forums$`));
  await expect(
    page.getByRole('heading', { name: 'Discussions', exact: true }),
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

  await verifyStudentMobileView(page, fixture.studentCourseId);
  await page.goto(`/courses/${fixture.instructorCourseId}`);
  await expect(page.getByText('Course workspace · instructor')).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);

  await openMobileMenu(page);
  await expect(
    page.getByRole('link', { name: 'Discussions', exact: true }),
  ).toHaveAttribute('href', `/courses/${fixture.instructorCourseId}/forums`);
  await expect(
    page.getByRole('link', { name: 'Manage Users', exact: true }),
  ).toHaveAttribute(
    'href',
    `/courses/${fixture.instructorCourseId}/manage-users`,
  );
  await page.getByRole('button', { name: closeNavLabel }).click();

  await fixture.removeInstructorCourseMembership();
  await page.goto(`/courses/${fixture.instructorCourseId}`);
  await expect(page.getByText('This page could not be found.')).toBeVisible();
});
