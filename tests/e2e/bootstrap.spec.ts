import { expect, test } from '@playwright/test';

test('app landing and student registration load without service credentials', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 400)
      errors.push(`${response.status()} ${response.url()}`);
  });

  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle(
    'CodeMentor | Programming Assignment Platform',
  );
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Programming Assignment Platform',
  );
  await expect(
    page.getByRole('link', { name: 'Create student account' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  expect(
    await page
      .locator('main')
      .evaluate((element) => getComputedStyle(element).display),
  ).toBe('flex');
  expect(errors).toEqual([]);
});

test('public registration offers a student account only and protected routes redirect', async ({
  page,
}) => {
  await page.goto('/sign-up');
  await expect(
    page.getByRole('heading', { name: 'Create student account' }),
  ).toBeVisible();
  await expect(page.getByLabel('Display name')).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
  await expect(page.getByLabel(/role|instructor/i)).toHaveCount(0);
  await page.goto('/student/assignments');
  await expect(page).toHaveURL(/\/sign-in$/);
});
