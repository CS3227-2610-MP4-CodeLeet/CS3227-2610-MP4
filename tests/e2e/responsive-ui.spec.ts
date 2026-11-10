import { expect, type Page } from '@playwright/test';
import { test } from './helpers/responsive-ui-fixtures';
import { expectNoDocumentOverflow } from './helpers/responsive-layout';

const viewports = [320, 375, 768, 1024, 1440];

test.use({
  baseURL: process.env.ACCOUNT_TEST_BASE_URL ?? 'http://127.0.0.1:3100',
});

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/sign-in');
  await page.getByLabel('Email or username', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(/\/courses$/);
}

async function expectHeaderUsable(page: Page, admin: boolean) {
  const primaryNavigation = page.getByRole('navigation', {
    name: 'Primary navigation',
  });
  const accountNavigation = page.getByRole('navigation', {
    name: 'Account navigation',
  });
  await expect(
    primaryNavigation.getByRole('link', { name: 'Courses' }),
  ).toBeVisible();
  await expect(
    accountNavigation.getByRole('link', { name: 'Profile' }),
  ).toBeVisible();
  await expect(
    accountNavigation.getByRole('button', { name: 'Sign out' }),
  ).toBeVisible();
  await expect(
    accountNavigation.getByRole('button', { name: /mode/ }),
  ).toBeVisible();
  if (admin) {
    await expect(
      primaryNavigation.getByRole('link', { name: 'User roles' }),
    ).toBeVisible();
  }

  const controls = page.locator('header a, header button');
  for (const control of await controls.all()) {
    const bounds = await control.boundingBox();
    expect(bounds, 'header control should have a visible box').not.toBeNull();
    expect(
      bounds!.width,
      'header control should meet the 24px target width',
    ).toBeGreaterThanOrEqual(24);
    expect(
      bounds!.height,
      'header control should meet the 24px target height',
    ).toBeGreaterThanOrEqual(24);
  }

  await expectNoDocumentOverflow(page);
}

test('student, instructor, and admin headers remain usable across viewport widths', async ({
  page,
  courseWorkspaceFixture: fixture,
  responsiveAdminFixture,
}) => {
  await signIn(page, fixture.student.email, fixture.password);
  for (const width of viewports) {
    await page.setViewportSize({ width, height: 900 });
    await expectHeaderUsable(page, false);
  }

  await signIn(page, fixture.instructor.email, fixture.password);
  for (const width of viewports) {
    await page.setViewportSize({ width, height: 900 });
    await expectHeaderUsable(page, false);
  }

  await signIn(
    page,
    responsiveAdminFixture.email,
    responsiveAdminFixture.password,
  );
  for (const width of viewports) {
    await page.setViewportSize({ width, height: 900 });
    await expectHeaderUsable(page, true);
  }

  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'CodeLeet' })).toBeFocused();
});
